import test from 'node:test';
import assert from 'node:assert/strict';
import { isoDate, addDays, startOfWeek, parseDate, clamp, plural, safeName, esc, longDay } from '../src/dates.js';

test('isoDate pads month and day', () => {
  assert.equal(isoDate(new Date(2026, 0, 5)), '2026-01-05');
  assert.equal(isoDate(new Date(2026, 10, 25)), '2026-11-25');
});

test('addDays crosses month and year boundaries', () => {
  assert.equal(addDays('2026-01-31', 1), '2026-02-01');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2026-03-01', -1), '2026-02-28');
});

test('addDays does not mutate its input', () => {
  const start = new Date(2026, 4, 10);
  addDays(start, 5);
  assert.equal(isoDate(start), '2026-05-10');
});

test('startOfWeek honours Monday and Sunday starts', () => {
  const wednesday = new Date(2026, 10, 4);
  assert.equal(isoDate(startOfWeek(wednesday, 1)), '2026-11-02');
  assert.equal(isoDate(startOfWeek(wednesday, 0)), '2026-11-01');
  const sunday = new Date(2026, 10, 8);
  assert.equal(isoDate(startOfWeek(sunday, 1)), '2026-11-02');
  assert.equal(isoDate(startOfWeek(sunday, 0)), '2026-11-08');
});

test('parseDate rejects junk and keeps local midnight', () => {
  assert.equal(parseDate('not-a-date'), null);
  assert.equal(parseDate('2026-11-05').getHours(), 0);
});

test('clamp, plural and safeName behave as the UI expects', () => {
  assert.equal(clamp(1.4, 0, 1), 1);
  assert.equal(clamp(-2, 0, 1), 0);
  assert.equal(clamp('x', 0, 1), 0);
  assert.equal(plural(1, 'habit'), '1 habit');
  assert.equal(plural(3, 'habit'), '3 habits');
  assert.equal(plural(2, 'rest', 'rests'), '2 rests');
  assert.equal(safeName('  Read: "20" pages [daily]  '), 'Read 20 pages daily');
  assert.equal(safeName('   '), 'Untitled habit');
  assert.equal(esc('say "hi"'), 'say \\"hi\\"');
  assert.match(longDay('2026-11-05'), /November 5/);
});
