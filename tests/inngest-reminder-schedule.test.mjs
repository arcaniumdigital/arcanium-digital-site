import assert from "node:assert/strict";
import test from "node:test";

import { shouldScheduleBookingReminder } from "../lib/inngest-reminder-schedule.mjs";

test("a reminder stays eligible after its sleep has completed", () => {
  const eventReceivedAtMs = Date.parse("2026-08-13T00:30:34.000Z");
  const reminderAtMs = Date.parse("2026-08-13T01:00:00.000Z");
  const appointmentAtMs = Date.parse("2026-08-13T04:00:00.000Z");

  assert.equal(
    shouldScheduleBookingReminder({ reminderAtMs, appointmentAtMs, eventReceivedAtMs }),
    true,
  );
});

test("a late booking event does not back-send an already missed reminder", () => {
  const reminderAtMs = Date.parse("2026-08-13T01:00:00.000Z");
  const eventReceivedAtMs = Date.parse("2026-08-13T01:05:00.000Z");
  const appointmentAtMs = Date.parse("2026-08-13T04:00:00.000Z");

  assert.equal(
    shouldScheduleBookingReminder({ reminderAtMs, appointmentAtMs, eventReceivedAtMs }),
    false,
  );
});

test("a reminder cannot be scheduled at or after the appointment", () => {
  const eventReceivedAtMs = Date.parse("2026-08-13T00:30:34.000Z");
  const appointmentAtMs = Date.parse("2026-08-13T04:00:00.000Z");

  assert.equal(
    shouldScheduleBookingReminder({
      reminderAtMs: appointmentAtMs,
      appointmentAtMs,
      eventReceivedAtMs,
    }),
    false,
  );
});

test("invalid timestamps fail closed", () => {
  assert.equal(
    shouldScheduleBookingReminder({
      reminderAtMs: Number.NaN,
      appointmentAtMs: Date.now(),
      eventReceivedAtMs: Date.now(),
    }),
    false,
  );
});
