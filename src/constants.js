/** Shared identifiers, palette and icon catalogue for PDL Habit. */

export const VIEW_TYPE = 'pdlh-habit-dashboard';

export const VIEWS = [
  { id: 'today', label: 'Today', icon: 'sun' },
  { id: 'habits', label: 'Habits', icon: 'list-checks' },
  { id: 'calendar', label: 'Calendar', icon: 'calendar-days' },
  { id: 'insights', label: 'Insights', icon: 'chart-no-axes-combined' }
];

/** Archive lives inside Habits as a scope, so it is not a destination of its own. */
export const VIEW_IDS = VIEWS.map((view) => view.id);

/** Fallback palette for defaults; any hex colour can be picked in the form. */
export const COLORS = ['#d97706', '#059669', '#2563eb', '#db2777', '#7c3aed', '#dc2626', '#0891b2', '#64748b'];

export const DEFAULT_COLOR = COLORS[0];

/**
 * Icon catalogue, grouped by intent. Every name is a Lucide icon; the form falls
 * back to `sprout` if an older Obsidian build does not ship a given glyph.
 */
export const HABIT_ICONS = [
  ['Wellness & mood', [
    'heart-pulse', 'activity', 'heart', 'heart-crack', 'stethoscope', 'pill', 'syringe', 'brain',
    'smile', 'frown', 'meh', 'laugh', 'angry', 'thumbs-up', 'thumbs-down', 'hand-heart',
    'bed', 'moon', 'moon-star', 'sun', 'sunrise', 'sunset', 'sparkles', 'eye', 'ear'
  ]],
  ['Fitness & movement', [
    'dumbbell', 'bike', 'footprints', 'person-standing', 'timer', 'hourglass', 'trophy', 'medal',
    'mountain', 'mountain-snow', 'waves', 'flame', 'zap', 'target', 'crosshair', 'compass',
    'anchor', 'rocket', 'battery-charging', 'gauge'
  ]],
  ['Food & drink', [
    'glass-water', 'cup-soda', 'coffee', 'apple', 'banana', 'cherry', 'grape', 'salad', 'carrot',
    'cooking-pot', 'utensils', 'utensils-crossed', 'wine', 'wine-off', 'beer', 'cigarette-off',
    'cookie', 'cake-slice', 'sandwich', 'pizza'
  ]],
  ['Learning & focus', [
    'book', 'book-open', 'book-marked', 'library', 'graduation-cap', 'languages', 'pencil',
    'pen-line', 'notebook-pen', 'notebook', 'lightbulb', 'microscope', 'calculator', 'code-2',
    'code-xml', 'terminal', 'headphones', 'music', 'palette', 'brush'
  ]],
  ['Mind & mindfulness', [
    'sprout', 'leaf', 'flower-2', 'feather', 'trees', 'tree-pine', 'cloud-sun', 'cloud-moon',
    'message-circle-heart', 'circle', 'circle-dot', 'star'
  ]],
  ['Work', [
    'briefcase', 'laptop', 'calendar-check', 'list-checks', 'circle-check-big', 'clipboard-check',
    'clock-3', 'clock', 'watch', 'alarm-clock', 'focus', 'inbox', 'mail-check', 'phone-off',
    'presentation', 'chart-line', 'chart-no-axes-combined', 'file-text', 'folder', 'search', 'settings'
  ]],
  ['Home & life', [
    'house', 'home', 'lamp', 'sofa', 'bath', 'shower-head', 'paintbrush', 'shopping-basket',
    'shopping-cart', 'wallet', 'wallet-cards', 'piggy-bank', 'key', 'door-open', 'gift', 'map-pin',
    'car', 'bus', 'plane', 'train-front', 'umbrella', 'scissors', 'trash-2', 'bell', 'bell-ring'
  ]],
  ['People & pets', [
    'users', 'user', 'baby', 'dog', 'cat', 'fish', 'bird', 'handshake', 'phone', 'video', 'mic'
  ]],
  ['Weather & nature', [
    'cloud', 'cloud-rain', 'snowflake', 'droplet', 'droplets', 'wind', 'rainbow', 'sun-dim', 'sun-medium'
  ]],
  ['Devices', [
    'smartphone', 'monitor', 'keyboard', 'mouse', 'camera', 'wifi', 'plug', 'cpu'
  ]]
].map(([group, icons]) => [group, [...new Set(icons)]]);

/** Flat list, used by the picker search and by tests. */
export const ICON_NAMES = HABIT_ICONS.flatMap(([, icons]) => icons);

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
