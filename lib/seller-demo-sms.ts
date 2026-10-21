import { normalizeAustralianMobile } from "../workers/funnel/src/phone";
import { demoScenarios, demoSuburbs, type DemoScenario } from "./seller-demo";

export type DemoSmsLead = {
  name: string;
  phone: string;
  suburb: string;
  address: string;
  scenario: DemoScenario;
  smsConsent: true;
};

export function validateDemoSmsLead(value: unknown): DemoSmsLead {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Check your demo details and try again.");
  const input = value as Record<string, unknown>;
  const name = typeof input.name === "string" ? input.name.trim().replace(/\s+/g, " ") : "";
  if (!/^[\p{L} '-]{1,80}$/u.test(name)) throw new Error("Enter a name using up to 80 letters, spaces, apostrophes or hyphens.");
  const rawPhone = typeof input.phone === "string" ? input.phone.trim() : "";
  if (!/^(?:\+|00)?[\d ()-]{8,24}$/.test(rawPhone)) throw new Error("Enter a valid Australian mobile number.");
  const phone = normalizeAustralianMobile(rawPhone);
  if (!phone) throw new Error("Enter a valid Australian mobile number.");
  const suburb = typeof input.suburb === "string" ? input.suburb : "";
  if (!(demoSuburbs as readonly string[]).includes(suburb)) throw new Error("Choose a suburb from the list.");
  const address = typeof input.address === "string" ? input.address.trim().replace(/\s+/g, " ") : "";
  if (address.length < 3 || address.length > 200 || /[<>@\u0000-\u001f\u007f]/.test(address)) throw new Error("Enter a property address of 3–200 characters. Use fictional property details for this test.");
  const selected = demoScenarios.find(item => item.id === input.scenario);
  if (!selected) throw new Error("Choose Just curious or Thinking of selling.");
  if (input.smsConsent !== true) throw new Error("Confirm that you want a demo SMS conversation on your own mobile.");
  return { name, phone, suburb, address, scenario: selected.id, smsConsent: true };
}

// A single server-only destination, never a client-supplied allowlist or public env.
export function isApprovedDemoRecipient(phone: string, configuredPhone: string | undefined): boolean {
  const approved = configuredPhone ? normalizeAustralianMobile(configuredPhone) : null;
  return Boolean(approved && phone === approved);
}

export function isDemoRequestOrigin(origin: string | null, requestUrl: string, allowLocalAlias = false): boolean {
  if (!origin) return false;
  try {
    const source = new URL(origin);
    const target = new URL(requestUrl);
    if (source.origin === target.origin) return true;
    const localHosts = ["localhost", "127.0.0.1"];
    return allowLocalAlias && localHosts.includes(source.hostname) && localHosts.includes(target.hostname)
      && source.protocol === target.protocol && source.port === target.port;
  } catch { return false; }
}
