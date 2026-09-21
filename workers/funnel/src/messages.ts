import type { MessageType } from "./contracts";

const templates: Record<MessageType, string> = {
  PREBOOK_INSTANT_V3: "Hi {{first_name}}, thanks for requesting your Vendor Lead Opportunity Snapshot. Choose a time to review it: {{booking_link}}. Questions? Reply here. {{operator_name}}, {{business_name}}.",
  PREBOOK_10M_V3: "Hi {{first_name}}, still choosing a time? Pick a slot that suits you. We can discuss the local vendor searches worth targeting. Questions? Reply here. {{operator_name}}, {{business_name}}.",
  PREBOOK_24H_V3: "Hi {{first_name}}, local vendors are searching for agents ready to help them sell. Your Snapshot can show where Google Ads and your online presence may create more opportunities. Book a time: {{booking_link}}. {{operator_name}}, {{business_name}}.",
  PREBOOK_7D_V3: "Hi {{first_name}}, I'll close this out for now. If you still want your Vendor Lead Opportunity Snapshot, book a time here: {{booking_link}}. {{operator_name}}, {{business_name}}.",
  BOOKING_CONFIRMED_V3: "Hi {{first_name}}, thanks for booking your Vendor Lead Opportunity Snapshot call with {{business_name}} for {{appointment_date}} at {{appointment_time}} {{timezone}}. Before we speak, see our brochure: {{brochure_link}}. {{operator_name}}",
  BOOKING_REMINDER_24H_V3: "Hi {{first_name}}, reminder: I'll call you tomorrow at {{appointment_time}} {{timezone}}. We'll discuss local vendor searches and the next practical steps. Need to reschedule? {{reschedule_link}}. {{operator_name}}, {{business_name}}.",
  BOOKING_REMINDER_3H_V3: "Reminder: your Vendor Lead Opportunity Snapshot call starts in 3 hours at {{appointment_time}} {{timezone}}. {{operator_name}}, {{business_name}}.",
  BOOKING_REMINDER_EARLY_V3: "Reminder: your Vendor Lead Opportunity Snapshot call is tomorrow at {{appointment_time}} {{timezone}}. {{operator_name}}, {{business_name}}.",
};

export const TEMPLATE_VERSION = "3.2.0";

export function renderMessage(type: MessageType, values: Record<string, string>): string {
  return templates[type].replace(/\{\{([a-z_]+)\}\}/g, (_match, key: string) => values[key] ?? "");
}

const gsmBasic = new Set(Array.from("@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà"));
const gsmExtended = new Set(Array.from("^{}\\[~]|€"));

export function smsEncoding(body: string): "GSM-7" | "UCS-2" {
  return Array.from(body).every((character) => gsmBasic.has(character) || gsmExtended.has(character)) ? "GSM-7" : "UCS-2";
}

export function smsParts(body: string): number {
  const encoding = smsEncoding(body);
  if (encoding === "GSM-7") {
    const length = Array.from(body).reduce((total, character) => total + (gsmExtended.has(character) ? 2 : 1), 0);
    return length <= 160 ? 1 : Math.ceil(length / 153);
  }
  const length = Array.from(body).reduce((total, character) => total + character.length, 0);
  return length <= 70 ? 1 : Math.ceil(length / 67);
}

export function isPrebookMessage(type: MessageType): boolean {
  return type.startsWith("PREBOOK_");
}
