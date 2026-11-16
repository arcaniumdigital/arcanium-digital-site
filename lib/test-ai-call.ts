import { normalizeAustralianMobile } from "../workers/funnel/src/phone";
import { demoSuburbs } from "./seller-demo";

export type TestAiCallLead = {
  name: string;
  phone: string;
  suburb: string;
  address: string;
  callConsent: true;
};

export function validateTestAiCallLead(value: unknown): TestAiCallLead {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Check your call details and try again.");
  const input = value as Record<string, unknown>;
  const name = typeof input.name === "string" ? input.name.trim().replace(/\s+/g, " ") : "";
  if (!/^[\p{L} '-]{1,80}$/u.test(name)) throw new Error("Enter your first name using letters, spaces, apostrophes or hyphens.");
  const rawPhone = typeof input.phone === "string" ? input.phone.trim() : "";
  if (!/^(?:\+|00)?[\d ()-]{8,24}$/.test(rawPhone)) throw new Error("Enter a valid Australian mobile number.");
  const phone = normalizeAustralianMobile(rawPhone);
  if (!phone) throw new Error("Enter a valid Australian mobile number.");
  const suburb = typeof input.suburb === "string" ? input.suburb : "";
  if (!(demoSuburbs as readonly string[]).includes(suburb)) throw new Error("Choose a suburb from the list.");
  const address = typeof input.address === "string" ? input.address.trim().replace(/\s+/g, " ") : "";
  if (address.length < 3 || address.length > 200 || /[<>@\u0000-\u001f\u007f]/.test(address)) throw new Error("Enter a practice property address of 3–200 characters.");
  if (input.callConsent !== true) throw new Error("Confirm that you want an immediate AI demonstration call on your own mobile.");
  return { name, phone, suburb, address, callConsent: true };
}
