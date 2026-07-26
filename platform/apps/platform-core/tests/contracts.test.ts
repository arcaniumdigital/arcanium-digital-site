import { describe, expect, it } from "vitest";
import { constantTimeEqual, validateEventCandidate } from "../src/index";

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
