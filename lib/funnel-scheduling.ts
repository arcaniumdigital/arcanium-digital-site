type Parts = { year: number; month: number; day: number; hour: number; minute: number; second: number };

function parts(date: Date, timeZone: string): Parts {
  const formatted = new Intl.DateTimeFormat("en-AU", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const number = (type: Intl.DateTimeFormatPartTypes) => Number(formatted.find((part) => part.type === type)?.value);
  return { year: number("year"), month: number("month"), day: number("day"), hour: number("hour"), minute: number("minute"), second: number("second") };
}

function localToUtc(local: Parts, timeZone: string): Date {
  let guess = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute, local.second);
  for (let index = 0; index < 3; index += 1) {
    const actual = parts(new Date(guess), timeZone);
    guess += Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute, local.second)
      - Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute, actual.second);
  }
  return new Date(guess);
}

function localDay(date: Date, timeZone: string, dayOffset: number, hour: number): Date {
  const local = parts(date, timeZone);
  const shifted = new Date(Date.UTC(local.year, local.month - 1, local.day + dayOffset, hour, 0, 0));
  const shiftedParts = parts(shifted, "UTC");
  return localToUtc({ ...shiftedParts, hour, minute: 0, second: 0 }, timeZone);
}

export function bookingReminderSchedule(startAtUtc: string, timeZone: string) {
  const start = new Date(startAtUtc);
  const reminder24Desired = new Date(start.getTime() - 24 * 60 * 60_000);
  const local24 = parts(reminder24Desired, timeZone);
  const reminder24 = local24.hour < 7 ? localDay(reminder24Desired, timeZone, -1, 20)
    : local24.hour >= 20 ? localDay(reminder24Desired, timeZone, 0, 20)
    : reminder24Desired;
  const reminder3Desired = new Date(start.getTime() - 3 * 60 * 60_000);
  const local3 = parts(reminder3Desired, timeZone);
  if (local3.hour >= 7 && local3.hour < 20) return { reminder24, reminder3: reminder3Desired, reminder3Type: "BOOKING_REMINDER_3H_V3" as const };
  const reminder3 = local3.hour < 7 ? localDay(reminder3Desired, timeZone, -1, 20) : localDay(reminder3Desired, timeZone, 0, 20);
  return { reminder24, reminder3, reminder3Type: "BOOKING_REMINDER_EARLY_V3" as const };
}
