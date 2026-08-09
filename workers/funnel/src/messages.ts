import type { MessageType } from "./contracts";

const templates: Record<MessageType, string> = {
  PREBOOK_INSTANT_V3: "Hi {{first_name}}, thanks for getting in touch. Book your 15-minute Vendor Conversion Audit here: {{booking_link}}. Questions? Reply here. {{operator_name}}, {{business_name}}. STOP to opt out.",
  PREBOOK_10M_V3: "Still choosing a time? Book the closest suitable slot and reschedule later if needed: {{booking_link}}. {{operator_name}}, {{business_name}}. STOP to opt out.",
  PREBOOK_24H_V3: "Hi {{first_name}}, vendors often Google an agent before deciding who to call. I'll show you the biggest online trust gap I can find in a 15-minute audit: {{booking_link}}. {{operator_name}}, {{business_name}}. STOP to opt out.",
  PREBOOK_7D_V3: "Hi {{first_name}}, I'll close this out for now. If you still want your 15-minute Vendor Conversion Audit, book here: {{booking_link}}. {{operator_name}}, {{business_name}}. STOP to opt out.",
  BOOKING_CONFIRMED_V3: "Hi {{first_name}}, thanks for booking your 15-minute Vendor Conversion Audit with {{business_name}} for {{appointment_date}} at {{appointment_time}} {{timezone}}. Before we speak, see our brochure: {{brochure_link}}. Looking forward to helping. {{operator_name}}",
  BOOKING_REMINDER_24H_V3: "Hi {{first_name}}, reminder: I'll call you tomorrow at {{appointment_time}} {{timezone}}. I'll review your current online presence, identify the main opportunity and explain the next practical steps. Need to reschedule? {{reschedule_link}}. {{operator_name}}, {{business_name}}.",
  BOOKING_REMINDER_3H_V3: "Reminder: your 15-minute Vendor Conversion Audit starts in 3 hours at {{appointment_time}} {{timezone}}. {{operator_name}}, {{business_name}}.",
  BOOKING_REMINDER_EARLY_V3: "Reminder: your 15-minute Vendor Conversion Audit is tomorrow at {{appointment_time}} {{timezone}}. {{operator_name}}, {{business_name}}.",
};

export const TEMPLATE_VERSION = "3.0.0";

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
