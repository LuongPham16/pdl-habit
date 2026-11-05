import test from 'node:test';
import assert from 'node:assert/strict';
import { reminderDue, reminderWindow, reminderText, DEFAULT_REMINDERS } from '../src/reminders.js';

const at = (hours, minutes = 0) => new Date(2026, 10, 5, hours, minutes, 0, 0);

test('reminders are off by default', () => {
  assert.equal(DEFAULT_REMINDERS.enabled, false);
  assert.equal(reminderDue(DEFAULT_REMINDERS, at(20, 0)), false);
});

test('reminderWindow spans three hours after the chosen time', () => {
  const { start, end } = reminderWindow('20:00', at(9, 0));
  assert.equal(start.getHours(), 20);
  assert.equal(start.getMinutes(), 0);
  assert.equal(end.getHours(), 23);
});

test('reminderDue only fires inside the window and once per day', () => {
  const settings = { enabled: true, time: '20:00', lastReminder: '' };
  assert.equal(reminderDue(settings, at(19, 59)), false, 'too early');
  assert.equal(reminderDue(settings, at(20, 0)), true, 'at the time');
  assert.equal(reminderDue(settings, at(22, 59)), true, 'inside the window');
  assert.equal(reminderDue(settings, at(23, 1)), false, 'window closed');
  assert.equal(reminderDue({ ...settings, lastReminder: '2026-11-05' }, at(20, 30)), false, 'already sent today');
  assert.equal(reminderDue({ ...settings, lastReminder: '2026-11-04' }, at(20, 30)), true, 'yesterday does not count');
});

test('reminderDue tolerates malformed times', () => {
  const settings = { enabled: true, time: 'not-a-time', lastReminder: '' };
  const { start } = reminderWindow(settings.time, at(9, 0));
  assert.equal(start.getHours(), 20, 'falls back to 20:00');
  assert.equal(reminderDue(settings, at(20, 5)), true);
});

test('reminderText matches the numbers shown elsewhere', () => {
  assert.match(reminderText({ remaining: 0, total: 0 }), /No habits scheduled/);
  assert.match(reminderText({ remaining: 1, total: 3 }), /^1 habit left/);
  assert.match(reminderText({ remaining: 4, total: 6 }), /^4 habits left/);
});
