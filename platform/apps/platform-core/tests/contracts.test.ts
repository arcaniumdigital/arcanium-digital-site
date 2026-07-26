import { describe, expect, it } from "vitest";
import { constantTimeEqual, validateEventCandidate } from "../src/index";
import { validateClientConfigCandidate } from "../../../packages/contracts/src/client-config";

const validEvent = {
  schema_version: "1.0",
  event_id: "event-test-1",
  idempotency_key: "idem-test-1",
  correlation_id: "corr-test-1",
  automation_id: "A13",
  event_type: "website.project.requested",
  client_id: "TEST-0001",
  environment: "test",
  occurred_at: "2026-07-26T00:00:00.000Z",
  severity: "info",
  payload: {},
};

describe("event contract", () => {
  it("accepts a valid TEST event", () => {
    expect(validateEventCandidate(validEvent, "test", ["TEST-0001"])).toMatchObject({ ok: true });
  });

  it.each([
    [{ ...validEvent, environment: "production" }, "ENVIRONMENT_MISMATCH"],
    [{ ...validEvent, client_id: "TEST-0002" }, "CLIENT_NOT_ALLOWED"],
    [{ ...validEvent, automation_id: "A16" }, "INVALID_AUTOMATION"],
    [{ ...validEvent, severity: "debug" }, "INVALID_SEVERITY"],
    [{ ...validEvent, occurred_at: "not-a-date" }, "INVALID_OCCURRED_AT"],
    [{ ...validEvent, payload: [] }, "INVALID_PAYLOAD"],
  ])("rejects invalid event with %s", (event, code) => {
    expect(validateEventCandidate(event, "test", ["TEST-0001"])).toMatchObject({ ok: false, code });
  });

  it("accepts the complete A1-A15 automation range", () => {
    for (let index = 1; index <= 15; index += 1) {
      expect(validateEventCandidate(
        { ...validEvent, automation_id: `A${index}` },
        "test",
        ["TEST-0001"],
      )).toMatchObject({ ok: true });
    }
  });
});

describe("signature comparison", () => {
  it("matches identical lowercase hex", () => {
    expect(constantTimeEqual("a".repeat(64), "a".repeat(64))).toBe(true);
  });

  it("rejects different values and lengths", () => {
    expect(constantTimeEqual("a".repeat(64), "b".repeat(64))).toBe(false);
    expect(constantTimeEqual("a", "aa")).toBe(false);
  });
});

const validClientConfig = {
  schemaVersion: "1.0",
  environment: "test",
  clientId: "TEST-0001",
  displayName: "Test client",
  status: "onboarding",
  timezone: "Australia/Brisbane",
  currency: "AUD",
  entity: {
    agentName: "Test Agent",
    serviceAreas: ["Brisbane"],
    websiteOrigin: "https://example.test",
    sameAs: [],
  },
  website: {
    canonicalDomain: "https://example.test",
    githubRepository: "example/site",
    vercelProjectId: "project-test",
    sanityProjectId: "project",
    sanityDataset: "production",
  },
  google: {
    searchConsoleProperty: "sc-domain:example.test",
    ga4PropertyId: "123",
    businessProfileAccountId: "account",
    businessProfileLocationIds: ["location"],
  },
  search: {
    targetTerms: [],
    targetLocations: [],
    competitorDomains: [],
    pageOwnership: [],
  },
  listings: { sourceType: "manual" },
  communications: {
    operatorEmails: [],
    approvalEmails: [],
    testEmails: [],
    testPhones: [],
  },
  automation: {
    enabled: {},
    schedules: {},
    actionCaps: {},
    providerBudgets: {},
  },
  service: {},
  approvals: {
    websiteLaunchOwners: [],
    contentOwners: [],
    gbpOwners: [],
    outreachOwners: [],
    financialOwners: [],
  },
};

describe("client configuration contract", () => {
  it("accepts a strict TEST configuration", () => {
    expect(validateClientConfigCandidate(validClientConfig)).toEqual([]);
  });

  it("rejects unknown and secret-like fields", () => {
    expect(validateClientConfigCandidate({
      ...validClientConfig,
      apiKey: "must-not-be-here",
    })).toEqual(expect.arrayContaining([
      "config.apiKey is not allowed",
      "config contains a prohibited secret-like field",
    ]));
  });

  it("rejects enabled automations without their provider identifiers", () => {
    const config = {
      ...structuredClone(validClientConfig),
      automation: {
        ...validClientConfig.automation,
        enabled: { A4: true, A5: true },
      },
      google: { businessProfileLocationIds: [] },
    };
    expect(validateClientConfigCandidate(config)).toEqual(expect.arrayContaining([
      "A4 requires Business Profile identifiers",
      "A5/A11 require Search Console and GA4 identifiers",
    ]));
  });

  it("rejects production configs containing TEST recipients or resources", () => {
    expect(validateClientConfigCandidate({
      ...validClientConfig,
      environment: "production",
      communications: {
        ...validClientConfig.communications,
        testEmails: ["operator@example.test"],
      },
    })).toEqual(expect.arrayContaining([
      "production config must not contain test recipients",
      "production config must not reference test website resources",
    ]));
  });
});
