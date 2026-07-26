import { describe, expect, it } from "vitest";
import { constantTimeEqual, validateEventCandidate } from "../src/index";
import { validateClientConfigCandidate } from "../../../packages/contracts/src/client-config";
import {
  evaluateActivationGate,
  type AutomationActivationEvidence,
} from "../../../packages/contracts/src/activation-gate";
import {
  AUTOMATION_ACTION_CEILINGS,
  validateAutomationResultCandidate,
} from "../../../packages/contracts/src/automation-result";
import { validateActionResolutionCandidate } from "../../../packages/contracts/src/action-resolution";
import goldenEvents from "../../../packages/test-fixtures/golden-events.json";
import resultFixtures from "../../../packages/test-fixtures/automation-results.json";
import activationGates from "../../../readiness/TEST-0001/ACTIVATION_GATES.json";

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

describe("A1-A15 golden fixtures", () => {
  it("covers every automation exactly once with safe TEST payloads", () => {
    const ids = goldenEvents.fixtures.map((fixture) => fixture.automation_id);
    expect(ids).toEqual(Array.from({ length: 15 }, (_, index) => `A${index + 1}`));
    expect(new Set(ids).size).toBe(15);
    expect(goldenEvents.environment).toBe("test");
    expect(goldenEvents.defaults.forbidden_side_effects).toContain("public_message");
    expect(goldenEvents.defaults.forbidden_side_effects).toContain("dangerous_replay");

    for (const fixture of goldenEvents.fixtures) {
      expect(fixture.payload).toMatchObject({ test_only: true });
      expect(validateEventCandidate({
        ...validEvent,
        automation_id: fixture.automation_id,
        event_type: fixture.event_type,
        payload: fixture.payload,
      }, "test", ["TEST-0001"])).toMatchObject({ ok: true });
    }
  });
});

describe("automation activation gates", () => {
  it("covers A1-A15 and blocks every production activation", () => {
    const ids = activationGates.automations.map((item) => item.automation_id);
    expect(ids).toEqual(Array.from({ length: 15 }, (_, index) => `A${index + 1}`));

    for (const item of activationGates.automations) {
      const decision = evaluateActivationGate({
        ...item,
        client_id: activationGates.client_id,
        environment: activationGates.environment,
      } as AutomationActivationEvidence);
      expect(decision.test_ready).toBe(true);
      expect(decision.production_ready).toBe(false);
      if (item.cross_client_isolation_passed) {
        expect(decision.blockers).not.toContain("cross_client_isolation_passed");
      } else {
        expect(decision.blockers).toContain("cross_client_isolation_passed");
      }
      if (item.rollback_tested) {
        expect(decision.blockers).not.toContain("rollback_tested");
      } else {
        expect(decision.blockers).toContain("rollback_tested");
      }
      expect(decision.blockers).toContain("production_approved");
    }
  });

  it("requires an explicit production environment and every production gate", () => {
    const ready = {
      ...activationGates.automations[0],
      client_id: activationGates.client_id,
      environment: "production",
      provider_workflow_verified: true,
      cross_client_isolation_passed: true,
      rollback_tested: true,
      production_approved: true,
    } as AutomationActivationEvidence;

    expect(evaluateActivationGate(ready)).toEqual({
      test_ready: true,
      production_ready: true,
      blockers: [],
    });
    expect(evaluateActivationGate({ ...ready, environment: "test" }).production_ready).toBe(false);
  });
});

const validAutomationResult = {
  schema_version: "1.0",
  result_id: "result-a2-1",
  run_id: "run-a2-1",
  idempotency_key: "result-idem-a2-1",
  correlation_id: "corr-a2-1",
  automation_id: "A2",
  client_id: "TEST-0001",
  environment: "test",
  provider: "fixture",
  status: "completed",
  started_at: "2026-07-26T00:00:00.000Z",
  completed_at: "2026-07-26T00:00:01.000Z",
  input_count: 1,
  accepted_count: 1,
  rejected_count: 0,
  output_count: 1,
  actions: [{
    action_id: "action-a2-1",
    dedup_key: "listing:fixture:1",
    action_type: "listing.review",
    severity: "warning",
    mutation_kind: "none",
    approval_required: false,
    evidence_ref: "fixture://a2/evidence/1",
  }],
  reconciliation: {
    expected_count: 1,
    observed_count: 1,
    balanced: true,
    method: "source count equals accepted plus rejected",
    evidence_ref: "fixture://a2/reconciliation/1",
  },
  limitations: ["TEST fixture only"],
};

describe("automation result contract", () => {
  it("accepts a balanced, tenant-isolated TEST result", () => {
    expect(validateAutomationResultCandidate(
      validAutomationResult,
      "test",
      ["TEST-0001"],
    )).toMatchObject({ ok: true });
  });

  it("has a safe executable result fixture for A2-A12", () => {
    expect(resultFixtures.fixtures.map((fixture) => fixture.automation_id))
      .toEqual(Array.from({ length: 11 }, (_, index) => `A${index + 2}`));
    expect(resultFixtures.forbidden_side_effects).toContain("dangerous_replay");

    for (const [index, fixture] of resultFixtures.fixtures.entries()) {
      const result = {
        ...validAutomationResult,
        result_id: `result-${fixture.automation_id}-${index}`,
        run_id: `run-${fixture.automation_id}-${index}`,
        idempotency_key: `idem-${fixture.automation_id}-${index}`,
        correlation_id: `corr-${fixture.automation_id}-${index}`,
        automation_id: fixture.automation_id,
        provider: fixture.provider,
        actions: [{
          ...validAutomationResult.actions[0],
          action_id: `action-${fixture.automation_id}-${index}`,
          dedup_key: `dedup-${fixture.automation_id}-${index}`,
          action_type: fixture.action_type,
        }],
        reconciliation: {
          ...validAutomationResult.reconciliation,
          method: fixture.reconciliation_method,
        },
      };
      expect(validateAutomationResultCandidate(
        result,
        "test",
        ["TEST-0001"],
      )).toMatchObject({ ok: true });
    }
  });

  it.each([
    [{ ...validAutomationResult, environment: "production" }, "ENVIRONMENT_MISMATCH"],
    [{ ...validAutomationResult, client_id: "TEST-0002" }, "CLIENT_NOT_ALLOWED"],
    [{ ...validAutomationResult, accepted_count: 0 }, "RESULT_COUNTS_UNBALANCED"],
    [{
      ...validAutomationResult,
      reconciliation: {
        ...validAutomationResult.reconciliation,
        observed_count: 0,
      },
    }, "RECONCILIATION_MISMATCH"],
    [{ ...validAutomationResult, status: "failed", error: null }, "FAILED_RESULT_REQUIRES_ERROR"],
  ])("rejects an unsafe or inconsistent result with %s", (result, code) => {
    expect(validateAutomationResultCandidate(
      result,
      "test",
      ["TEST-0001"],
    )).toMatchObject({ ok: false, code });
  });

  it("enforces the lower of the specification ceiling and configured cap", () => {
    const actions = Array.from({ length: 6 }, (_, index) => ({
      ...validAutomationResult.actions[0],
      action_id: `action-${index}`,
      dedup_key: `dedup-${index}`,
    }));
    expect(validateAutomationResultCandidate(
      { ...validAutomationResult, actions },
      "test",
      ["TEST-0001"],
      5,
    )).toMatchObject({ ok: false, code: "ACTION_CAP_EXCEEDED" });
    expect(AUTOMATION_ACTION_CEILINGS.A5).toBe(5);
    expect(AUTOMATION_ACTION_CEILINGS.A12).toBe(25);
  });

  it("requires approval for every side-effecting mutation", () => {
    const unsafeAction = {
      ...validAutomationResult.actions[0],
      mutation_kind: "email",
      approval_required: false,
    };
    expect(validateAutomationResultCandidate(
      { ...validAutomationResult, actions: [unsafeAction] },
      "test",
      ["TEST-0001"],
    )).toMatchObject({ ok: false, code: "MUTATION_REQUIRES_APPROVAL" });
  });

  it("rejects retry for security, isolation and permanent failures", () => {
    expect(validateAutomationResultCandidate({
      ...validAutomationResult,
      status: "failed",
      error: {
        code: "CROSS_CLIENT_CANARY_FAILED",
        classification: "isolation",
        retryable: true,
      },
    }, "test", ["TEST-0001"])).toMatchObject({
      ok: false,
      code: "UNSAFE_RETRY_CLASSIFICATION",
    });
  });
});

describe("operator action resolution contract", () => {
  const validResolution = {
    schema_version: "1.0",
    resolution_id: "resolution-a2-1",
    idempotency_key: "resolution-idem-a2-1",
    correlation_id: "run-a2-rollback-1",
    automation_id: "A2",
    client_id: "TEST-0001",
    environment: "test",
    occurred_at: "2026-07-27T00:00:00.000Z",
    resolutions: [{
      action_id: "action:sold_evidence:L-100:fixture",
      dedup_key: "sold_evidence:L-100:fixture",
      disposition: "superseded",
      reason: "Verified source snapshot restored the listing to active",
      evidence_ref: "listing-control://run-a2-rollback-1/L-100",
    }],
  };

  it("accepts a tenant-scoped, non-destructive resolution", () => {
    expect(validateActionResolutionCandidate(
      validResolution,
      "test",
      ["TEST-0001"],
    )).toMatchObject({ ok: true });
  });

  it.each([
    [{ ...validResolution, environment: "production" }, "ENVIRONMENT_MISMATCH"],
    [{ ...validResolution, client_id: "TEST-0002" }, "CLIENT_NOT_ALLOWED"],
    [{ ...validResolution, resolutions: [] }, "INVALID_RESOLUTIONS"],
    [{
      ...validResolution,
      resolutions: [
        ...validResolution.resolutions,
        validResolution.resolutions[0],
      ],
    }, "DUPLICATE_RESOLUTION_ITEM"],
  ])("rejects an unsafe or invalid resolution with %s", (resolution, code) => {
    expect(validateActionResolutionCandidate(
      resolution,
      "test",
      ["TEST-0001"],
    )).toMatchObject({ ok: false, code });
  });
});
