export const bookingTokenCookieName = "arcanium_booking_token";
export const bookingTokenStorageKey = "arcanium:booking-token";

export function normalizeBookingToken(value: string | null | undefined) {
  const token = value?.trim() ?? "";
  return /^[a-f0-9]{12,64}$/i.test(token) ? token : "";
}
