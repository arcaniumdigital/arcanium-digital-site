import { normalizeAustralianMobile } from "./phone";

type UnknownRecord = Record<string, unknown>;

function record(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as UnknownRecord) : null;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function nestedText(root: unknown, path: string[]): string | null {
  let current: unknown = root;
  for (const key of path) current = record(current)?.[key];
  return text(current);
}

export function calPayloadEnvelope(body: unknown): UnknownRecord {
  const root = record(body) ?? {};
  return record(root.payload) ?? root;
}

export function extractCalPhone(body: unknown): string | null {
  const payload = calPayloadEnvelope(body);
  const attendees = Array.isArray(payload.attendees) ? payload.attendees : [];
  const firstAttendee = record(attendees[0]);
  const candidates: Array<string | null> = [
    text(firstAttendee?.phoneNumber),
    nestedText(payload, ["responses", "attendeePhoneNumber"]),
    nestedText(payload, ["responses", "attendeePhoneNumber", "value"]),
    nestedText(payload, ["responses", "mobile"]),
    nestedText(payload, ["responses", "mobile", "value"]),
    nestedText(payload, ["responses", "location", "value", "optionValue"]),
    nestedText(payload, ["responses", "location", "response", "optionValue"]),
    nestedText(payload, ["location", "optionValue"]),
  ];
  for (const candidate of candidates) {
    const normalised = normalizeAustralianMobile(candidate);
    if (normalised) return normalised;
  }
  return null;
}

export function extractCalEmail(body: unknown): string | null {
  const payload = calPayloadEnvelope(body);
  const attendees = Array.isArray(payload.attendees) ? payload.attendees : [];
  const email = text(record(attendees[0])?.email) ?? nestedText(payload, ["responses", "email", "value"]);
  return email?.toLowerCase() ?? null;
}

export function extractCalName(body: unknown): string {
  const payload = calPayloadEnvelope(body);
  const attendees = Array.isArray(payload.attendees) ? payload.attendees : [];
  return text(record(attendees[0])?.name) ?? nestedText(payload, ["responses", "name", "value"]) ?? "Cal.com attendee";
}

export function extractCalCorrelation(body: unknown): string | null {
  const payload = calPayloadEnvelope(body);
  return nestedText(payload, ["metadata", "leadCorrelation"])
    ?? nestedText(payload, ["metadata", "lead_correlation"]);
}

export function calBookingUid(body: unknown): string | null {
  const payload = calPayloadEnvelope(body);
  return text(payload.uid) ?? text(payload.bookingUid) ?? text(record(body)?.uid) ?? text(record(body)?.bookingUid);
}

export function calTrigger(body: unknown): string | null {
  return text(record(body)?.triggerEvent)?.toUpperCase() ?? null;
}

export function calEventKey(body: unknown, payloadHash: string): string {
  const root = record(body);
  return text(root?.idempotencyKey) ?? `${calTrigger(body) ?? "UNKNOWN"}:${calBookingUid(body) ?? payloadHash}`;
}

export function calDate(body: unknown, key: "startTime" | "endTime"): string | null {
  const value = text(calPayloadEnvelope(body)[key]) ?? text(record(body)?.[key]);
  if (!value || !Number.isFinite(Date.parse(value))) return null;
  return new Date(value).toISOString();
}

export function calString(body: unknown, key: string): string | null {
  return text(calPayloadEnvelope(body)[key]) ?? text(record(body)?.[key]);
}

export function calMetadataSource(body: unknown): string {
  return nestedText(calPayloadEnvelope(body), ["metadata", "source"]) ?? "direct_or_unknown";
}
