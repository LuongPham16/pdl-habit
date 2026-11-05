/**
 * Daily reminder maths, kept pure so it can be tested without a running plugin.
 * Obsidian cannot push notifications in the background, so the reminder fires once
 * per day while the app is open, inside a short window after the chosen time.
 */
import { isoDate } from './dates.js';

export const DEFAULT_REMINDERS = { enabled: false, time: '20:00' };

/** Minutes after the chosen time during which the reminder is still worth showing. */
export const REMINDER_WINDOW_MINUTES = 180;

/** Start/end of today's reminder window. */
export function reminderWindow(time = '20:00', now = new Date()) {
  const [hours, minutes] = String(time || '20:00').split(':').map((value) => Number(value));
  const start = new Date(now);
  start.setHours(Number.isFinite(hours) ? hours : 20, Number.isFinite(minutes) ? minutes : 0, 0, 0);
  const end = new Date(start.getTime() + REMINDER_WINDOW_MINUTES * 60 * 1000);
  return { start, end };
}

/** True when a reminder should fire now: enabled, not already sent today, inside the window. */
export function reminderDue({ enabled = false, time = '20:00', lastReminder = '' } = {}, now = new Date()) {
  if (!enabled) return false;
  if (lastReminder === isoDate(now)) return false;
  const { start, end } = reminderWindow(time, now);
  return now >= start && now < end;
}

/** One-line nudge that matches the numbers in Today. */
export function reminderText({ remaining = 0, total = 0 } = {}) {
  if (!total) return 'No habits scheduled today — a good day to add one.';
  if (remaining <= 0) return 'Day complete — everything is checked off.';
  if (remaining === 1) return '1 habit left today. Still time for a small win.';
  return `${remaining} habits left today. Still time for a small win.`;
}
