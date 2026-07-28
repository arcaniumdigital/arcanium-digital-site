import { createHmac, randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { handleRequest, type Env } from "../src/index";
import type { PreflightRequest } from "../src/domain";

class FakeStatement {
  private values: unknown[] = [];

  constructor(
    private readonly sql: string,
    private readonly state: {
      nonces: Set<string>;
      preflights: Map<string, { status: string; token_hash: string }>;
      urlOwners: Map<string, string>;
      writeCount: number;
    },
  ) {}

  bind(...values: unknown[]): FakeStatement {
    this.values = values;
    return this;
  }

  async run(): Promise<D1Result<unknown>> {
    let changes = 0;
    if (this.sql.includes("INSERT INTO publication_nonces")) {
      const nonce = String(this.values[0]);
      if (this.state.nonces.has(nonce)) throw new Error("unique");
      this.state.nonces.add(nonce);
      changes = 1;
    } else if (this.sql.includes("INSERT INTO publication_preflights")) {
      const key = this.values.slice(0, 5).join("|");
      this.state.preflights.set(key, {
        token_hash: String(this.values[7]),
        status: "issued",
      });
      changes = 1;
    } else if (this.sql.includes("UPDATE publication_preflights SET status = 'consumed'")) {
      const key = this.values.slice(1, 6).join("|");
      const current = this.state.preflights.get(key);
      const tokenHash = String(this.values[6]);
      if (current?.status === "issued" && current.token_hash === tokenHash) {
        current.status = "consumed";
        changes = 1;
      }
    } else if (this.sql.includes("INSERT INTO publication_")) {
      this.state.writeCount += 1;
      changes = 1;
    }
    return {
      success: true,
      meta: {
        duration: 0,
        size_after: 0,
        rows_read: 0,
        rows_written: 0,
        last_row_id: 0,
        changed_db: false,
        changes,
      },
      results: [],
    };
  }

  async first<T>(): Promise<T | null> {
    if (this.sql.includes("FROM publication_url_registry")) {
      const key = this.values.slice(0, 3).join("|");
      const documentId = this.state.urlOwners.get(key);
      return (documentId ? { document_id: documentId } : null) as T | null;
    }
    if (this.sql.includes("FROM publication_preflights")) {
      const key = this.values.slice(0, 5).join("|");
      return (this.state.preflights.get(key) ?? null) as T | null;
    }
    return null;
  }
}

class FakeD1 {
  readonly state = {
    nonces: new Set<string>(),
    preflights: new Map<string, { status: string; token_hash: string }>(),
    urlOwners: new Map<string, string>(),
    writeCount: 0,
  };

  prepare(sql: string): D1PreparedStatement {
    return new FakeStatement(sql, this.state) as unknown as D1PreparedStatement;
  }
}

const secret = "publication-control-test-secret";
const valid: PreflightRequest = {
  schema_version: "1.0",
  request_id: "a3-request-worker",
  idempotency_key: "a3-idem-worker",
  correlation_id: "a3-correlation-worker",
  client_id: "TEST-0001",
  environment: "test",
  document_id: "service-automation",
  revision_id: "rev-1",
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

function environment(database = new FakeD1()): Env {
  return {
    ENVIRONMENT: "test",
    TEST_CLIENT_IDS: "TEST-0001",
    ALLOWED_PUBLICATION_HOSTS: "arcaniumdigital.com,www.arcaniumdigital.com",
    MAX_REQUEST_BYTES: "65536",
    MAX_HTML_BYTES: "262144",
    MAX_TIMEOUT_MS: "10000",
    MAX_OPERATOR_ACTIONS: "15",
    PREFLIGHT_TTL_SECONDS: "600",
    REPLAY_WINDOW_SECONDS: "300",
    PREFLIGHT_HMAC_SECRET: secret,
    ALLOW_SANITY_PUBLISH: "false",
    ALLOW_SANITY_UNPUBLISH: "false",
    ALLOW_INDEXNOW_SUBMIT: "false",
    ALLOW_WEBSITE_REVALIDATION: "false",
    ALLOW_LLM_REVIEW: "false",
    ALLOW_PUBLIC_SEND: "false",
    PUBLICATION_DB: database as unknown as D1Database,
  };
}

function signedRequest(path: string, body: unknown): Request {
  const raw = JSON.stringify(body);
  const timestamp = new Date().toISOString();
  const nonce = randomUUID();
  const signature = createHmac("sha256", secret)
    .update(`${timestamp}.${nonce}.${raw}`)
    .digest("hex");
  return new Request(`https://publication.test${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-automation-timestamp": timestamp,
      "x-automation-nonce": nonce,
      "x-automation-signature": `sha256=${signature}`,
    },
    body: raw,
  });
}

describe("A3 publication-control Worker", () => {
  it("reports every production-affecting feature disabled", async () => {
    const response = await handleRequest(new Request("https://publication.test/health"), environment());
    expect(await response.json()).toMatchObject({
      ok: true,
      data: {
        environment: "test",
        production_actions_enabled: false,
        max_operator_actions: 15,
        safety: {
          sanity_publish: "false",
          sanity_unpublish: "false",
          indexnow_submit: "false",
          website_revalidation: "false",
          llm_review: "false",
          public_send: "false",
        },
      },
    });
  });

  it("requires exact-body HMAC authentication", async () => {
    const response = await handleRequest(new Request("https://publication.test/v1/preflight", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(valid),
    }), environment());
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ error: { code: "SIGNATURE_HEADERS_REQUIRED" } });
  });

  it("issues a revision/action/URL-bound token after deterministic validation", async () => {
    const response = await handleRequest(signedRequest("/v1/preflight", valid), environment());
    const payload = await response.json() as {
      data: { preflight_token: string; token_binding: Record<string, string>; passed: boolean };
    };
    expect(response.status).toBe(200);
    expect(payload.data.passed).toBe(true);
    expect(payload.data.preflight_token).toMatch(/^[A-Za-z0-9_-]+\.[a-f0-9]{64}$/);
    expect(payload.data.token_binding).toMatchObject({
      document_id: valid.document_id,
      revision_id: valid.revision_id,
      action: valid.action,
      url: valid.url,
    });
  });

  it("returns deterministic issues without issuing a token", async () => {
    const response = await handleRequest(signedRequest("/v1/preflight", {
      ...valid,
      url: "https://example.com/services/automation",
    }), environment());
    const payload = await response.json() as {
      ok: boolean;
      data: { passed: boolean; preflight_token: null; issues: Array<{ code: string }> };
    };
    expect(payload).toMatchObject({
      ok: true,
      data: {
        passed: false,
        preflight_token: null,
      },
    });
    expect(payload.data.issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "URL_NOT_ALLOWED" })]),
    );
  });

  it("rejects token consumption when the requested revision binding changes", async () => {
    const env = environment();
    const issued = await handleRequest(signedRequest("/v1/preflight", valid), env);
    const issuedPayload = await issued.json() as { data: { preflight_token: string } };
    const response = await handleRequest(signedRequest("/v1/preflight/consume", {
      preflight_token: issuedPayload.data.preflight_token,
      client_id: valid.client_id,
      document_id: valid.document_id,
      revision_id: "rev-changed",
      action: valid.action,
      url: valid.url,
    }), env);
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      error: { code: "PREFLIGHT_TOKEN_BINDING_MISMATCH" },
    });
  });

  it("consumes a preflight token atomically and rejects its reuse", async () => {
    const env = environment();
    const issued = await handleRequest(signedRequest("/v1/preflight", valid), env);
    const issuedPayload = await issued.json() as { data: { preflight_token: string } };
    const consumeBody = {
      preflight_token: issuedPayload.data.preflight_token,
      client_id: valid.client_id,
      document_id: valid.document_id,
      revision_id: valid.revision_id,
      action: valid.action,
      url: valid.url,
    };
    const first = await handleRequest(signedRequest("/v1/preflight/consume", consumeBody), env);
    expect(first.status).toBe(200);
    expect(await first.json()).toMatchObject({
      data: {
        consumed: true,
        publish_permitted: false,
        unpublish_permitted: false,
      },
    });

    const replay = await handleRequest(signedRequest("/v1/preflight/consume", consumeBody), env);
    expect(replay.status).toBe(409);
    expect(await replay.json()).toMatchObject({
      error: { code: "PREFLIGHT_TOKEN_NOT_ISSUED" },
    });
  });

  it("stores compact TEST results and caps Make operator actions at 15", async () => {
    const database = new FakeD1();
    const result = {
      schema_version: "1.0",
      publication_id: "pub-test-0001",
      idempotency_key: "pub-test-0001",
      correlation_id: "corr-test-0001",
      client_id: valid.client_id,
      environment: valid.environment,
      document_id: valid.document_id,
      revision_id: valid.revision_id,
      action: valid.action,
      url: valid.url,
      page_type: valid.page_type,
      ownership_key: valid.ownership_key,
      status: "validated_test",
      deterministic_passed: true,
      live_verified: false,
      issues: [],
      operator_actions: Array.from({ length: 18 }, (_, index) => ({
        action_type: "performance_review",
        owner_group: "operations",
        approval_required: false,
        safe_summary: `Review ${index + 1}`,
      })),
      overflow_action_count: 2,
      evidence_ref: "TEST-A3-EVIDENCE",
    };
    const response = await handleRequest(
      signedRequest("/v1/publication-result", result),
      environment(database),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      ok: true,
      data: {
        stored: true,
        operator_action_count: 15,
        overflow_action_count: 5,
        make_payload: {
          make_action_cap: 15,
          operator_action_count: 15,
          operator_actions: expect.any(Array),
        },
      },
    });
    expect(database.state.writeCount).toBe(17);
  });

  it("rejects production result ingestion in the TEST worker", async () => {
    const response = await handleRequest(signedRequest("/v1/publication-result", {
      schema_version: "1.0",
      publication_id: "pub-production",
      idempotency_key: "pub-production",
      correlation_id: "corr-production",
      client_id: valid.client_id,
      environment: "production",
      document_id: valid.document_id,
      revision_id: valid.revision_id,
      action: valid.action,
      url: valid.url,
      page_type: valid.page_type,
      ownership_key: valid.ownership_key,
      status: "validated_test",
      deterministic_passed: true,
      live_verified: false,
      issues: [],
      operator_actions: [],
      overflow_action_count: 0,
    }), environment());
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ error: { code: "ENVIRONMENT_MISMATCH" } });
  });
});
