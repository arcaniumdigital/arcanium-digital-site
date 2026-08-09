import { describe, expect, it } from "vitest";
import { calBookingUid, calDate, calEventKey, calMetadataSource, calTrigger, extractCalCorrelation, extractCalEmail, extractCalName, extractCalPhone } from "../../workers/funnel/src/cal";

const webhook = { triggerEvent: "BOOKING_CREATED", idempotencyKey: "evt_1", payload: { uid: "booking_1", startTime: "2026-08-09T00:00:00Z", endTime: "2026-08-09T00:15:00Z", attendees: [{ name: "Alex Agent", email: "ALEX@example.com", phoneNumber: "0412 345 678" }], metadata: { leadCorrelation: "signed-value", source: "sms" } } };

describe("Cal webhook extraction", () => {
  it("normalizes the attendee phone", () => expect(extractCalPhone(webhook)).toBe("+61412345678"));
  it("normalizes email case", () => expect(extractCalEmail(webhook)).toBe("alex@example.com"));
  it("extracts attendee name", () => expect(extractCalName(webhook)).toBe("Alex Agent"));
  it("extracts signed correlation", () => expect(extractCalCorrelation(webhook)).toBe("signed-value"));
  it("extracts booking UID", () => expect(calBookingUid(webhook)).toBe("booking_1"));
  it("normalizes trigger case", () => expect(calTrigger(webhook)).toBe("BOOKING_CREATED"));
  it("prefers provider idempotency key", () => expect(calEventKey(webhook, "hash")).toBe("evt_1"));
  it("normalizes appointment timestamps", () => expect(calDate(webhook, "startTime")).toBe("2026-08-09T00:00:00.000Z"));
  it("extracts safe source metadata", () => expect(calMetadataSource(webhook)).toBe("sms"));
  it("never falls back to a fuzzy name for phone", () => expect(extractCalPhone({ payload: { attendees: [{ name: "0412 345 678" }] } })).toBeNull());
});
