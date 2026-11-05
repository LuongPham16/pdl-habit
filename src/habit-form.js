/**
 * Draft model behind the habit form: the UI speaks in three simple types
 * (did it / count / limit) and three schedules, then maps back onto the
 * frontmatter fields the plugin has always used.
 */
import { COLORS, PERIODS } from './constants.js';
import { isoDate } from './dates.js';

export const TRACKING_OPTIONS = [
  ['check', 'Did it'],
  ['count', 'Count'],
  ['limit', 'Limit']
];

export const SCHEDULE_OPTIONS = [
  ['daily', 'Every day'],
  ['days', 'Selected days'],
  ['week', 'Times per week']
];

export const PERIOD_OPTIONS = Object.entries(PERIODS);

/** A brand new habit: the smallest set of decisions that still makes sense. */
export function emptyDraft() {
  return {
    name: '',
    tracking: 'check',
    target: 1,
    unit: 'time',
    period: 'anytime',
    schedule: 'daily',
    days: [1, 2, 3, 4, 5],
    perWeek: 3,
    icon: 'sprout',
    color: COLORS[0],
    description: '',
    category: 'Personal',
    cue: '',
    reward: '',
    startDate: isoDate(),
    endDate: ''
  };
}

/** Which of the three simple types best describes an existing habit. */
export function trackingFromHabit(habit) {
  if (habit.direction === 'quit') return 'limit';
  if (habit.frequency !== 'weekly' && Number(habit.target) > 1) return 'count';
  return 'check';
}

/** Existing habit → editable draft. */
export function draftFromHabit(habit) {
  const weekly = habit.frequency === 'weekly';
  return {
    name: habit.title || '',
    tracking: trackingFromHabit(habit),
    target: weekly ? 1 : Math.max(1, Number(habit.target) || 1),
    unit: habit.unit || 'time',
    period: habit.period || 'anytime',
    schedule: weekly ? 'week' : habit.frequency === 'weekdays' ? 'days' : 'daily',
    days: Array.isArray(habit.days) && habit.days.length ? [...habit.days] : [1, 2, 3, 4, 5],
    perWeek: weekly ? Math.max(1, Number(habit.target) || 1) : 3,
    icon: habit.icon || 'sprout',
    color: habit.color || COLORS[0],
    description: habit.description || '',
    category: habit.category || 'Personal',
    cue: habit.cue || '',
    reward: habit.reward || '',
    startDate: habit.startDate || isoDate(),
    endDate: habit.endDate || ''
  };
}

/** Returns an error message, or '' when the draft can be saved. */
export function validateDraft(draft) {
  if (!String(draft.name || '').trim()) return 'Give the habit a name.';
  if (draft.schedule === 'days' && !draft.days.length) return 'Pick at least one day.';
  if (draft.endDate && draft.endDate < (draft.startDate || isoDate())) return 'End date must be after the start date.';
  if (draft.schedule === 'week' && !(Number(draft.perWeek) >= 1)) return 'Times per week must be at least 1.';
  if (draft.tracking !== 'check' && draft.schedule !== 'week' && !(Number(draft.target) >= 1)) return 'The amount must be at least 1.';
  return '';
}

/** Draft → the object `plugin.saveHabit` expects. */
export function habitFromDraft(draft) {
  const frequency = draft.schedule === 'week' ? 'weekly' : draft.schedule === 'days' ? 'weekdays' : 'daily';
  const amount = Math.min(999, Math.max(1, Math.round(Number(draft.target) || 1)));
  const perWeek = Math.min(7, Math.max(1, Math.round(Number(draft.perWeek) || 1)));
  const check = draft.tracking === 'check';
  return {
    title: String(draft.name || '').trim(),
    description: String(draft.description || '').trim(),
    category: String(draft.category || '').trim() || 'Personal',
    period: draft.period || 'anytime',
    direction: draft.tracking === 'limit' ? 'quit' : 'build',
    frequency,
    days: frequency === 'weekdays' ? [...draft.days].sort((a, b) => a - b) : [],
    target: frequency === 'weekly' ? perWeek : check ? 1 : amount,
    unit: check ? 'time' : String(draft.unit || '').trim() || 'time',
    icon: draft.icon || 'sprout',
    color: draft.color || COLORS[0],
    startDate: draft.startDate || isoDate(),
    endDate: draft.endDate || '',
    cue: String(draft.cue || '').trim(),
    reward: String(draft.reward || '').trim()
  };
}

/** How many optional fields carry a value — shown next to "More options". */
export function advancedCount(draft) {
  return [
    String(draft.description || '').trim(),
    draft.category && draft.category !== 'Personal' ? draft.category : '',
    String(draft.cue || '').trim(),
    String(draft.reward || '').trim(),
    draft.endDate || ''
  ].filter(Boolean).length;
}
