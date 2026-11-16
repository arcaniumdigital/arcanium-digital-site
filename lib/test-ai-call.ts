import { normalizeAustralianMobile } from "../workers/funnel/src/phone";

export type TestAiCallLead = {
  name: string;
  phone: string;
  suburb: string;
  address: string;
  callConsent: true;
};

export function buildRetellDemoCallBody(lead: TestAiCallLead, options: {
  fromNumber: string;
  agentId?: string;
  requestId: string;
  currentTime: string;
}) {
  const firstName = lead.name.split(" ")[0];
  return {
    from_number: options.fromNumber,
    to_number: lead.phone,
    idempotency_key: `testai-${options.requestId}`,
    ...(options.agentId ? { override_agent_id: options.agentId } : {}),
    honor_internal_dnc: true,
    metadata: { source: "arcanium-testai", request_id: options.requestId, consent: "immediate-demo-call-v1" },
    retell_llm_dynamic_variables: {
      lead_name: firstName,
      property_address: `${lead.address}, ${lead.suburb}`,
      agent_name: "Travis",
      salesperson_name: "Jordan",
      agency_name: "Arcanium Digital",
      "current_time_Australia/Brisbane": options.currentTime,
      price_guide_message: "",
      ghl_contact_id: "",
    },
  };
}

export function validateTestAiCallLead(value: unknown): TestAiCallLead {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Check your call details and try again.");
  const input = value as Record<string, unknown>;
  const name = typeof input.name === "string" ? input.name.trim().replace(/\s+/g, " ") : "";
  if (!/^[\p{L} '-]{1,80}$/u.test(name)) throw new Error("Enter your first name using letters, spaces, apostrophes or hyphens.");
  const rawPhone = typeof input.phone === "string" ? input.phone.trim() : "";
  if (!/^(?:\+|00)?[\d ()-]{8,24}$/.test(rawPhone)) throw new Error("Enter a valid Australian mobile number.");
  const phone = normalizeAustralianMobile(rawPhone);
  if (!phone) throw new Error("Enter a valid Australian mobile number.");
  const suburb = typeof input.suburb === "string" ? input.suburb.trim().replace(/\s+/g, " ") : "";
  if (!/^[\p{L} .'-]{2,80}$/u.test(suburb)) throw new Error("Enter a valid suburb using letters, spaces, apostrophes or hyphens.");
  const address = typeof input.address === "string" ? input.address.trim().replace(/\s+/g, " ") : "";
  if (address.length < 3 || address.length > 200 || /[<>@\u0000-\u001f\u007f]/.test(address)) throw new Error("Enter a practice property address of 3–200 characters.");
  if (input.callConsent !== true) throw new Error("Confirm that you want an immediate AI demonstration call on your own mobile.");
  return { name, phone, suburb, address, callConsent: true };
}
