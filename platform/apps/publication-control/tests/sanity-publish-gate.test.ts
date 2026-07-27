import { describe, expect, it, vi } from "vitest";
import type { PreflightRequest } from "../src/domain";
import { publishWithSeoValidation } from "../src/sanity-publish-gate";

const document: PreflightRequest = {
  schema_version: "1.0",
  request_id: "sanity-action-test",
  idempotency_key: "sanity-action-test",
  correlation_id: "sanity-action-test",
  client_id: "TEST-0001",
  environment: "test",
  document_id: "service-automation",
  revision_id: "rev-action-test",
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
  schema_types: ["WebPage", "Service"],
  image_count: 2,
  cta_count: 1,
  established_page: false,
  material_change: true,
};

function proxyResponse(body: unknown, status = 200): typeof fetch {
  return vi.fn(async () => new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  })) as unknown as typeof fetch;
}

describe("Sanity publish gate", () => {
  it("blocks the publish callback when deterministic preflight fails", async () => {
    const publish = vi.fn(async () => undefined);
    await expect(publishWithSeoValidation({
      proxyUrl: "https://studio.example.test/api/a3/publish",
      document,
      fetcher: proxyResponse({
        passed: false,
        preflight_token_issued: false,
        publish_permitted: false,
        issue_codes: ["THIN_CONTENT"],
      }),
      publish,
    })).rejects.toThrow("PUBLICATION_PREFLIGHT_BLOCKED:THIN_CONTENT");
    expect(publish).not.toHaveBeenCalled();
  });

  it("keeps TEST publishing blocked even after a valid token is consumed", async () => {
    const publish = vi.fn(async () => undefined);
    await expect(publishWithSeoValidation({
      proxyUrl: "https://studio.example.test/api/a3/publish",
      document,
      fetcher: proxyResponse({
        passed: true,
        preflight_token_issued: true,
        publish_permitted: false,
        issue_codes: [],
      }),
      publish,
    })).rejects.toThrow("PUBLICATION_PERMISSION_DISABLED");
    expect(publish).not.toHaveBeenCalled();
  });

  it("publishes only after the trusted proxy explicitly permits it", async () => {
    const publish = vi.fn(async () => undefined);
    const result = await publishWithSeoValidation({
      proxyUrl: "https://studio.example.test/api/a3/publish",
      document,
      fetcher: proxyResponse({
        passed: true,
        preflight_token_issued: true,
        publish_permitted: true,
        issue_codes: [],
      }),
      publish,
    });
    expect(result.publish_permitted).toBe(true);
    expect(publish).toHaveBeenCalledOnce();
  });
});

