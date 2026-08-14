// Must match the HttpOnly context cookie issued by the Cloudflare intake Worker.
export const bookingTokenCookieName = "arc_vendor_audit_ctx";
export const bookingTokenStorageKey = "arcanium:booking-token";

export function normalizeBookingToken(value: string | null | undefined) {
  const token = value?.trim() ?? "";
  return /^[a-f0-9]{12,64}$/i.test(token) ? token : "";
}
