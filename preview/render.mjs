/**
 * Renders the real PDL Habit views with mock data and writes standalone HTML pages
 * (every tab, light/dark/narrow) so the design can be reviewed without Obsidian.
 */
import fs from 'node:fs';
import path from 'node:path';
import { installDom, El } from './dom-shim.mjs';
import { PDLHabitView } from '../src/view.js';
import { PDLHabitPlugin } from '../src/plugin.js';
import { HabitModal, HabitIconModal } from '../src/modals/habit.js';
import { HabitDetailModal } from '../src/modals/detail.js';
import { CheckinModal } from '../src/modals/checkin.js';
import { toast } from '../src/ui.js';
import { setLanguage } from '../src/i18n.js';

const { } = installDom();

const ROOT = path.resolve('.');
const today = new Date();
const pad = (value) => String(value).padStart(2, '0');
const iso = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const shift = (amount) => { const date = new Date(today); date.setDate(date.getDate() + amount); return iso(date); };

/** Deterministic pseudo-random so previews stay stable between runs. */
const seeded = (seed) => { let value = seed; return () => { value = (value * 1103515245 + 12345) % 2147483648; return value / 2147483648; }; };

function buildHistory(seed, { rate = 0.7, skipEvery = 9 } = {}) {
  const random = seeded(seed);
  const history = {};
  for (let offset = 1; offset <= 40; offset += 1) {
    const key = shift(-offset);
    if (offset % skipEvery === 0) { history[key] = { value: 0, status: 'skip' }; continue; }
    if (random() < rate) history[key] = { value: 1 };
  }
  return history;
}

const base = {
  direction: 'build', days: [0, 1, 2, 3, 4, 5, 6], startDate: shift(-60), endDate: '', cue: '', reward: '',
  archived: false, description: ''
};

const habits = [
  {
    ...base, id: 'Chườm đá', title: 'Chườm đá', description: 'Giảm đau vai gáy sau giờ làm.', category: 'Wellness',
    period: 'morning', frequency: 'daily', target: 1, unit: 'lần', icon: 'snowflake', color: '#059669',
    history: {
      ...buildHistory(11, { rate: 0.86 }),
      [shift(-4)]: { value: 1, note: 'Chườm 15 phút, vai đỡ hẳn.' },
      [shift(0)]: { value: 1 }
    }
  },
  {
    ...base, id: 'Uống nước', title: 'Uống nước', description: 'Ba ly trước bữa trưa.', category: 'Health',
    period: 'afternoon', frequency: 'daily', target: 3, unit: 'ly', icon: 'glass-water', color: '#0891b2',
    history: { ...buildHistory(23, { rate: 0.6 }), [shift(-2)]: { value: 3, note: 'Ngày nóng, uống đủ 3 ly.' }, [shift(0)]: { value: 1 } }
  },
  {
    ...base, id: 'Tập thể dục', title: 'Tập thể dục', description: 'Ba buổi mỗi tuần là đủ.', category: 'Fitness',
    period: 'evening', frequency: 'weekly', target: 3, unit: 'buổi', icon: 'dumbbell', color: '#7c3aed',
    startDate: shift(-90), history: { [shift(-1)]: { value: 1 }, [shift(-3)]: { value: 1 } }
  },
  {
    ...base, id: 'No Fap', title: 'No Fap', category: 'Personal',
    period: 'anytime', frequency: 'daily', target: 1, unit: 'lần', icon: 'shield', color: '#db2777',
    history: buildHistory(37, { rate: 0.55, skipEvery: 11 })
  },
  {
    ...base, id: 'Uống thuốc', title: 'Uống thuốc', description: 'Vitamin D sau bữa tối.', category: 'Health',
    period: 'anytime', frequency: 'daily', target: 1, unit: 'viên', icon: 'pill', color: '#2563eb',
    history: buildHistory(53, { rate: 0.78, skipEvery: 13 })
  },
  {
    ...base, id: 'Xít tóc', title: 'Xít tóc', category: 'Self care',
    period: 'anytime', frequency: 'daily', target: 1, unit: 'lần', icon: 'wind', color: '#d97706',
    history: { ...buildHistory(71, { rate: 0.65 }), [shift(0)]: { value: 1 } }
  },
  {
    ...base, id: 'Đọc sách', title: 'Đọc sách', category: 'Learning', archived: true,
    period: 'evening', frequency: 'daily', target: 10, unit: 'trang', icon: 'book-open', color: '#0891b2',
    history: buildHistory(89, { rate: 0.5 })
  },
  {
    ...base, id: 'Chạy bộ', title: 'Chạy bộ', category: 'Fitness', endDate: shift(-12),
    period: 'morning', frequency: 'weekdays', days: [1, 2, 3, 4, 5], target: 1, unit: 'buổi', icon: 'footprints', color: '#dc2626',
    history: buildHistory(97, { rate: 0.62 })
  }
];

const app = {
  vault: { adapter: { exists: async () => true }, getMarkdownFiles: () => [], getAbstractFileByPath: () => null, on: () => ({}) },
  metadataCache: { getFileCache: () => ({}), on: () => ({}) },
  workspace: { getLeavesOfType: () => [], getLeaf: () => ({}), revealLeaf: () => {} },
  fileManager: {}
};

const plugin = new PDLHabitPlugin(app, { id: 'pdl-habit', version: '1.4.0' });
plugin.settings = { rootFolder: '03 - Area/Habits', weekStartsOn: 1, defaultView: 'today' };

const LIGHT = {
  '--background-primary': '#ffffff',
  '--background-secondary': '#f5f6f7',
  '--background-modifier-border': '#e6e8eb',
  '--text-normal': '#1f2937',
  '--text-muted': '#6b7280',
  '--text-faint': '#9ca3af'
};

const DARK = {
  '--background-primary': '#1e1e22',
  '--background-secondary': '#26262b',
  '--background-modifier-border': '#35353c',
  '--text-normal': '#e6e6ea',
  '--text-muted': '#a0a0ab',
  '--text-faint': '#7a7a86'
};

const css = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');

function buildPage({ mode, theme = 'light', file, habitList = habits, scope = 'active', emptyMonth = false, sort = 'title', query = '', category = 'all', toastMessage = '', lang = 'en' }) {
  setLanguage(lang);
  const vars = theme === 'dark' ? DARK : LIGHT;
  const leaf = { app, containerEl: new El('div', { cls: 'workspace-leaf-content' }) };
  leaf.containerEl.setAttribute('data-type', 'pdlh-habit-dashboard');
  leaf.containerEl.createDiv({ cls: 'view-header' });
  leaf.containerEl.createDiv({ cls: 'view-content' });

  const view = new PDLHabitView(leaf, plugin);
  view.mode = mode;
  view.habits = habitList;
  view.habitScope = scope;
  view.habitSort = sort;
  view.habitQuery = query;
  view.habitCategory = category;
  view.selectedDate = iso(today);
  view.calendarDate = emptyMonth ? new Date(today.getFullYear(), today.getMonth() + 2, 1) : new Date(today);
  view.render();
  if (toastMessage) toast({ message: toastMessage, actionLabel: 'Undo', onAction: () => {}, timeout: 0 });

  const page = `<!doctype html>
<html lang="en" class="theme-${theme}">
<head>
<meta charset="utf-8">
<title>PDL Habit — ${mode} (${theme})</title>
<style>
  :root {
    ${Object.entries(vars).map(([name, value]) => `${name}: ${value};`).join('\n    ')}
    --background-primary-alt: var(--background-primary);
    --background-modifier-hover: rgba(127, 127, 127, .12);
    --font-interface: -apple-system, "Segoe UI", Inter, Roboto, "Helvetica Neue", Arial, sans-serif;
    --pdlh-amber: #d97706;
    --pdlh-amber-soft: rgba(217, 119, 6, .12);
    --pdlh-green: #059669;
    color-scheme: ${theme};
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    background: var(--background-primary);
    color: var(--text-normal);
    font-family: var(--font-interface);
    -webkit-font-smoothing: antialiased;
  }
  .workspace-leaf-content { display: flex; flex-direction: column; min-height: 100vh; }
  .view-header { display: none; }
  .view-content { flex: 1; display: flex; flex-direction: column; }
  svg.svg-icon { width: 18px; height: 18px; flex: none; }
  button { font-family: inherit; }
  /* Screenshots are taken instantly; skip the entrance animation so the toast is fully opaque. */
  .pdlh-toast { animation: none !important; }
${css}
</style>
</head>
<body>
${leaf.containerEl.toHtml('')}
${document.body.children.map((child) => child.toHtml('')).join('\n')}
</body>
</html>
`;

  fs.writeFileSync(path.join(ROOT, 'preview', file), page);
  console.log(`[preview] preview/${file} (${(page.length / 1024).toFixed(1)} KB)`);
  if (document.body.children.length) document.body.empty();
}

const active = habits.filter((habit) => !habit.archived && !(habit.endDate && habit.endDate < iso(today)));

buildPage({ mode: 'today', file: 'today.html' });
buildPage({ mode: 'today', theme: 'dark', file: 'today-dark.html' });
buildPage({ mode: 'today', file: 'today-empty.html', habitList: [] });
buildPage({ mode: 'today', file: 'today-undo.html', toastMessage: 'Chườm đá checked in' });
buildPage({
  mode: 'today',
  file: 'today-complete.html',
  habitList: active.map((habit) => ({ ...habit, history: { ...habit.history, [shift(0)]: { value: habit.frequency === 'weekly' ? 1 : habit.target } } }))
});

buildPage({ mode: 'habits', file: 'habits.html' });
buildPage({ mode: 'habits', theme: 'dark', file: 'habits-dark.html' });
buildPage({ mode: 'habits', file: 'habits-archived.html', scope: 'archived' });
buildPage({ mode: 'habits', file: 'habits-empty.html', habitList: [] });
buildPage({ mode: 'habits', file: 'habits-filtered.html', query: 'uống' });
buildPage({ mode: 'habits', file: 'habits-grouped.html', sort: 'category' });
buildPage({ mode: 'habits', file: 'habits-sorted.html', sort: 'streak' });
buildPage({ mode: 'habits', file: 'habits-reminder.html', toastMessage: '3 habits left today. Still time for a small win.' });

buildPage({ mode: 'calendar', file: 'calendar.html' });
buildPage({ mode: 'calendar', theme: 'dark', file: 'calendar-dark.html' });

buildPage({ mode: 'insights', file: 'insights.html' });
buildPage({ mode: 'insights', theme: 'dark', file: 'insights-dark.html' });
buildPage({ mode: 'insights', file: 'insights-empty.html', habitList: [] });

/* ------------------------------------------------------------ habit form */

function buildHabitFormPage({ file, theme = 'light', patch = {}, moreOpen = false, habit = null, lang = 'en' }) {
  setLanguage(lang);
  const vars = theme === 'dark' ? DARK : LIGHT;
  const modal = new HabitModal(app, plugin, habit);
  Object.assign(modal.draft, patch);
  if (moreOpen) modal.moreOpen = true;
  modal.onOpen();

  const page = `<!doctype html>
<html lang="en" class="theme-${theme}">
<head>
<meta charset="utf-8">
<title>PDL Habit — habit form (${theme})</title>
<style>
  :root {
    ${Object.entries(vars).map(([name, value]) => `${name}: ${value};`).join('\n    ')}
    --background-primary-alt: var(--background-primary);
    --background-modifier-hover: rgba(127, 127, 127, .12);
    --font-interface: -apple-system, "Segoe UI", Inter, Roboto, "Helvetica Neue", Arial, sans-serif;
    --text-faint: #9ca3af;
    color-scheme: ${theme};
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    background: var(--background-secondary, #f5f6f7);
    color: var(--text-normal);
    font-family: var(--font-interface);
    -webkit-font-smoothing: antialiased;
  }
  .preview-backdrop {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: rgba(15, 23, 42, ${theme === 'dark' ? '.55' : '.35'});
  }
  .preview-modal {
    width: min(560px, 100%);
    max-height: calc(100vh - 40px);
    overflow: auto;
    padding: 20px;
    border-radius: 12px;
    background: var(--background-primary);
    box-shadow: 0 24px 60px rgba(0, 0, 0, ${theme === 'dark' ? '.55' : '.28'});
  }
  svg.svg-icon { width: 18px; height: 18px; flex: none; }
  button { font-family: inherit; }
  /* Emulate the theme's date field: a calendar icon painted at the start. */
  input[type="date"] {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M8 2v4M16 2v4'/%3E%3Crect width='18' height='18' x='3' y='4' rx='2'/%3E%3Cpath d='M3 10h18'/%3E%3C/svg%3E");
    background-position: 5px center;
    background-repeat: no-repeat;
    background-size: 15px;
    padding-inline-start: 26px;
  }
${css}
</style>
</head>
<body>
<div class="preview-backdrop">
  <div class="preview-modal">
${modal.contentEl.toHtml('')}
  </div>
</div>
</body>
</html>
`;

  fs.writeFileSync(path.join(ROOT, 'preview', file), page);
  console.log(`[preview] preview/${file} (${(page.length / 1024).toFixed(1)} KB)`);
}

buildHabitFormPage({ file: 'habit-new.html' });
buildHabitFormPage({ file: 'habit-new-dark.html', theme: 'dark' });
buildHabitFormPage({
  file: 'habit-count.html',
  patch: { name: 'Uống nước', tracking: 'count', target: 3, unit: 'ly', period: 'afternoon' }
});
buildHabitFormPage({
  file: 'habit-week.html',
  patch: { name: 'Tập thể dục', schedule: 'week', perWeek: 3, period: 'evening', icon: 'dumbbell', color: '#7c3aed' }
});
buildHabitFormPage({
  file: 'habit-advanced.html',
  moreOpen: true,
  patch: {
    name: 'Đọc sách',
    tracking: 'count',
    target: 20,
    unit: 'trang',
    schedule: 'days',
    days: [1, 3, 5],
    period: 'evening',
    icon: 'book-open',
    color: '#0891b2',
    description: 'Đọc trước khi ngủ.',
    category: 'Learning',
    cue: 'Sau khi đánh răng',
    reward: 'Một chương truyện'
  }
});
buildHabitFormPage({
  file: 'habit-edit.html',
  habit: { ...habits[1], title: 'Uống nước' }
});

/* ---------------------------------------------------------- habit detail */

function monthHistory({ target }) {
  const history = {};
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = `${year}-${pad(month + 1)}-${pad(day)}`;
    if (key > iso(today)) continue;
    const slot = day % 7;
    if (slot === 1) { /* missed on purpose */ }
    else if (slot === 2) history[key] = { value: 1 };
    else if (slot === 3) history[key] = { value: 0, status: 'skip' };
    else if (slot === 4) history[key] = { value: Math.max(1, target - 1) };
    else history[key] = { value: target };
  }
  return history;
}

function buildDetailPage({ file, habit, theme = 'light', monthOffset = 0, lang = 'en' }) {
  setLanguage(lang);
  const vars = theme === 'dark' ? DARK : LIGHT;
  const modal = new HabitDetailModal(app, plugin, habit);
  if (monthOffset) modal.monthDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  modal.onOpen();

  const page = `<!doctype html>
<html lang="en" class="theme-${theme}">
<head>
<meta charset="utf-8">
<title>PDL Habit — habit detail (${theme})</title>
<style>
  :root {
    ${Object.entries(vars).map(([name, value]) => `${name}: ${value};`).join('\n    ')}
    --background-primary-alt: var(--background-primary);
    --background-modifier-hover: rgba(127, 127, 127, .12);
    --font-interface: -apple-system, "Segoe UI", Inter, Roboto, "Helvetica Neue", Arial, sans-serif;
    --text-faint: #9ca3af;
    color-scheme: ${theme};
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    background: var(--background-secondary, #f5f6f7);
    color: var(--text-normal);
    font-family: var(--font-interface);
    -webkit-font-smoothing: antialiased;
  }
  .preview-backdrop {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: rgba(15, 23, 42, ${theme === 'dark' ? '.55' : '.35'});
  }
  .preview-modal {
    width: min(720px, 100%);
    max-height: calc(100vh - 40px);
    overflow: auto;
    padding: 20px;
    border-radius: 12px;
    background: var(--background-primary);
    box-shadow: 0 24px 60px rgba(0, 0, 0, ${theme === 'dark' ? '.55' : '.28'});
  }
  svg.svg-icon { width: 18px; height: 18px; flex: none; }
  button { font-family: inherit; }
${css}
</style>
</head>
<body>
<div class="preview-backdrop">
  <div class="preview-modal">
${modal.contentEl.toHtml('')}
  </div>
</div>
</body>
</html>
`;

  fs.writeFileSync(path.join(ROOT, 'preview', file), page);
  console.log(`[preview] preview/${file} (${(page.length / 1024).toFixed(1)} KB)`);
}

const waterHabit = {
  ...habits[1],
  title: 'Uống nước',
  target: 3,
  unit: 'ly',
  period: 'afternoon',
  history: monthHistory({ target: 3 })
};

buildDetailPage({ file: 'detail.html', habit: waterHabit });
buildDetailPage({ file: 'detail-dark.html', habit: waterHabit, theme: 'dark' });
buildDetailPage({ file: 'detail-prev.html', habit: waterHabit, monthOffset: -1 });

/* ----------------------------------------------------------- check-in sheet */

function buildCheckinPage({ file, habit, theme = 'light' }) {
  const vars = theme === 'dark' ? DARK : LIGHT;
  const modal = new CheckinModal(app, plugin, habit, iso(today));
  modal.onOpen();

  const page = `<!doctype html>
<html lang="en" class="theme-${theme}">
<head>
<meta charset="utf-8">
<title>PDL Habit — check-in (${theme})</title>
<style>
  :root {
    ${Object.entries(vars).map(([name, value]) => `${name}: ${value};`).join('\n    ')}
    --background-primary-alt: var(--background-primary);
    --background-modifier-hover: rgba(127, 127, 127, .12);
    --font-interface: -apple-system, "Segoe UI", Inter, Roboto, "Helvetica Neue", Arial, sans-serif;
    --text-faint: #9ca3af;
    color-scheme: ${theme};
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    background: var(--background-secondary, #f5f6f7);
    color: var(--text-normal);
    font-family: var(--font-interface);
    -webkit-font-smoothing: antialiased;
  }
  .preview-backdrop {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: rgba(15, 23, 42, ${theme === 'dark' ? '.55' : '.35'});
  }
  .preview-modal {
    width: min(440px, 100%);
    max-height: calc(100vh - 40px);
    overflow: auto;
    padding: 20px;
    border-radius: 12px;
    background: var(--background-primary);
    box-shadow: 0 24px 60px rgba(0, 0, 0, ${theme === 'dark' ? '.55' : '.28'});
  }
  svg.svg-icon { width: 18px; height: 18px; flex: none; }
  button { font-family: inherit; }
${css}
</style>
</head>
<body>
<div class="preview-backdrop">
  <div class="preview-modal">
${modal.contentEl.toHtml('')}
  </div>
</div>
</body>
</html>
`;

  fs.writeFileSync(path.join(ROOT, 'preview', file), page);
  console.log(`[preview] preview/${file} (${(page.length / 1024).toFixed(1)} KB)`);
}

const waterToday = { ...habits[1], title: 'Uống nước', target: 3, unit: 'ly', history: {} };
const sweetsLimit = {
  ...habits[1], id: 'Sweets', title: 'Đồ ngọt', target: 2, unit: 'cái', direction: 'quit', icon: 'cookie', color: '#db2777', history: {}
};

buildCheckinPage({ file: 'checkin-count.html', habit: waterToday });
buildCheckinPage({ file: 'checkin-count-dark.html', habit: waterToday, theme: 'dark' });
buildCheckinPage({ file: 'checkin-limit.html', habit: sweetsLimit });
buildCheckinPage({ file: 'checkin-binary.html', habit: { ...habits[0], history: {} } });
buildCheckinPage({ file: 'checkin-existing.html', habit: waterHabit });

/* ----------------------------------------------------------- icon picker */

function buildIconPickerPage({ file, theme = 'light' }) {
  const vars = theme === 'dark' ? DARK : LIGHT;
  const modal = new HabitIconModal(app, 'sprout', '#0891b2', () => {});
  modal.onOpen();

  const page = `<!doctype html>
<html lang="en" class="theme-${theme}">
<head>
<meta charset="utf-8">
<title>PDL Habit — icon picker (${theme})</title>
<style>
  :root {
    ${Object.entries(vars).map(([name, value]) => `${name}: ${value};`).join('\n    ')}
    --background-primary-alt: var(--background-primary);
    --background-modifier-hover: rgba(127, 127, 127, .12);
    --font-interface: -apple-system, "Segoe UI", Inter, Roboto, "Helvetica Neue", Arial, sans-serif;
    --text-faint: #9ca3af;
    color-scheme: ${theme};
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    background: var(--background-secondary, #f5f6f7);
    color: var(--text-normal);
    font-family: var(--font-interface);
    -webkit-font-smoothing: antialiased;
  }
  .preview-backdrop {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: rgba(15, 23, 42, ${theme === 'dark' ? '.55' : '.35'});
  }
  .preview-modal {
    width: min(680px, 100%);
    max-height: calc(100vh - 40px);
    overflow: auto;
    padding: 20px;
    border-radius: 12px;
    background: var(--background-primary);
    box-shadow: 0 24px 60px rgba(0, 0, 0, ${theme === 'dark' ? '.55' : '.28'});
  }
  svg.svg-icon { width: 18px; height: 18px; flex: none; }
  button { font-family: inherit; }
${css}
</style>
</head>
<body>
<div class="preview-backdrop">
  <div class="preview-modal">
${modal.contentEl.toHtml('')}
  </div>
</div>
</body>
</html>
`;

  fs.writeFileSync(path.join(ROOT, 'preview', file), page);
  console.log(`[preview] preview/${file} (${(page.length / 1024).toFixed(1)} KB)`);
}

buildPage({ mode: 'today', file: 'today-vi.html', lang: 'vi' });
buildPage({ mode: 'habits', file: 'habits-vi.html', lang: 'vi' });
buildPage({ mode: 'calendar', file: 'calendar-vi.html', lang: 'vi' });
buildPage({ mode: 'insights', file: 'insights-vi.html', lang: 'vi' });
buildHabitFormPage({ file: 'habit-new-vi.html', lang: 'vi' });
buildHabitFormPage({ file: 'habit-month-vi.html', lang: 'vi', patch: { name: 'Đọc sách', tracking: 'check', schedule: 'month', perMonth: 4, period: 'evening', icon: 'book-open', color: '#0891b2' } });
buildDetailPage({ file: 'detail-vi.html', habit: waterHabit, lang: 'vi' });

buildIconPickerPage({ file: 'icons.html' });
buildIconPickerPage({ file: 'icons-dark.html', theme: 'dark' });
