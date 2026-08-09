import { describe, expect, it } from "vitest";
import { bookingReminderSchedule } from "../../lib/funnel-scheduling";
import { formatAppointment, reminder3hSchedule, shiftForwardIntoSendWindow, withinSendWindow } from "../../workers/funnel/src/time";

describe("Australia/Brisbane scheduling", () => {
  it("accepts 07:00 local", () => expect(withinSendWindow(new Date("2026-08-08T21:00:00Z"), "Australia/Brisbane", 7, 20)).toBe(true));
  it("rejects 20:00 local", () => expect(withinSendWindow(new Date("2026-08-08T10:00:00Z"), "Australia/Brisbane", 7, 20)).toBe(false));
  it("shifts an early message to 07:00 that day", () => expect(shiftForwardIntoSendWindow(new Date("2026-08-08T18:00:00Z"), "Australia/Brisbane", 7, 20).toISOString()).toBe("2026-08-08T21:00:00.000Z"));
  it("shifts a late message to the next day at 07:00", () => expect(shiftForwardIntoSendWindow(new Date("2026-08-08T11:00:00Z"), "Australia/Brisbane", 7, 20).toISOString()).toBe("2026-08-08T21:00:00.000Z"));
  it("keeps the exact 3-hour reminder inside the window", () => expect(reminder3hSchedule(new Date("2026-08-09T06:00:00Z"), "Australia/Brisbane").alternate).toBe(false));
  it("uses alternate wording when the 3-hour point is before 07:00", () => expect(reminder3hSchedule(new Date("2026-08-08T19:00:00Z"), "Australia/Brisbane").alternate).toBe(true));
  it("formats the appointment in attendee timezone", () => expect(formatAppointment("2026-08-09T00:30:00Z", "Australia/Brisbane").time).toContain("10:30"));
  it("schedules a normal 24-hour and 3-hour pair", () => {
    const result = bookingReminderSchedule("2026-08-10T04:00:00Z", "Australia/Brisbane");
    expect(result.reminder24.toISOString()).toBe("2026-08-09T04:00:00.000Z");
    expect(result.reminder3.toISOString()).toBe("2026-08-10T01:00:00.000Z");
    expect(result.reminder3Type).toBe("BOOKING_REMINDER_3H_V3");
  });
  it("uses the early alternate for a morning appointment", () => {
    const result = bookingReminderSchedule("2026-08-09T22:00:00Z", "Australia/Brisbane");
    expect(result.reminder3Type).toBe("BOOKING_REMINDER_EARLY_V3");
    expect(result.reminder3.toISOString()).toBe("2026-08-09T10:00:00.000Z");
  });
});
