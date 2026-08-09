type ZonedParts = { year: number; month: number; day: number; hour: number; minute: number; second: number };

function zonedParts(date: Date, timeZone: string): ZonedParts {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  return { year: value("year"), month: value("month"), day: value("day"), hour: value("hour"), minute: value("minute"), second: value("second") };
}

function zonedLocalToUtc(parts: ZonedParts, timeZone: string): Date {
  let guess = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  for (let iteration = 0; iteration < 3; iteration += 1) {
    const actual = zonedParts(new Date(guess), timeZone);
    const actualAsUtc = Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute, actual.second);
    const wantedAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
    guess += wantedAsUtc - actualAsUtc;
  }
  return new Date(guess);
}

export function withinSendWindow(date: Date, timeZone: string, startHour: number, endHour: number): boolean {
  const { hour } = zonedParts(date, timeZone);
  return hour >= startHour && hour < endHour;
}

export function shiftForwardIntoSendWindow(date: Date, timeZone: string, startHour: number, endHour: number): Date {
  if (withinSendWindow(date, timeZone, startHour, endHour)) return date;
  const local = zonedParts(date, timeZone);
  if (local.hour < startHour) return zonedLocalToUtc({ ...local, hour: startHour, minute: 0, second: 0 }, timeZone);
  const tomorrow = new Date(Date.UTC(local.year, local.month - 1, local.day + 1, startHour, 0, 0));
  const tomorrowParts = { ...zonedParts(tomorrow, "UTC"), hour: startHour, minute: 0, second: 0 };
  return zonedLocalToUtc(tomorrowParts, timeZone);
}

export function reminder3hSchedule(startAt: Date, timeZone: string): { dueAt: Date; alternate: boolean } {
  const desired = new Date(startAt.getTime() - 3 * 60 * 60 * 1000);
  const local = zonedParts(desired, timeZone);
  if (local.hour >= 7 && local.hour < 20) return { dueAt: desired, alternate: false };
  if (local.hour < 7) {
    const prior = new Date(Date.UTC(local.year, local.month - 1, local.day - 1, 20, 0, 0));
    const priorParts = zonedParts(prior, "UTC");
    return { dueAt: zonedLocalToUtc({ ...priorParts, hour: 20, minute: 0, second: 0 }, timeZone), alternate: true };
  }
  return { dueAt: zonedLocalToUtc({ ...local, hour: 20, minute: 0, second: 0 }, timeZone), alternate: true };
}

export function formatAppointment(startAt: string, timeZone: string): { date: string; time: string } {
  const date = new Date(startAt);
  return {
    date: new Intl.DateTimeFormat("en-AU", { timeZone, weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(date),
    time: new Intl.DateTimeFormat("en-AU", { timeZone, hour: "numeric", minute: "2-digit", hour12: true }).format(date),
  };
}
