export function shouldScheduleBookingReminder({ reminderAtMs, appointmentAtMs, eventReceivedAtMs }) {
  return (
    Number.isFinite(reminderAtMs) &&
    Number.isFinite(appointmentAtMs) &&
    Number.isFinite(eventReceivedAtMs) &&
    reminderAtMs > eventReceivedAtMs &&
    reminderAtMs < appointmentAtMs
  );
}
