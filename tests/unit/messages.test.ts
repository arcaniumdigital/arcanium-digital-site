import { describe, expect, it } from "vitest";
import { isPrebookMessage, renderMessage, smsEncoding, smsParts, TEMPLATE_VERSION } from "../../workers/funnel/src/messages";

describe("approved SMS templates", () => {
  it("renders all placeholders without leaking unresolved values", () => {
    const body = renderMessage("PREBOOK_INSTANT_V3", { first_name: "Alex", booking_link: "https://arcaniumdigital.com/audit", operator_name: "Sam", business_name: "Arcanium Digital" });
    expect(body).toContain("Hi Alex");
    expect(body).toContain("https://arcaniumdigital.com/audit");
    expect(body).not.toContain("{{");
  });
  it("renders the approved immediate message", () => {
    const body = renderMessage("PREBOOK_INSTANT_V3", { first_name: "Alex", booking_link: "https://arcaniumdigital.com/audit", operator_name: "Sam", business_name: "Arcanium Digital" });
    expect(body).toBe("Hi Alex, thanks for getting in touch. Book your 15-minute Vendor Conversion Audit here: https://arcaniumdigital.com/audit. Questions? Reply here. Sam, Arcanium Digital.");
  });
  it("renders the approved ten-minute follow-up without a booking link", () => {
    const body = renderMessage("PREBOOK_10M_V3", { booking_link: "https://arcaniumdigital.com/audit", operator_name: "Sam", business_name: "Arcanium Digital" });
    expect(body).toBe("Still choosing a time? Book the closest suitable slot and reschedule later if needed. If you have any questions please ask. Sam, Arcanium Digital.");
    expect(body).not.toContain("https://");
  });
  it("records the copy revision", () => expect(TEMPLATE_VERSION).toBe("3.1.0"));
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
