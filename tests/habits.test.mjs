import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isScheduled, completion, streakFor, daySummary, dueHabits, pickFocus,
  weekOverview, weekProgress, weekDone, weekCheckins, isExpired, isActiveHabit,
  monthSummary, windowStats, filterHabits, sortHabits, groupHabitsByCategory, habitCategories,
  isBinaryHabit, monthProgress, dayRates, weekdayRates, categoryRates, momentum
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

test('isBinaryHabit separates yes/no habits from counted ones', () => {
  assert.equal(isBinaryHabit(habit({ target: 1 })), true);
  assert.equal(isBinaryHabit(habit({ frequency: 'weekly', target: 3 })), true, 'sessions per week');
  assert.equal(isBinaryHabit(habit({ target: 3, unit: 'ly' })), false, 'count habits get a stepper');
  assert.equal(isBinaryHabit(habit({ direction: 'quit', target: 2 })), false, 'limits are counted too');
});

test('monthSummary ignores days that have not happened yet', () => {
  const tracked = habit({ history: { '2026-05-02': { value: 1 }, '2026-05-03': { value: 1 } } });
  const may = monthSummary([tracked], 2026, 4, '2026-05-04');
  assert.equal(may.due, 4);
  assert.equal(may.done, 2);
  assert.equal(may.logged, 2);
  assert.equal(may.perfect, 2);
  assert.equal(may.rate, 50);

  const future = monthSummary([tracked], 2026, 5, '2026-05-04');
  assert.deepEqual(future, { due: 0, done: 0, logged: 0, perfect: 0, rate: 0 });
});

test('windowStats rolls a fixed number of days', () => {
  const tracked = habit({ history: { '2026-05-02': { value: 1 }, '2026-05-03': { status: 'skip' } } });
  const window = windowStats([tracked], 3, '2026-05-04');
  assert.equal(window.days, 3);
  assert.equal(window.due, 3);
  assert.equal(window.done, 1);
  assert.equal(window.rests, 1);
  assert.equal(window.perfect, 1);
  assert.equal(window.rate, 33);
});

/* --------------------------------------------------- list: search / sort */

const list = () => [
  habit({ id: 'water', title: 'Uống nước', category: 'Health', description: 'Ba ly trước bữa trưa', unit: 'ly' }),
  habit({ id: 'pill', title: 'Uống thuốc', category: 'Health', unit: 'viên' }),
  habit({ id: 'fap', title: 'No Fap', category: 'Personal' }),
  habit({ id: 'loose', title: 'Đi bộ', category: '' })
];

test('filterHabits searches title, category, description and unit', () => {
  assert.equal(filterHabits(list(), { query: 'uống' }).length, 2);
  assert.equal(filterHabits(list(), { query: 'UỐNG' }).length, 2);
  assert.equal(filterHabits(list(), { query: 'ly' }).length, 1);
  assert.equal(filterHabits(list(), { query: 'personal' }).length, 1);
  assert.equal(filterHabits(list(), { query: 'không có gì' }).length, 0);
  assert.equal(filterHabits(list(), {}).length, 4);
  assert.equal(filterHabits(list(), { query: '   ' }).length, 4);
});

test('filterHabits narrows by category on top of the search', () => {
  assert.equal(filterHabits(list(), { category: 'Health' }).length, 2);
  assert.equal(filterHabits(list(), { category: 'Health', query: 'thuốc' }).length, 1);
  assert.equal(filterHabits(list(), { category: 'all', query: 'thuốc' }).length, 1);
  assert.equal(filterHabits(list(), { category: 'Nope' }).length, 0);
  assert.deepEqual(habitCategories(list()), ['Health', 'Personal']);
});

test('sortHabits orders by title, rate or streak without mutating the input', () => {
  const input = list();
  const snapshot = input.map((item) => item.id);

  assert.deepEqual(sortHabits(input, 'title').map((item) => item.id), ['loose', 'fap', 'water', 'pill']);
  assert.deepEqual(input.map((item) => item.id), snapshot);

  const rates = { water: 90, pill: 30, fap: 60, loose: 10 };
  const streaks = { water: 1, pill: 9, fap: 2, loose: 3 };
  const statsFor = (item) => ({ rate: rates[item.id], streak: { current: streaks[item.id] } });
  assert.deepEqual(sortHabits(input, 'rate', statsFor).map((item) => item.id), ['water', 'fap', 'pill', 'loose']);
  assert.deepEqual(sortHabits(input, 'streak', statsFor).map((item) => item.id), ['pill', 'loose', 'fap', 'water']);
  // Without stats, numeric sorts fall back to title order.
  assert.deepEqual(sortHabits(input, 'streak').map((item) => item.id), ['loose', 'fap', 'water', 'pill']);
});

test('sortHabits by category groups equal categories together', () => {
  const sorted = sortHabits(list(), 'category');
  assert.deepEqual(sorted.map((item) => item.category), ['', 'Health', 'Health', 'Personal']);
  const groups = groupHabitsByCategory(sorted);
  assert.equal(groups.length, 3);
  assert.equal(groups[0].category, 'Uncategorised');
  assert.equal(groups[1].category, 'Health');
  assert.equal(groups[1].habits.length, 2);
});

test('interval habits are due every N days from their start date', () => {
  const everyThree = habit({ frequency: 'interval', intervalDays: 3, startDate: '2026-05-01' });
  assert.equal(isScheduled(everyThree, '2026-05-01'), true);
  assert.equal(isScheduled(everyThree, '2026-05-02'), false);
  assert.equal(isScheduled(everyThree, '2026-05-04'), true);
  assert.equal(isScheduled(everyThree, '2026-05-07'), true);
  assert.equal(isScheduled({ ...everyThree, intervalDays: 0 }, '2026-05-02'), true, 'falls back to daily');
});

test('monthly habits count sessions, not amounts', () => {
  const monthly = habit({ frequency: 'monthly', target: 4, history: { '2026-05-02': { value: 1 } } });
  assert.equal(completion(monthly, '2026-05-02').done, true, 'one check-in completes the day');
  assert.equal(isBinaryHabit(monthly), true);
  const progress = monthProgress(monthly, '2026-05-15');
  assert.deepEqual(progress, { count: 1, target: 4 });
});

test('monthProgress counts every check-in inside the month', () => {
  const tracked = habit({ frequency: 'monthly', target: 4, history: { '2026-05-02': { value: 1 }, '2026-05-20': { value: 1 }, '2026-06-01': { value: 1 } } });
  assert.equal(monthProgress(tracked, '2026-05-10').count, 2);
});

test('dayRates reports a ratio per day, oldest first', () => {
  const done = habit({ history: { '2026-05-01': { value: 1 }, '2026-05-03': { value: 1 } } });
  const rates = dayRates([done], '2026-05-03', 3);
  assert.deepEqual(rates.map((day) => day.key), ['2026-05-01', '2026-05-02', '2026-05-03']);
  assert.deepEqual(rates.map((day) => day.ratio), [1, 0, 1]);
});

test('weekdayRates buckets every scheduled day', () => {
  const tracked = habit({ history: { '2026-05-01': { value: 1 }, '2026-05-02': { value: 1 } } });
  const buckets = weekdayRates([tracked], '2026-05-07', 7);
  assert.equal(buckets.length, 7);
  assert.equal(buckets.reduce((sum, bucket) => sum + bucket.due, 0), 7);
  assert.equal(buckets.reduce((sum, bucket) => sum + bucket.done, 0), 2);
});

test('categoryRates groups habits and sorts the best first', () => {
  const strong = habit({ category: 'Health', history: { '2026-05-01': { value: 1 }, '2026-05-02': { value: 1 } } });
  const weak = habit({ category: 'Learning', history: {} });
  const buckets = categoryRates([strong, weak], '2026-05-02', 2);
  assert.deepEqual(buckets.map((bucket) => bucket.category), ['Health', 'Learning']);
  assert.equal(buckets[0].ratio, 1);
  assert.equal(buckets[1].ratio, 0);
  assert.equal(buckets[0].due, 2);
});

test('momentum flags habits that slipped in the newer half', () => {
  const history = {};
  for (let day = 1; day <= 5; day += 1) history[`2026-05-0${day}`] = { value: 1 };
  const dropped = habit({ history });
  const steady = habit({ history: {} });
  for (let day = 1; day <= 10; day += 1) steady.history[`2026-05-${String(day).padStart(2, '0')}`] = { value: 1 };
  const slipping = momentum([dropped, steady], '2026-05-10', 10);
  assert.equal(slipping.length, 1);
  assert.equal(slipping[0].habit, dropped);
  assert.ok(slipping[0].delta <= -0.1);
});
