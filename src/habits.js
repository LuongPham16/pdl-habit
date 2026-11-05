/**
 * Habit maths: scheduling, completion, streaks and the aggregates the view needs.
 * Everything is derived from the habit object plus its markdown `history`.
 */
import { clamp, parseDate, addDays, startOfWeek, dateRange, isoDate } from './dates.js';
import { PERIOD_ORDER } from './constants.js';

export const normalizeHistory = (value) => (value && typeof value === 'object' && !Array.isArray(value) ? { ...value } : {});

export const isExpired = (habit, today = isoDate()) => Boolean(habit.endDate && habit.endDate < today);

export const isActiveHabit = (habit) => !habit.archived && !isExpired(habit);

export function isScheduled(habit, key) {
  const date = parseDate(key);
  if (!date || key < habit.startDate || (habit.endDate && key > habit.endDate)) return false;
  if (habit.frequency === 'daily') return true;
  if (habit.frequency === 'weekdays') return habit.days.includes(date.getDay());
  if (habit.frequency === 'weekly') return true;
  return false;
}

export function entryValue(entry) { return typeof entry === 'number' ? entry : Number(entry?.value) || 0; }

export function entryStatus(entry) { return typeof entry === 'object' ? entry?.status || '' : ''; }

export function completion(habit, key) {
  const entry = habit.history[key];
  if (entryStatus(entry) === 'skip') return { ratio: 0, done: false, skipped: true, value: 0 };
  const value = entryValue(entry);
  const target = habit.frequency === 'weekly' ? 1 : Math.max(1, habit.target);
  const ratio = clamp(value / target, 0, 1);
  return {
    ratio,
    done: habit.direction === 'quit' ? value <= target && Boolean(entry) : ratio >= 1,
    skipped: false,
    value
  };
}

export function scheduledKeys(habit, from, to) {
  const keys = [];
  for (let key = from; key <= to; key = addDays(key, 1)) if (isScheduled(habit, key)) keys.push(key);
  return keys;
}

export function streakFor(habit, until = null) {
  const today = isoDate();
  const stop = until || today;
  let best = 0; let run = 0; let cursor = habit.startDate;
  while (cursor <= stop && cursor <= today) {
    if (isScheduled(habit, cursor)) {
      const state = completion(habit, cursor);
      if (state.skipped) { /* planned rest preserves a streak */ }
      else if (state.done) { run += 1; best = Math.max(best, run); }
      else if (cursor < today) run = 0;
    }
    cursor = addDays(cursor, 1);
  }
  return { current: run, best };
}

/** Habits whose day is a simple yes/no: did it once, or N sessions per week. */
export function isBinaryHabit(habit) {
  if (habit.frequency === 'weekly') return true;
  return habit.direction === 'build' && Math.max(1, Number(habit.target) || 1) <= 1;
}

/** Check-ins inside the calendar week that contains `key`. */
export function weekProgress(habit, key, weekStartsOn = 1) {
  const weekStart = isoDate(startOfWeek(parseDate(key), weekStartsOn));
  const count = dateRange(weekStart, 7).filter((dateKey) => entryValue(habit.history[dateKey]) > 0).length;
  return { count, target: Math.max(1, habit.target) };
}

/** Every habit due on `key`, ordered morning → anytime. */
export function dueHabits(habits, key) {
  return habits
    .filter((habit) => isActiveHabit(habit) && isScheduled(habit, key))
    .sort((a, b) => PERIOD_ORDER.indexOf(a.period) - PERIOD_ORDER.indexOf(b.period) || a.title.localeCompare(b.title));
}

/** Totals for one day, used by the hero ring and the week strip. */
export function daySummary(habits, key) {
  const due = dueHabits(habits, key);
  const done = due.filter((habit) => completion(habit, key).done).length;
  const skipped = due.filter((habit) => completion(habit, key).skipped).length;
  return {
    due,
    total: due.length,
    done,
    skipped,
    remaining: Math.max(0, due.length - done - skipped),
    ratio: due.length ? done / due.length : 0,
    percent: due.length ? Math.round((done / due.length) * 100) : 0
  };
}

/** Seven days around `key` for the week strip. */
export function weekOverview(habits, key, weekStartsOn = 1, today = isoDate()) {
  const first = isoDate(startOfWeek(parseDate(key), weekStartsOn));
  return dateRange(first, 7).map((dateKey) => {
    const summary = daySummary(habits, dateKey);
    const date = parseDate(dateKey);
    return {
      key: dateKey,
      day: date.getDay(),
      date: date.getDate(),
      done: summary.done,
      total: summary.total,
      ratio: summary.ratio,
      isToday: dateKey === today,
      isSelected: dateKey === key,
      isFuture: dateKey > today
    };
  });
}

/** The single habit worth nudging next: earliest unfinished, skipping planned rests. */
export function pickFocus(habits, key) {
  const due = dueHabits(habits, key);
  return due.find((habit) => {
    const state = completion(habit, key);
    return !state.done && !state.skipped;
  }) || null;
}

/** Longest current streak among the habits due on `key`. */
export function bestCurrentStreak(habits, key) {
  return dueHabits(habits, key).reduce((max, habit) => Math.max(max, streakFor(habit, key).current), 0);
}

/** Completed days in the current week — the "this week" hero stat. */
export function weekDone(habits, key, weekStartsOn = 1) {
  const first = isoDate(startOfWeek(parseDate(key), weekStartsOn));
  return dateRange(first, 7).reduce((sum, dateKey) => {
    const summary = daySummary(habits, dateKey);
    return sum + (summary.total && summary.done === summary.total ? 1 : 0);
  }, 0);
}

/** Raw completed check-ins in the current week — the third hero stat. */
export function weekCheckins(habits, key, weekStartsOn = 1) {
  const first = isoDate(startOfWeek(parseDate(key), weekStartsOn));
  return dateRange(first, 7).reduce((sum, dateKey) => sum + daySummary(habits, dateKey).done, 0);
}

/** Totals for one calendar month, ignoring days that have not happened yet. */
export function monthSummary(habits, year, month, today = isoDate()) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let due = 0;
  let done = 0;
  let logged = 0;
  let perfect = 0;
  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = isoDate(new Date(year, month, day));
    if (key > today) continue;
    const summary = daySummary(habits, key);
    due += summary.total;
    done += summary.done;
    if (summary.done > 0) logged += 1;
    if (summary.total && summary.done === summary.total) perfect += 1;
  }
  return { due, done, logged, perfect, rate: due ? Math.round((done / due) * 100) : 0 };
}

/** Rolling window totals behind the Insights header cards. */
export function windowStats(habits, days = 30, today = isoDate()) {
  let due = 0;
  let done = 0;
  let perfect = 0;
  let rests = 0;
  for (let offset = 0; offset < days; offset += 1) {
    const key = addDays(today, -offset);
    const summary = daySummary(habits, key);
    due += summary.total;
    done += summary.done;
    rests += summary.skipped;
    if (summary.total && summary.done === summary.total) perfect += 1;
  }
  return { days, due, done, rests, perfect, rate: due ? Math.round((done / due) * 100) : 0 };
}

/* ------------------------------------------------------- list utilities */

export const SORT_MODES = [
  ['title', 'Title A–Z'],
  ['streak', 'Streak'],
  ['rate', '30-day rate'],
  ['category', 'Category']
];

/** Case-insensitive search over the fields a user can actually recognise. */
export function filterHabits(habits, { query = '', category = 'all' } = {}) {
  const needle = String(query || '').trim().toLowerCase();
  return habits.filter((habit) => {
    if (category !== 'all' && habit.category !== category) return false;
    if (!needle) return true;
    const haystack = [habit.title, habit.category, habit.description, habit.unit, habit.cue]
      .filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(needle);
  });
}

/** Categories present in a list, alphabetical — used to build the filter menu. */
export function habitCategories(habits) {
  return [...new Set(habits.map((habit) => habit.category).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
}

/**
 * Order a habit list. `statsFor` is only called for the modes that need numbers,
 * and only once per habit.
 */
export function sortHabits(habits, mode = 'title', statsFor = null) {
  const byTitle = (a, b) => a.title.localeCompare(b.title);
  const byCategory = (a, b) => String(a.category || '').localeCompare(String(b.category || '')) || byTitle(a, b);

  if (mode === 'category') return [...habits].sort(byCategory);
  if ((mode === 'streak' || mode === 'rate') && typeof statsFor === 'function') {
    const decorated = habits.map((habit) => {
      const stats = statsFor(habit) || {};
      const value = mode === 'streak' ? Number(stats?.streak?.current) || 0 : Number(stats?.rate) || 0;
      return { habit, value };
    });
    return decorated
      .sort((a, b) => b.value - a.value || byTitle(a.habit, b.habit))
      .map((entry) => entry.habit);
  }
  return [...habits].sort(byTitle);
}

/** Split an already sorted list into category groups (insertion order preserved). */
export function groupHabitsByCategory(habits) {
  const groups = [];
  habits.forEach((habit) => {
    const category = habit.category || 'Uncategorised';
    const last = groups[groups.length - 1];
    if (last && last.category === category) last.habits.push(habit);
    else groups.push({ category, habits: [habit] });
  });
  return groups;
}
