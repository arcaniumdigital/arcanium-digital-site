import { describe, expect, it } from "vitest";
import {
  analyzeLiveHtml,
  parsePreflightRequest,
  safePublicationUrl,
  validatePreflight,
  type PreflightRequest,
} from "../src/domain";

const hosts = new Set(["arcaniumdigital.com", "www.arcaniumdigital.com"]);
const valid: PreflightRequest = {
  schema_version: "1.0",
  request_id: "a3-request-1",
  idempotency_key: "a3-idempotency-1",
  correlation_id: "a3-correlation-1",
  client_id: "TEST-0001",
  environment: "test",
  document_id: "page-service-automation",
  revision_id: "revision-test-1",
  action: "publish",
  url: "https://www.arcaniumdigital.com/services/automation",
  slug: "services/automation",
  page_type: "service",
  ownership_key: "service:automation",
  title: "Automation Services for Growing Australian Businesses",
  meta_description:
    "Explore practical automation services designed to reduce manual work and improve reliable client operations across Australian businesses.",
  h1: "Automation services built for reliable growth",
  body_word_count: 900,
  schema_types: ["WebPage", "Service", "BreadcrumbList"],
  image_count: 2,
  cta_count: 1,
  established_page: false,
  material_change: true,
};

describe("A3 preflight parsing and URL policy", () => {
  it("parses a complete strict preflight request", () => {
    expect(parsePreflightRequest(valid)).toEqual(valid);
  });

  it("rejects malformed counts and page types", () => {
    expect(parsePreflightRequest({ ...valid, body_word_count: -1 })).toBe("INVALID_BODY_WORD_COUNT");
    expect(parsePreflightRequest({ ...valid, page_type: "listing" })).toBe("INVALID_PAGE_TYPE");
  });

  it("allows only approved HTTPS origins without credentials, ports or fragments", () => {
    expect(safePublicationUrl(valid.url, hosts)?.hostname).toBe("www.arcaniumdigital.com");
    expect(safePublicationUrl("http://www.arcaniumdigital.com/services/automation", hosts)).toBeNull();
    expect(safePublicationUrl("https://example.com/services/automation", hosts)).toBeNull();
    expect(safePublicationUrl("https://user:pass@www.arcaniumdigital.com/x", hosts)).toBeNull();
  });
});

describe("A3 deterministic preflight", () => {
  it("passes a substantive approved-host publication and schedules four reviews", () => {
    expect(validatePreflight(valid, { allowedHosts: hosts, maxOperatorActions: 15 })).toMatchObject({
      passed: true,
      issues: [],
      overflow_action_count: 0,
      llm_review_eligible: true,
      operator_actions: [
        { action_type: "performance_review" },
        { action_type: "performance_review" },
        { action_type: "performance_review" },
        { action_type: "performance_review" },
      ],
    });
  });

  it("blocks demo and thin content before publication", () => {
    const result = validatePreflight({
      ...valid,
      title: "Demo content placeholder",
      body_word_count: 100,
    }, { allowedHosts: hosts, maxOperatorActions: 15 });
    expect(result.passed).toBe(false);
    expect(result.issues.map((value) => value.code)).toEqual(
      expect.arrayContaining(["DEMO_CONTENT_DETECTED", "THIN_CONTENT"]),
    );
  });

  it("binds the slug to the exact URL path", () => {
    const result = validatePreflight(
      { ...valid, slug: "services/wrong" },
      { allowedHosts: hosts, maxOperatorActions: 15 },
    );
    expect(result.passed).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "SLUG_URL_MISMATCH" }));
  });

  it("requires approval for proof-bearing schema", () => {
    const result = validatePreflight(
      { ...valid, schema_types: ["WebPage", "AggregateRating"] },
      { allowedHosts: hosts, maxOperatorActions: 15 },
    );
    expect(result.passed).toBe(false);
    expect(result.issues).toContainEqual(expect.objectContaining({
      code: "SENSITIVE_SCHEMA_APPROVAL_REQUIRED",
      approval_required: true,
    }));
  });

  it("requires a disposition before unpublishing an established page", () => {
    const result = validatePreflight({
      ...valid,
      action: "unpublish",
      established_page: true,
    }, { allowedHosts: hosts, maxOperatorActions: 15 });
    expect(result.issues).toContainEqual(expect.objectContaining({
      code: "UNPUBLISH_APPROVAL_REQUIRED",
    }));
  });

  it("caps operator actions and reports overflow", () => {
    const result = validatePreflight({
      ...valid,
      title: "Short",
      meta_description: "Short",
      h1: "No",
      body_word_count: 0,
      schema_types: ["Unsupported", "AggregateRating"],
      image_count: 0,
      cta_count: 0,
    }, { allowedHosts: hosts, maxOperatorActions: 3 });
    expect(result.operator_actions).toHaveLength(3);
    expect(result.overflow_action_count).toBeGreaterThan(0);
  });
});

describe("A3 live HTML analysis", () => {
  it("passes title, H1, canonical, JSON-LD, alt text and CTA checks", () => {
    const html = `
      <html><head>
        <title>Automation services</title>
        <link rel="canonical" href="https://www.arcaniumdigital.com/services/automation">
        <script type="application/ld+json">{"@type":"Service"}</script>
      </head><body>
        <h1>Automation services</h1>
        <img src="/hero.jpg" alt="Automation workflow">
        <a data-cta href="/contact">Book a consultation</a>
      </body></html>`;
    expect(analyzeLiveHtml(
      html,
      new URL(valid.url),
      "https://www.arcaniumdigital.com",
    )).toMatchObject({
      passed: true,
      title_present: true,
      single_h1: true,
      canonical_matches: true,
      json_ld_present: true,
      image_count: 1,
      images_with_alt: 1,
      cta_present: true,
    });
  });

  it("reports compact deterministic live-page failures", () => {
    const result = analyzeLiveHtml(
      "<html><body><h1>One</h1><h1>Two</h1><img src='/missing-alt.jpg'></body></html>",
      new URL(valid.url),
      "https://www.arcaniumdigital.com",
    );
    expect(result.passed).toBe(false);
    expect(result.issues.map((value) => value.code)).toEqual(expect.arrayContaining([
      "LIVE_TITLE_MISSING",
      "LIVE_H1_COUNT_INVALID",
      "LIVE_CANONICAL_MISMATCH",
      "LIVE_JSON_LD_MISSING",
      "LIVE_IMAGE_ALT_MISSING",
      "LIVE_CTA_MISSING",
    ]));
  });
});
