import test from 'node:test';
import assert from 'node:assert/strict';
import {
  emptyDraft, draftFromHabit, habitFromDraft, validateDraft, trackingFromHabit, advancedCount, clampStepper
} from '../src/habit-form.js';

const habit = (overrides = {}) => ({
  title: 'Read', description: '', category: 'Personal', period: 'anytime', direction: 'build',
  frequency: 'daily', days: [1, 2, 3, 4, 5], target: 1, unit: 'time', icon: 'sprout', color: '#d97706',
  startDate: '2026-01-01', endDate: '', cue: '', reward: '', ...overrides
});

test('emptyDraft is the shortest possible habit', () => {
  const draft = emptyDraft();
  assert.equal(draft.tracking, 'check');
  assert.equal(draft.schedule, 'daily');
  assert.equal(draft.period, 'anytime');
  assert.equal(draft.target, 1);
  assert.equal(draft.name, '');
});

test('trackingFromHabit recognises the three simple types', () => {
  assert.equal(trackingFromHabit(habit()), 'check');
  assert.equal(trackingFromHabit(habit({ target: 3, unit: 'ly' })), 'count');
  assert.equal(trackingFromHabit(habit({ direction: 'quit', target: 2 })), 'limit');
  assert.equal(trackingFromHabit(habit({ frequency: 'weekly', target: 3 })), 'check');
});

test('draftFromHabit round-trips every schedule', () => {
  const daily = draftFromHabit(habit({ title: 'Read', target: 20, unit: 'pages' }));
  assert.equal(daily.name, 'Read');
  assert.equal(daily.tracking, 'count');
  assert.equal(daily.target, 20);
  assert.equal(daily.unit, 'pages');
  assert.equal(daily.schedule, 'daily');

  const weekdays = draftFromHabit(habit({ frequency: 'weekdays', days: [1, 3, 5] }));
  assert.equal(weekdays.schedule, 'days');
  assert.deepEqual(weekdays.days, [1, 3, 5]);

  const weekly = draftFromHabit(habit({ frequency: 'weekly', target: 4 }));
  assert.equal(weekly.schedule, 'week');
  assert.equal(weekly.perWeek, 4);
  assert.equal(weekly.tracking, 'check');
});

test('habitFromDraft maps the UI back onto frontmatter fields', () => {
  const check = habitFromDraft({ ...emptyDraft(), name: '  Brush teeth  ' });
  assert.equal(check.title, 'Brush teeth');
  assert.equal(check.target, 1);
  assert.equal(check.unit, 'time');
  assert.equal(check.direction, 'build');
  assert.equal(check.frequency, 'daily');
  assert.deepEqual(check.days, []);

  const count = habitFromDraft({ ...emptyDraft(), name: 'Water', tracking: 'count', target: 3, unit: 'ly', schedule: 'days', days: [5, 1, 3] });
  assert.equal(count.target, 3);
  assert.equal(count.unit, 'ly');
  assert.equal(count.frequency, 'weekdays');
  assert.deepEqual(count.days, [1, 3, 5], 'weekdays are sorted');

  const limit = habitFromDraft({ ...emptyDraft(), name: 'Sweets', tracking: 'limit', target: 2, unit: 'piece' });
  assert.equal(limit.direction, 'quit');
  assert.equal(limit.target, 2);

  const weekly = habitFromDraft({ ...emptyDraft(), name: 'Gym', schedule: 'week', perWeek: 3 });
  assert.equal(weekly.frequency, 'weekly');
  assert.equal(weekly.target, 3);
  assert.equal(weekly.days.length, 0);
});

test('validateDraft blocks the states that would create a broken habit', () => {
  assert.match(validateDraft(emptyDraft()), /name/i);
  assert.match(validateDraft({ ...emptyDraft(), name: 'x', schedule: 'days', days: [] }), /day/i);
  assert.match(validateDraft({ ...emptyDraft(), name: 'x', startDate: '2026-05-10', endDate: '2026-05-01' }), /after/i);
  assert.equal(validateDraft({ ...emptyDraft(), name: 'x' }), '');
  assert.equal(validateDraft({ ...emptyDraft(), name: 'x', schedule: 'week', perWeek: 3 }), '');
});

test('advancedCount reports how many optional fields are filled', () => {
  assert.equal(advancedCount(emptyDraft()), 0);
  assert.equal(advancedCount({ ...emptyDraft(), description: 'why' }), 1);
  assert.equal(advancedCount({ ...emptyDraft(), description: 'why', category: 'Health', cue: 'coffee', endDate: '2026-06-01' }), 4);
});

test('clampStepper keeps the − / + counter sane', () => {
  assert.equal(clampStepper(0), 0);
  assert.equal(clampStepper(''), 0);
  assert.equal(clampStepper('abc'), 0);
  assert.equal(clampStepper(-4), 0, 'never negative');
  assert.equal(clampStepper(1.6), 2, 'rounds');
  assert.equal(clampStepper(1000), 99, 'caps at 99');
  assert.equal(clampStepper(5, 0, 7), 5);
  assert.equal(clampStepper(9, 0, 7), 7);
});
