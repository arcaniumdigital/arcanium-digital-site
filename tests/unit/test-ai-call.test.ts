import { describe, expect, it } from "vitest";
import { validateTestAiCallLead } from "../../lib/test-ai-call";

const valid = { name: "Jordan", phone: "0493 152 260", suburb: "Castle Hill", address: "12 Example Street", callConsent: true };

describe("validateTestAiCallLead", () => {
  it("normalizes a consenting Australian mobile", () => {
    expect(validateTestAiCallLead(valid)).toEqual({ ...valid, phone: "+61493152260" });
  });

  it("rejects missing call consent", () => {
    expect(() => validateTestAiCallLead({ ...valid, callConsent: false })).toThrow(/Confirm/);
  });

  it("rejects an invalid property address", () => {
    expect(() => validateTestAiCallLead({ ...valid, address: "<script>" })).toThrow(/address/);
  });
});
