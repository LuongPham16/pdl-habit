/** Shared identifiers, palette and icon catalogue for PDL Habit. */

export const VIEW_TYPE = 'pdl-habit-dashboard';

export const VIEWS = [
  { id: 'today', label: 'Today', icon: 'sun' },
  { id: 'habits', label: 'Habits', icon: 'list-checks' },
  { id: 'calendar', label: 'Calendar', icon: 'calendar-days' },
  { id: 'insights', label: 'Insights', icon: 'chart-no-axes-combined' }
];

/** Archive lives inside Habits as a scope, so it is not a destination of its own. */
export const VIEW_IDS = VIEWS.map((view) => view.id);

export const COLORS = ['#d97706', '#059669', '#2563eb', '#db2777', '#7c3aed', '#dc2626', '#0891b2', '#64748b'];

export const HABIT_ICONS = [
  ['Wellness', ['heart-pulse', 'activity', 'pill', 'stethoscope', 'brain', 'smile', 'bed', 'moon', 'sun', 'sparkles', 'leaf', 'flower-2']],
  ['Fitness', ['dumbbell', 'bike', 'footprints', 'person-standing', 'timer', 'trophy', 'medal', 'mountain', 'waves', 'flame', 'zap', 'target']],
  ['Food & drink', ['glass-water', 'cup-soda', 'coffee', 'apple', 'salad', 'carrot', 'cooking-pot', 'utensils', 'wine-off', 'cigarette-off', 'cookie', 'sandwich']],
  ['Learning', ['book-open', 'book-marked', 'graduation-cap', 'languages', 'pencil', 'notebook-pen', 'library', 'lightbulb', 'microscope', 'calculator', 'code-2', 'headphones']],
  ['Mindfulness', ['sprout', 'cloud-sun', 'wind', 'music', 'palette', 'pen-line', 'message-circle-heart', 'hand-heart', 'circle', 'eye', 'ear', 'circle-dot']],
  ['Work', ['briefcase', 'laptop', 'calendar-check', 'list-checks', 'circle-check-big', 'clock-3', 'focus', 'inbox', 'mail-check', 'phone-off', 'chart-no-axes-combined', 'rocket']],
  ['Life', ['home', 'wallet-cards', 'piggy-bank', 'users', 'baby', 'dog', 'cat', 'trees', 'shower-head', 'paintbrush', 'shopping-basket', 'map-pin']]
];

export const DEFAULT_SETTINGS = { rootFolder: '03 - Area/Habits', weekStartsOn: 1, defaultView: 'today' };

export const PERIODS = { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening', anytime: 'Anytime' };

/** Order used everywhere the day is grouped, morning first. */
export const PERIOD_ORDER = ['morning', 'afternoon', 'evening', 'anytime'];

export const PERIOD_ICONS = {
  morning: 'sunrise',
  afternoon: 'sun',
  evening: 'moon-star',
  anytime: 'infinity'
};

export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];