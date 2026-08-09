export function normalizeAustralianMobile(value: string | null | undefined): string | null {
  if (!value) return null;
  let digits = value.replace(/[^0-9+]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  if (digits.startsWith("0061")) digits = digits.slice(2);
  if (/^04\d{8}$/.test(digits)) return `+61${digits.slice(1)}`;
  if (/^614\d{8}$/.test(digits)) return `+${digits}`;
  return null;
}

export function firstNameFromFullName(fullName: string): string {
  const cleaned = fullName.replace(/[<>\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim();
  return cleaned.split(" ")[0]?.slice(0, 60) || "there";
}

export function sanitizeFullName(fullName: string): string {
  return fullName.replace(/[<>\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);
}

export function classifyInboundIntent(body: string): "STOP" | "REPLY" | "EMPTY" {
  const normalised = body.toUpperCase().trim().replace(/^[\s\p{P}]+|[\s\p{P}]+$/gu, "");
  if (!normalised) return "EMPTY";
  return new Set(["STOP", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"]).has(normalised) ? "STOP" : "REPLY";
}
