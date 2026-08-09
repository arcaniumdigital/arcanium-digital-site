import type { LeadRow } from "./contracts";

type NotificationBooking = {
  cal_booking_uid: string;
  status: string;
  start_at_utc: string;
  attendee_timezone: string | null;
};

export function internalNotificationParams(input: {
  lead: LeadRow | null;
  booking: NotificationBooking | null;
  bookingUid: string | null;
  notificationType: string;
}): Record<string, string | number | boolean | null> {
  const { lead, booking, bookingUid, notificationType } = input;
  return {
    leadPublicId: lead?.public_id ?? "system",
    fullName: lead?.full_name ?? "System",
    firstName: lead?.first_name ?? "System",
    phone: lead?.phone_e164 ?? "Not available",
    phoneE164: lead?.phone_e164 ?? "Not available",
    email: lead?.email ?? "Not provided",
    sourcePage: lead?.source_page ?? "Not available",
    bookingUid: booking?.cal_booking_uid ?? bookingUid,
    bookingStatus: booking?.status ?? "Not available",
    appointmentStart: booking?.start_at_utc ?? "Not available",
    appointmentTimezone: booking?.attendee_timezone ?? "Not available",
    notificationType,
  };
}
