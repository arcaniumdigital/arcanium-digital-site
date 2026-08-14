import { z } from "zod";
import { callFunnelInternal } from "@/lib/funnel-internal";
import { verifyInngestDeployment } from "@/lib/inngest-health.mjs";
import { shouldScheduleBookingReminder } from "@/lib/inngest-reminder-schedule.mjs";
import { inngest } from "./client";

const leadCreatedSchema = z.object({
  leadId: z.string().min(1).max(100),
  correlationId: z.string().min(1).max(100),
  submittedAt: z.string().datetime(),
});

const bookingSchema = z.object({
  leadId: z.string().min(1).max(100),
  bookingUid: z.string().min(1).max(100),
  bookingRevision: z.number().int().positive(),
  startAtUtc: z.string().datetime(),
  attendeeTimezone: z.string().min(1).max(100).optional(),
  correlationId: z.string().min(1).max(100),
});

function dateAtLocalHour(date: Date, timeZone: string, dayOffset: number, hour: number): Date {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  const wanted = Date.UTC(value("year"), value("month") - 1, value("day") + dayOffset, hour, 0, 0);
  let guess = wanted;
  for (let iteration = 0; iteration < 3; iteration += 1) {
    const actual = new Intl.DateTimeFormat("en-AU", {
      timeZone, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
    }).formatToParts(new Date(guess));
    const actualValue = (type: Intl.DateTimeFormatPartTypes) => Number(actual.find((part) => part.type === type)?.value);
    const actualUtc = Date.UTC(actualValue("year"), actualValue("month") - 1, actualValue("day"), actualValue("hour"), actualValue("minute"), actualValue("second"));
    guess += wanted - actualUtc;
  }
  return new Date(guess);
}

function localHour(date: Date, timeZone: string): number {
  return Number(new Intl.DateTimeFormat("en-AU", { timeZone, hour: "2-digit", hourCycle: "h23" }).format(date));
}

function previousSafeWindow(date: Date, timeZone: string): Date {
  const hour = localHour(date, timeZone);
  if (hour >= 7 && hour < 20) return date;
  return hour < 7 ? dateAtLocalHour(date, timeZone, -1, 20) : dateAtLocalHour(date, timeZone, 0, 20);
}

function nextSafeWindow(date: Date, timeZone: string): Date {
  const hour = localHour(date, timeZone);
  if (hour >= 7 && hour < 20) return date;
  return hour < 7 ? dateAtLocalHour(date, timeZone, 0, 7) : dateAtLocalHour(date, timeZone, 1, 7);
}

const enqueueDueMessage = (input: Record<string, unknown>) => callFunnelInternal("/internal/due-message", input);

export const prebookingJourney = inngest.createFunction(
  {
    id: "arcanium-vendor-audit-prebooking-v4",
    retries: 5,
    triggers: { event: "arcanium/vendor-audit.lead-created" },
    cancelOn: [
      { event: "arcanium/vendor-audit.booked", if: "async.data.leadId == event.data.leadId" },
      { event: "arcanium/vendor-audit.replied", if: "async.data.leadId == event.data.leadId" },
      { event: "arcanium/vendor-audit.stopped", if: "async.data.leadId == event.data.leadId" },
      { event: "arcanium/vendor-audit.manual-paused", if: "async.data.leadId == event.data.leadId" },
      { event: "arcanium/vendor-audit.closed", if: "async.data.leadId == event.data.leadId" },
    ],
  },
  async ({ event, step }) => {
    const data = leadCreatedSchema.parse(event.data);
    const submittedAt = Date.parse(data.submittedAt);
    const businessTimezone = process.env.FUNNEL_BUSINESS_TIMEZONE || "Australia/Brisbane";
    const dueSteps = [
      { id: "due-10-minutes", offsetMs: 10 * 60_000, messageType: "PREBOOK_10M_V3", completeJourney: false },
      { id: "due-24-hours", offsetMs: 24 * 60 * 60_000, messageType: "PREBOOK_24H_V3", completeJourney: false },
      { id: "due-7-days", offsetMs: 7 * 24 * 60 * 60_000, messageType: "PREBOOK_7D_V3", completeJourney: true },
    ] as const;
    for (const due of dueSteps) {
      const permittedAt = nextSafeWindow(new Date(submittedAt + due.offsetMs), businessTimezone);
      await step.sleepUntil(`sleep-${due.id}`, permittedAt);
      await step.run(due.id, () => enqueueDueMessage({ leadId: data.leadId, messageType: due.messageType, completeJourney: due.completeJourney }));
    }
    return { completed: true };
  },
);

export const bookingReminderJourney = inngest.createFunction(
  {
    id: "arcanium-vendor-audit-booking-reminders-v4",
    retries: 5,
    triggers: { event: "arcanium/vendor-audit.booking-created-or-rescheduled" },
    cancelOn: [
      { event: "arcanium/vendor-audit.booking-cancelled", if: "async.data.bookingUid == event.data.bookingUid && async.data.bookingRevision == event.data.bookingRevision" },
      { event: "arcanium/vendor-audit.booking-rescheduled", if: "async.data.bookingUid == event.data.bookingUid && async.data.bookingRevision == event.data.bookingRevision" },
      { event: "arcanium/vendor-audit.stopped", if: "async.data.leadId == event.data.leadId" },
      { event: "arcanium/vendor-audit.manual-paused", if: "async.data.leadId == event.data.leadId" },
    ],
  },
  async ({ event, step }) => {
    const data = bookingSchema.parse(event.data);
    const startAt = new Date(data.startAtUtc);
    const eventReceivedAtMs = event.ts;
    const businessTimezone = process.env.FUNNEL_BUSINESS_TIMEZONE || "Australia/Brisbane";
    const reminder24h = previousSafeWindow(new Date(startAt.getTime() - 24 * 60 * 60_000), businessTimezone);
    if (shouldScheduleBookingReminder({
      reminderAtMs: reminder24h.getTime(),
      appointmentAtMs: startAt.getTime(),
      eventReceivedAtMs,
    })) {
      await step.sleepUntil("sleep-reminder-24h", reminder24h);
      await step.run("due-reminder-24h", () => enqueueDueMessage({ leadId: data.leadId, bookingUid: data.bookingUid, bookingRevision: data.bookingRevision, messageType: "BOOKING_REMINDER_24H_V3" }));
    }
    const desired3h = new Date(startAt.getTime() - 3 * 60 * 60_000);
    const exact3h = localHour(desired3h, businessTimezone) >= 7 && localHour(desired3h, businessTimezone) < 20;
    const reminder3h = exact3h ? desired3h : previousSafeWindow(desired3h, businessTimezone);
    if (shouldScheduleBookingReminder({
      reminderAtMs: reminder3h.getTime(),
      appointmentAtMs: startAt.getTime(),
      eventReceivedAtMs,
    })) {
      await step.sleepUntil("sleep-reminder-3h", reminder3h);
      await step.run("due-reminder-3h", () => enqueueDueMessage({ leadId: data.leadId, bookingUid: data.bookingUid, bookingRevision: data.bookingRevision, messageType: exact3h ? "BOOKING_REMINDER_3H_V3" : "BOOKING_REMINDER_EARLY_V3" }));
    }
    return { completed: true };
  },
);

export const inngestHeartbeat = inngest.createFunction(
  { id: "arcanium-vendor-audit-heartbeat-v4", retries: 5, triggers: { cron: "*/30 * * * *" } },
  async ({ step }) => {
    const publicBaseUrl = process.env.INNGEST_PROBE_BASE_URL || "https://www.arcaniumdigital.com";
    await step.run("verify-public-inngest-route", () => verifyInngestDeployment(publicBaseUrl));
    return step.run("record-worker-heartbeat", () =>
      callFunnelInternal("/internal/inngest-heartbeat", {
        source: "inngest-watchdog-v4",
        requestedChecks: ["stale-jobs", "stale-journeys"],
      }),
    );
  },
);

export const funnelFunctions = [prebookingJourney, bookingReminderJourney, inngestHeartbeat];
