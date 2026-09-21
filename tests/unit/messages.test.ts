import { describe, expect, it } from "vitest";
import { isPrebookMessage, renderMessage, smsEncoding, smsParts, TEMPLATE_VERSION } from "../../workers/funnel/src/messages";

describe("approved SMS templates", () => {
  it("renders all placeholders without leaking unresolved values", () => {
    const body = renderMessage("PREBOOK_INSTANT_V3", { first_name: "Alex", booking_link: "https://arcaniumdigital.com/vendor-lead-opportunity", operator_name: "Sam", business_name: "Arcanium Digital" });
    expect(body).toContain("Hi Alex");
    expect(body).toContain("https://arcaniumdigital.com/vendor-lead-opportunity");
    expect(body).not.toContain("{{");
  });
  it("renders the approved immediate message", () => {
    const body = renderMessage("PREBOOK_INSTANT_V3", { first_name: "Alex", booking_link: "https://arcaniumdigital.com/vendor-lead-opportunity", operator_name: "Sam", business_name: "Arcanium Digital" });
    expect(body).toBe("Hi Alex, thanks for requesting your Vendor Lead Opportunity Snapshot. Choose a time to review it: https://arcaniumdigital.com/vendor-lead-opportunity. Questions? Reply here. Sam, Arcanium Digital.");
  });
  it("renders the approved ten-minute follow-up without a booking link", () => {
    const body = renderMessage("PREBOOK_10M_V3", { first_name: "Alex", booking_link: "https://arcaniumdigital.com/vendor-lead-opportunity", operator_name: "Sam", business_name: "Arcanium Digital" });
    expect(body).toBe("Hi Alex, still choosing a time? Pick a slot that suits you. We can discuss the local vendor searches worth targeting. Questions? Reply here. Sam, Arcanium Digital.");
    expect(body).not.toContain("https://");
  });
  it("records the copy revision", () => expect(TEMPLATE_VERSION).toBe("3.2.0"));
  it("keeps nurture copy free of em dashes and opt-out sentences", () => {
    const values = { first_name: "Alex", booking_link: "https://arcaniumdigital.com/vendor-lead-opportunity", operator_name: "Sam", business_name: "Arcanium Digital", appointment_date: "10 October", appointment_time: "10:00", timezone: "AEST", brochure_link: "https://arcaniumdigital.com/brochure", reschedule_link: "https://cal.com/reschedule" };
    for (const type of ["PREBOOK_INSTANT_V3", "PREBOOK_10M_V3", "PREBOOK_24H_V3", "PREBOOK_7D_V3", "BOOKING_CONFIRMED_V3", "BOOKING_REMINDER_24H_V3", "BOOKING_REMINDER_3H_V3", "BOOKING_REMINDER_EARLY_V3"] as const) {
      const body = renderMessage(type, values);
      expect(body).not.toContain("—");
      expect(body).not.toMatch(/reply stop to opt out/i);
      expect(body).toContain("Arcanium Digital");
    }
  });
  it("recognizes pre-booking types", () => expect(isPrebookMessage("PREBOOK_24H_V3")).toBe(true));
  it("does not classify booking reminders as pre-booking", () => expect(isPrebookMessage("BOOKING_REMINDER_3H_V3")).toBe(false));
  it("detects GSM-7", () => expect(smsEncoding("Hello, agent! STOP")).toBe("GSM-7"));
  it("detects UCS-2", () => expect(smsEncoding("Hello 👋")).toBe("UCS-2"));
  it("counts a single GSM part", () => expect(smsParts("a".repeat(160))).toBe(1));
  it("counts concatenated GSM parts", () => expect(smsParts("a".repeat(161))).toBe(2));
  it("counts GSM extension characters twice", () => expect(smsParts("^".repeat(81))).toBe(2));
  it("counts a single UCS-2 part", () => expect(smsParts("界".repeat(70))).toBe(1));
  it("counts concatenated UCS-2 parts", () => expect(smsParts("界".repeat(71))).toBe(2));
});
