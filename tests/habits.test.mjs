import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isScheduled, completion, streakFor, daySummary, dueHabits, pickFocus,
  weekOverview, weekProgress, weekDone, weekCheckins, isExpired, isActiveHabit
} from '../src/habits.js';

const habit = (overrides = {}) => ({
  id: 'h', title: 'Habit', period: 'anytime', direction: 'build', frequency: 'daily',
  days: [1, 2, 3, 4, 5], target: 1, unit: 'time', startDate: '2026-01-01', endDate: '',
  archived: false, history: {}, color: '#d97706', icon: 'sprout', ...overrides
});

test('isScheduled respects frequency and the active date window', () => {
  assert.equal(isScheduled(habit(), '2026-05-04'), true);
  assert.equal(isScheduled(habit({ startDate: '2026-05-10' }), '2026-05-04'), false);
  assert.equal(isScheduled(habit({ endDate: '2026-05-01' }), '2026-05-04'), false);
  const weekdays = habit({ frequency: 'weekdays', days: [1, 3, 5] });
  assert.equal(isScheduled(weekdays, '2026-05-04'), true); // Monday
  assert.equal(isScheduled(weekdays, '2026-05-05'), false); // Tuesday
  assert.equal(isScheduled(habit({ frequency: 'weekly' }), '2026-05-06'), true);
  assert.equal(isScheduled(habit(), 'nope'), false);
});

test('completion understands targets, limits and planned rest', () => {
  const partial = habit({ target: 3, history: { '2026-05-04': { value: 1 } } });
  const state = completion(partial, '2026-05-04');
  assert.equal(state.done, false);
  assert.equal(state.ratio, 1 / 3);
  assert.equal(completion(partial, '2026-05-05').value, 0);

  const full = habit({ target: 3, history: { '2026-05-04': { value: 3 } } });
  assert.equal(completion(full, '2026-05-04').done, true);

  const quit = habit({ direction: 'quit', target: 2, history: { '2026-05-04': { value: 1 } } });
  assert.equal(completion(quit, '2026-05-04').done, true);
  assert.equal(completion(habit({ direction: 'quit', target: 2 }), '2026-05-04').done, false);
  assert.equal(completion(habit({ direction: 'quit', target: 2, history: { '2026-05-04': { value: 5 } } }), '2026-05-04').done, false);

  const rest = habit({ history: { '2026-05-04': { value: 0, status: 'skip' } } });
  const skipped = completion(rest, '2026-05-04');
  assert.equal(skipped.skipped, true);
  assert.equal(skipped.done, false);

  const weekly = habit({ frequency: 'weekly', target: 3, history: { '2026-05-04': { value: 1 } } });
  assert.equal(completion(weekly, '2026-05-04').done, true);
});

test('streakFor counts consecutive done days and lets planned rest pass through', () => {
  const tracked = habit({
    history: {
      '2026-01-01': { value: 1 },
      '2026-01-02': { value: 1 },
      '2026-01-03': { value: 1 },
      '2026-01-05': { value: 1 },
      '2026-01-06': { value: 0, status: 'skip' },
      '2026-01-07': { value: 1 }
    }
  });
  assert.deepEqual(streakFor(tracked, '2026-01-03'), { current: 3, best: 3 });
  assert.deepEqual(streakFor(tracked, '2026-01-07'), { current: 2, best: 3 });
});

test('daySummary and dueHabits work in period order', () => {
  const list = [
    habit({ id: 'night', title: 'Night', period: 'evening' }),
    habit({ id: 'am', title: 'AM', period: 'morning', history: { '2026-05-04': { value: 1 } } }),
    habit({ id: 'rest', title: 'Rest', period: 'morning', history: { '2026-05-04': { status: 'skip' } } }),
    habit({ id: 'off', title: 'Off', period: 'anytime', archived: true })
  ];
  const due = dueHabits(list, '2026-05-04');
  assert.deepEqual(due.map((item) => item.id), ['am', 'rest', 'night']);

  const summary = daySummary(list, '2026-05-04');
  assert.equal(summary.total, 3);
  assert.equal(summary.done, 1);
  assert.equal(summary.skipped, 1);
  assert.equal(summary.remaining, 1);
  assert.equal(summary.percent, 33);
  assert.equal(daySummary([], '2026-05-04').percent, 0);
});

test('pickFocus skips finished and rested habits', () => {
  const list = [
    habit({ id: 'am', title: 'AM', period: 'morning', history: { '2026-05-04': { value: 1 } } }),
    habit({ id: 'mid', title: 'Mid', period: 'afternoon', history: { '2026-05-04': { status: 'skip' } } }),
    habit({ id: 'pm', title: 'PM', period: 'evening' })
  ];
  assert.equal(pickFocus(list, '2026-05-04').id, 'pm');
  assert.equal(pickFocus([habit({ history: { '2026-05-04': { value: 1 } } })], '2026-05-04'), null);
});

test('weekOverview returns seven flagged days', () => {
  const week = weekOverview([habit()], '2026-11-05', 1, '2026-11-05');
  assert.equal(week.length, 7);
  assert.equal(week[0].key, '2026-11-02');
  assert.equal(week[6].key, '2026-11-08');
  assert.equal(week[3].isToday, true);
  assert.equal(week[3].isSelected, true);
  assert.equal(week[4].isFuture, true);
  assert.equal(week[3].total, 1);
  assert.equal(week[3].done, 0);
});

test('weekly aggregates count per-week check-ins and perfect days', () => {
  const list = [
    habit({ id: 'a', history: { '2026-11-03': { value: 1 }, '2026-11-05': { value: 1 } } }),
    habit({ id: 'b', period: 'evening', history: { '2026-11-03': { value: 1 } } })
  ];
  assert.equal(weekCheckins(list, '2026-11-05', 1), 3);
  assert.equal(weekDone(list, '2026-11-05', 1), 1);
  assert.deepEqual(weekProgress(list[0], '2026-11-05', 1), { count: 2, target: 1 });
});

test('archive helpers treat expired habits as inactive', () => {
  assert.equal(isExpired(habit({ endDate: '2026-01-01' }), '2026-05-04'), true);
  assert.equal(isActiveHabit(habit({ endDate: '2026-01-01' })), false);
  assert.equal(isActiveHabit(habit({ endDate: '2099-01-01' })), true);
});
