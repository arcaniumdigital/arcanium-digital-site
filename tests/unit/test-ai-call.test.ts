import { describe, expect, it } from "vitest";
import { buildRetellDemoCallBody, validateTestAiCallLead } from "../../lib/test-ai-call";

const valid = { name: "Jordan", phone: "0493 152 260", suburb: "Pelican Waters", address: "12 Example Street", callConsent: true };

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

  it("accepts a free-text Australian suburb", () => {
    expect(validateTestAiCallLead({ ...valid, suburb: "Caloundra West" }).suburb).toBe("Caloundra West");
  });

  it("passes the submitted name and complete property address into Retell", () => {
    const lead = validateTestAiCallLead(valid);
    const body = buildRetellDemoCallBody(lead, {
      fromNumber: "+61483914889", agentId: "agent_test", requestId: "request-1", currentTime: "Monday 10:30 am",
    });
    expect(body.to_number).toBe("+61493152260");
    expect(body.retell_llm_dynamic_variables).toMatchObject({
      lead_name: "Jordan",
      property_address: "12 Example Street, Pelican Waters",
      "current_time_Australia/Brisbane": "Monday 10:30 am",
    });
  });
});
