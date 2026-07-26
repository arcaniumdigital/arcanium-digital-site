import { XMLParser, XMLValidator } from "fast-xml-parser";

export type ListingLifecycle =
  | "draft"
  | "comingSoon"
  | "active"
  | "underOffer"
  | "underContract"
  | "sold"
  | "withdrawn"
  | "offMarket"
  | "archived";

export type MaterialEvent =
  | "NEW"
  | "UPDATED"
  | "SOLD"
  | "WITHDRAWN"
  | "DELETED"
  | "IMAGE_ERROR"
  | "FEED_ERROR"
  | "RECONCILIATION_MISMATCH";

export interface NormalizedListing {
  listingId: string;
  lifecycle: ListingLifecycle;
  address: string | null;
  canonicalUrl: string | null;
  soldPriceMinor: number | null;
  imageUrls: string[];
  contentHash: string;
  source: Record<string, unknown>;
}

export interface OperatorAction {
  actionId: string;
  dedupKey: string;
  listingId: string | null;
  actionType:
    | "missing_data"
    | "removal_approval"
    | "sold_evidence"
    | "source_site_mismatch"
    | "feed_security_critical";
  severity: "info" | "warning" | "error" | "critical";
  reason: string;
  approvalRequired: boolean;
  ownerGroup: "listing_ops" | "content_approvers" | "platform_ops";
}

export interface ParseResult {
  ok: boolean;
  listings: NormalizedListing[];
  errors: string[];
}

export interface ReconciliationResult {
  accepted: boolean;
  status: "completed" | "blocked";
  errorCode: string | null;
  preserveLastKnownGood: boolean;
  inputCount: number;
  acceptedCount: number;
  events: Array<{ listingId: string; eventType: MaterialEvent }>;
  counts: {
    new: number;
    updated: number;
    sold: number;
    withdrawn: number;
    deletedCandidates: number;
  };
  operatorActions: OperatorAction[];
  overflowActionCount: number;
}

const lifecycleAliases: Record<string, ListingLifecycle> = {
  draft: "draft",
  comingsoon: "comingSoon",
  "coming soon": "comingSoon",
  current: "active",
  available: "active",
  active: "active",
  underoffer: "underOffer",
  "under offer": "underOffer",
  undercontract: "underContract",
  "under contract": "underContract",
  conditional: "underContract",
  sold: "sold",
  withdrawn: "withdrawn",
  offmarket: "offMarket",
  "off market": "offMarket",
  deleted: "archived",
  archived: "archived",
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;

const firstString = (record: Record<string, unknown>, keys: string[]): string | null => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return null;
};

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value);
}

export function stableHash(value: unknown): string {
  const text = stableStringify(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function normalizeLifecycle(value: string | null): ListingLifecycle {
  if (!value) return "draft";
  return lifecycleAliases[value.toLowerCase().replace(/[_-]/g, " ")]
    ?? lifecycleAliases[value.toLowerCase().replace(/[\s_-]/g, "")]
    ?? "draft";
}

function normalizePriceMinor(record: Record<string, unknown>): number | null {
  const raw = record.soldPrice ?? record.sold_price ?? record.price;
  if (typeof raw === "number" && Number.isFinite(raw) && raw >= 0) return Math.round(raw * 100);
  if (typeof raw !== "string") return null;
  const parsed = Number(raw.replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) : null;
}

function normalizeImages(record: Record<string, unknown>): string[] {
  const candidate = record.images ?? record.imageUrls ?? record.image_urls ?? record.objects;
  const values = Array.isArray(candidate) ? candidate : candidate ? [candidate] : [];
  const urls = values.flatMap((value) => {
    if (typeof value === "string") return [value];
    const item = asRecord(value);
    const url = item ? firstString(item, ["url", "src", "#text"]) : null;
    return url ? [url] : [];
  });
  return [...new Set(urls.filter((url) => /^https?:\/\//i.test(url)))].slice(0, 50);
}

export function normalizeListing(candidate: unknown): NormalizedListing | null {
  const record = asRecord(candidate);
  if (!record) return null;
  const listingId = firstString(record, [
    "listingId", "listing_id", "uniqueID", "uniqueId", "id", "@_id", "@_uniqueID",
  ]);
  if (!listingId) return null;
  const lifecycle = normalizeLifecycle(firstString(record, ["status", "lifecycle", "state"]));
  const address = firstString(record, ["address", "displayAddress", "headline"]);
  const canonicalUrl = firstString(record, ["canonicalUrl", "canonical_url", "url"]);
  const normalizedSource = {
    listingId,
    lifecycle,
    address,
    canonicalUrl,
    soldPriceMinor: normalizePriceMinor(record),
    imageUrls: normalizeImages(record),
  };
  return {
    ...normalizedSource,
    contentHash: stableHash(normalizedSource),
    source: record,
  };
}

function extractJsonListings(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  const record = asRecord(value);
  if (!record) return [];
  for (const key of ["listings", "properties", "results", "items"]) {
    if (Array.isArray(record[key])) return record[key] as unknown[];
  }
  return [];
}

function collectXmlListings(value: unknown, output: unknown[]): void {
  if (Array.isArray(value)) {
    for (const item of value) collectXmlListings(item, output);
    return;
  }
  const record = asRecord(value);
  if (!record) return;
  for (const [key, item] of Object.entries(record)) {
    if (["property", "listing", "residential", "rental", "land", "commercial"].includes(key.toLowerCase())) {
      if (Array.isArray(item)) output.push(...item);
      else output.push(item);
    } else {
      collectXmlListings(item, output);
    }
  }
}

export function parseFeed(sourceType: "json" | "reaxml", raw: string): ParseResult {
  try {
    let candidates: unknown[] = [];
    if (sourceType === "json") {
      candidates = extractJsonListings(JSON.parse(raw));
    } else {
      const validation = XMLValidator.validate(raw);
      if (validation !== true) return { ok: false, listings: [], errors: ["MALFORMED_XML"] };
      const parsed = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        trimValues: true,
      }).parse(raw);
      collectXmlListings(parsed, candidates);
    }
    const listings = candidates.map(normalizeListing).filter((item): item is NormalizedListing => item !== null);
    const errors = listings.length === candidates.length ? [] : ["LISTINGS_WITHOUT_ID_SKIPPED"];
    return { ok: true, listings, errors };
  } catch {
    return {
      ok: false,
      listings: [],
      errors: [sourceType === "json" ? "MALFORMED_JSON" : "MALFORMED_XML"],
    };
  }
}

function action(
  listingId: string | null,
  actionType: OperatorAction["actionType"],
  severity: OperatorAction["severity"],
  reason: string,
  approvalRequired: boolean,
  ownerGroup: OperatorAction["ownerGroup"],
): OperatorAction {
  const dedupKey = `${actionType}:${listingId ?? "feed"}:${stableHash(reason)}`;
  return {
    actionId: `action:${dedupKey}`,
    dedupKey,
    listingId,
    actionType,
    severity,
    reason,
    approvalRequired,
    ownerGroup,
  };
}

export function reconcileListings(input: {
  parseResult: ParseResult;
  previous: NormalizedListing[];
  capturedAt: string;
  nowMs?: number;
  maxFeedAgeSeconds: number;
  maxCountDropRatio: number;
  maxOperatorActions: number;
}): ReconciliationResult {
  const blocked = (errorCode: string): ReconciliationResult => ({
    accepted: false,
    status: "blocked",
    errorCode,
    preserveLastKnownGood: true,
    inputCount: input.parseResult.listings.length,
    acceptedCount: 0,
    events: [{ listingId: "feed", eventType: "FEED_ERROR" }],
    counts: { new: 0, updated: 0, sold: 0, withdrawn: 0, deletedCandidates: 0 },
    operatorActions: [
      action(null, "feed_security_critical", "critical", errorCode, false, "platform_ops"),
    ],
    overflowActionCount: 0,
  });

  if (!input.parseResult.ok) return blocked(input.parseResult.errors[0] ?? "MALFORMED_FEED");
  if (input.parseResult.listings.length === 0) return blocked("EMPTY_FEED");
  const capturedMs = Date.parse(input.capturedAt);
  const nowMs = input.nowMs ?? Date.now();
  if (!Number.isFinite(capturedMs) || nowMs - capturedMs > input.maxFeedAgeSeconds * 1000) {
    return blocked("STALE_FEED");
  }
  if (
    input.previous.length >= 3
    && input.parseResult.listings.length < input.previous.length * (1 - input.maxCountDropRatio)
  ) {
    const result = blocked("ABNORMAL_COUNT_DROP");
    result.events = [{ listingId: "feed", eventType: "RECONCILIATION_MISMATCH" }];
    return result;
  }

  const previousById = new Map(input.previous.map((item) => [item.listingId, item]));
  const currentById = new Map(input.parseResult.listings.map((item) => [item.listingId, item]));
  const events: ReconciliationResult["events"] = [];
  const actions: OperatorAction[] = [];
  const counts = { new: 0, updated: 0, sold: 0, withdrawn: 0, deletedCandidates: 0 };

  for (const listing of input.parseResult.listings) {
    const prior = previousById.get(listing.listingId);
    if (!prior) {
      counts.new += 1;
      events.push({ listingId: listing.listingId, eventType: "NEW" });
    } else if (prior.contentHash !== listing.contentHash) {
      counts.updated += 1;
      events.push({ listingId: listing.listingId, eventType: "UPDATED" });
    }
    if (prior?.lifecycle !== "sold" && listing.lifecycle === "sold") {
      counts.sold += 1;
      events.push({ listingId: listing.listingId, eventType: "SOLD" });
      actions.push(action(
        listing.listingId,
        "sold_evidence",
        "warning",
        "Sold evidence and sold-price publication require human approval",
        true,
        "content_approvers",
      ));
    }
    if (prior?.lifecycle !== "withdrawn" && listing.lifecycle === "withdrawn") {
      counts.withdrawn += 1;
      events.push({ listingId: listing.listingId, eventType: "WITHDRAWN" });
    }
    if (!listing.address || !listing.canonicalUrl) {
      actions.push(action(
        listing.listingId,
        "missing_data",
        "warning",
        "Listing is missing an address or canonical URL",
        false,
        "listing_ops",
      ));
    }
    if (listing.imageUrls.length === 0) {
      events.push({ listingId: listing.listingId, eventType: "IMAGE_ERROR" });
      actions.push(action(
        listing.listingId,
        "missing_data",
        "warning",
        "Listing has no valid HTTP image URL",
        false,
        "listing_ops",
      ));
    }
  }

  for (const prior of input.previous) {
    if (currentById.has(prior.listingId)) continue;
    counts.deletedCandidates += 1;
    events.push({ listingId: prior.listingId, eventType: "DELETED" });
    actions.push(action(
      prior.listingId,
      "removal_approval",
      "error",
      "Source omission detected; preserve public URL until destructive disposition is approved",
      true,
      "content_approvers",
    ));
  }

  const operatorActions = actions.slice(0, input.maxOperatorActions);
  return {
    accepted: true,
    status: "completed",
    errorCode: null,
    preserveLastKnownGood: false,
    inputCount: input.parseResult.listings.length,
    acceptedCount: input.parseResult.listings.length,
    events,
    counts,
    operatorActions,
    overflowActionCount: Math.max(0, actions.length - operatorActions.length),
  };
}
