/**
 * Renders the real PDL Habit views with mock data and writes standalone HTML pages
 * (every tab, light/dark/narrow) so the design can be reviewed without Obsidian.
 */
import fs from 'node:fs';
import path from 'node:path';
import { installDom, El } from './dom-shim.mjs';
import { PDLHabitView } from '../src/view.js';
import { PDLHabitPlugin } from '../src/plugin.js';

installDom();

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

function buildPage({ mode, theme = 'light', file, habitList = habits, scope = 'active', emptyMonth = false }) {
  const vars = theme === 'dark' ? DARK : LIGHT;
  const leaf = { app, containerEl: new El('div', { cls: 'workspace-leaf-content' }) };
  leaf.containerEl.setAttribute('data-type', 'pdlh-habit-dashboard');
  leaf.containerEl.createDiv({ cls: 'view-header' });
  leaf.containerEl.createDiv({ cls: 'view-content' });

  const view = new PDLHabitView(leaf, plugin);
  view.mode = mode;
  view.habits = habitList;
  view.habitScope = scope;
  view.selectedDate = iso(today);
  view.calendarDate = emptyMonth ? new Date(today.getFullYear(), today.getMonth() + 2, 1) : new Date(today);
  view.render();

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
${css}
</style>
</head>
<body>
${leaf.containerEl.toHtml('')}
</body>
</html>
`;

  fs.writeFileSync(path.join(ROOT, 'preview', file), page);
  console.log(`[preview] preview/${file} (${(page.length / 1024).toFixed(1)} KB)`);
}

const active = habits.filter((habit) => !habit.archived && !(habit.endDate && habit.endDate < iso(today)));

buildPage({ mode: 'today', file: 'today.html' });
buildPage({ mode: 'today', theme: 'dark', file: 'today-dark.html' });
buildPage({ mode: 'today', file: 'today-empty.html', habitList: [] });
buildPage({
  mode: 'today',
  file: 'today-complete.html',
  habitList: active.map((habit) => ({ ...habit, history: { ...habit.history, [shift(0)]: { value: habit.frequency === 'weekly' ? 1 : habit.target } } }))
});

buildPage({ mode: 'habits', file: 'habits.html' });
buildPage({ mode: 'habits', theme: 'dark', file: 'habits-dark.html' });
buildPage({ mode: 'habits', file: 'habits-archived.html', scope: 'archived' });
buildPage({ mode: 'habits', file: 'habits-empty.html', habitList: [] });

buildPage({ mode: 'calendar', file: 'calendar.html' });
buildPage({ mode: 'calendar', theme: 'dark', file: 'calendar-dark.html' });

buildPage({ mode: 'insights', file: 'insights.html' });
buildPage({ mode: 'insights', theme: 'dark', file: 'insights-dark.html' });
buildPage({ mode: 'insights', file: 'insights-empty.html', habitList: [] });
