import { describe, expect, it } from "vitest";
import initialFeed from "../../../packages/test-fixtures/a2/feed-initial.json";
import { normalizeListing, parseFeed, reconcileListings, stableHash } from "../src/domain";

const capturedAt = "2026-07-26T08:00:00.000Z";
const nowMs = Date.parse("2026-07-26T08:05:00.000Z");

const reconcile = (
  parseResult: ReturnType<typeof parseFeed>,
  previous: NonNullable<ReturnType<typeof normalizeListing>>[] = [],
  overrides: Partial<Parameters<typeof reconcileListings>[0]> = {},
) => reconcileListings({
  parseResult,
  previous,
  capturedAt,
  nowMs,
  maxFeedAgeSeconds: 3600,
  maxCountDropRatio: 0.35,
  maxOperatorActions: 20,
  ...overrides,
});

describe("A2 feed parsing", () => {
  it("normalizes JSON listings", () => {
    const result = parseFeed("json", JSON.stringify(initialFeed));
    expect(result.ok).toBe(true);
    expect(result.listings).toHaveLength(3);
    expect(result.listings[1]).toMatchObject({
      listingId: "L-200",
      lifecycle: "underOffer",
      soldPriceMinor: 82000000,
    });
  });

  it("normalizes REAXML attributes and lifecycle values", () => {
    const xml = `<?xml version="1.0"?><propertyList>
      <residential id="L-100"><status>sold</status><address>1 Test St</address>
      <canonicalUrl>https://example.test/l-100</canonicalUrl><soldPrice>775000</soldPrice>
      <images><image><url>https://images.example.test/1.jpg</url></image></images></residential>
    </propertyList>`;
    const result = parseFeed("reaxml", xml);
    expect(result.ok).toBe(true);
    expect(result.listings[0]).toMatchObject({
      listingId: "L-100",
      lifecycle: "sold",
      soldPriceMinor: 77500000,
    });
  });

  it("rejects malformed JSON and XML", () => {
    expect(parseFeed("json", "{").errors).toContain("MALFORMED_JSON");
    expect(parseFeed("reaxml", "<propertyList>").errors).toContain("MALFORMED_XML");
  });

  it("produces stable hashes independent of object key order", () => {
    expect(stableHash({ a: 1, b: 2 })).toBe(stableHash({ b: 2, a: 1 }));
  });
});

describe("A2 last-known-good safeguards", () => {
  const previous = parseFeed("json", JSON.stringify(initialFeed)).listings;

  it.each([
    ["malformed", parseFeed("json", "{"), "MALFORMED_JSON"],
    ["empty", parseFeed("json", "{\"listings\":[]}"), "EMPTY_FEED"],
  ])("blocks %s feeds and preserves verified state", (_label, parsed, error) => {
    expect(reconcile(parsed, previous)).toMatchObject({
      accepted: false,
      preserveLastKnownGood: true,
      errorCode: error,
      acceptedCount: 0,
    });
  });

  it("blocks stale feeds", () => {
    expect(reconcile(parseFeed("json", JSON.stringify(initialFeed)), previous, {
      capturedAt: "2026-07-25T00:00:00.000Z",
    })).toMatchObject({
      accepted: false,
      errorCode: "STALE_FEED",
      preserveLastKnownGood: true,
    });
  });

  it("blocks abnormal count drops before creating deletion actions", () => {
    const oneListing = parseFeed("json", JSON.stringify({ listings: initialFeed.listings.slice(0, 1) }));
    const result = reconcile(oneListing, previous);
    expect(result).toMatchObject({
      accepted: false,
      errorCode: "ABNORMAL_COUNT_DROP",
      preserveLastKnownGood: true,
    });
    expect(result.counts.deletedCandidates).toBe(0);
  });
});

describe("A2 lifecycle reconciliation", () => {
  it("creates technical events but approval-gates sold price and removal", () => {
    const previous = parseFeed("json", JSON.stringify(initialFeed)).listings;
    const current = parseFeed("json", JSON.stringify({
      listings: [
        { ...initialFeed.listings[0], status: "sold", soldPrice: 775000 },
        { ...initialFeed.listings[1], status: "withdrawn" },
        {
          listingId: "L-400",
          status: "active",
          address: "4 Test Street",
          canonicalUrl: "https://example.test/listings/l-400",
          images: ["https://images.example.test/l-400/1.jpg"],
        },
      ],
    }));
    const result = reconcile(current, previous);
    expect(result.accepted).toBe(true);
    expect(result.counts).toEqual({
      new: 1,
      updated: 2,
      sold: 1,
      withdrawn: 1,
      deletedCandidates: 1,
    });
    expect(result.events).toEqual(expect.arrayContaining([
      { listingId: "L-100", eventType: "SOLD" },
      { listingId: "L-200", eventType: "WITHDRAWN" },
      { listingId: "L-300", eventType: "DELETED" },
    ]));
    expect(result.operatorActions).toEqual(expect.arrayContaining([
      expect.objectContaining({ listingId: "L-100", actionType: "sold_evidence", approvalRequired: true }),
      expect.objectContaining({ listingId: "L-300", actionType: "removal_approval", approvalRequired: true }),
    ]));
  });

  it("caps Make-facing operator actions at 20 and reports overflow", () => {
    const current = parseFeed("json", JSON.stringify({
      listings: Array.from({ length: 25 }, (_, index) => ({
        listingId: `L-${index}`,
        status: "active",
      })),
    }));
    const result = reconcile(current, [], { maxOperatorActions: 20 });
    expect(result.operatorActions).toHaveLength(20);
    expect(result.overflowActionCount).toBeGreaterThan(0);
  });

  it("never performs a destructive mutation in reconciliation output", () => {
    const previous = parseFeed("json", JSON.stringify(initialFeed)).listings;
    const current = parseFeed("json", JSON.stringify({ listings: initialFeed.listings.slice(0, 2) }));
    const result = reconcile(current, previous, { maxCountDropRatio: 0.9 });
    expect(result.operatorActions.find((item) => item.actionType === "removal_approval")).toMatchObject({
      approvalRequired: true,
    });
    expect(JSON.stringify(result)).not.toContain("googleIndexing");
  });
});
