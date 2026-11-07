/**
 * Loads the *built* bundle (dist/main.js) with a stubbed Obsidian API, feeds it a
 * fake vault and renders every tab — a last check that the shipped artifact works,
 * not just the source modules.
 *
 * Usage: node scripts/verify-bundle.mjs
 */
import esbuild from 'esbuild';
import assert from 'node:assert/strict';
import path from 'node:path';
import { El, installDom } from '../preview/dom-shim.mjs';

const ROOT = path.resolve('.');
const OUT = path.join(ROOT, 'preview/.build/bundle-check.mjs');
const VIEW_TYPE = 'pdlh-habit-dashboard';

await esbuild.build({
  entryPoints: [path.join(ROOT, 'dist/main.js')],
  outfile: OUT,
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node20',
  logLevel: 'warning',
  alias: { obsidian: path.join(ROOT, 'preview/obsidian-stub.mjs') }
});

const { default: PDLHabitPlugin } = await import(`file://${OUT.replace(/\\/g, '/')}?t=${Date.now()}`);
assert.equal(typeof PDLHabitPlugin, 'function', 'bundle must export the plugin class');

installDom();

function todayKey() {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const notes = [
  { path: '03 - Area/Habits/Walk 20 minutes.md', frontmatter: { type: 'habit', title: 'Walk 20 minutes', period: 'morning', frequency: 'daily', target: 1, unit: 'lần', icon: 'snowflake', color: '#059669', history: { [todayKey()]: { value: 1 } } } },
  { path: '03 - Area/Habits/Drink water.md', frontmatter: { type: 'habit', title: 'Drink water', period: 'afternoon', frequency: 'daily', target: 3, unit: 'ly', icon: 'glass-water', color: '#0891b2', history: {} } },
  { path: '03 - Area/Habits/No sugar.md', frontmatter: { type: 'habit', title: 'No sugar', period: 'anytime', frequency: 'weekly', target: 3, unit: 'lần', icon: 'shield', color: '#db2777', history: {} } }
];

const files = notes.map((note) => ({ path: note.path, basename: path.basename(note.path, '.md') }));
const app = {
  vault: {
    adapter: { exists: async () => true },
    getMarkdownFiles: () => files,
    getAbstractFileByPath: () => null,
    on: () => ({})
  },
  metadataCache: {
    getFileCache: (file) => ({ frontmatter: notes.find((note) => note.path === file.path)?.frontmatter }),
    on: () => ({})
  },
  workspace: { getLeavesOfType: () => [], getLeaf: () => ({}), revealLeaf: () => {} },
  fileManager: { processFrontMatter: async () => {}, renameFile: async () => {}, trashFile: async () => {} }
};

const plugin = new PDLHabitPlugin(app, { id: 'pdl-habit', version: '1.9.0' });
await plugin.onload();

const factory = plugin.views.get(VIEW_TYPE);
if (typeof factory !== 'function') {
  const registered = [...plugin.views.entries()].map(([key, value]) => `${key}=${typeof value}`);
  assert.fail(`dashboard view not registered (views: ${registered.join(', ') || 'empty'})`);
}
assert.ok(plugin.commands.length >= 3, 'plugin must register its commands');

const habitCount = (await plugin.scanHabits()).length;
assert.equal(habitCount, 3, 'scanHabits must read the markdown frontmatter');
const scanned = await plugin.scanHabits();

const EXPECTED = {
  today: ['Walk 20 minutes', 'Drink water', 'No sugar', 'pdlh-hero-ring', 'pdlh-week', 'pdlh-group-head', 'Next up', 'pdlh-row-check'],
  habits: ['All habits', 'pdlh-list', 'pdlh-day-cell', 'pdlh-list-streak', 'Active', 'Archived', 'pdlh-toolbar', 'pdlh-search', 'pdlh-select'],
  calendar: ['pdlh-cal', 'pdlh-cal-grid', 'pdlh-cal-day', 'pdlh-cal-foot', 'pdlh-page-head'],
  insights: ['Last 30 days', 'pdlh-stats', 'pdlh-bar-row', 'pdlh-bar-fill']
};

function mount(mode) {
  const containerEl = new El('div', { cls: 'view-container' });
  containerEl.createDiv({ cls: 'view-header' });
  containerEl.createDiv({ cls: 'view-content' });
  const view = factory({ app, containerEl });
  view.mode = mode;
  view.habits = scanned;
  return { view, containerEl };
}

const rendered = {};
const views = {};
for (const mode of Object.keys(EXPECTED)) {
  const { view, containerEl } = mount(mode);
  view.render();
  views[mode] = { view, containerEl };
  const html = containerEl.toHtml('');
  rendered[mode] = html;
  for (const expected of EXPECTED[mode]) {
    assert.equal(html.includes(expected), true, `${mode} view should contain ${expected}`);
  }
  for (const removed of ['pdlh-today-grid', 'pdlh-summary', 'pdlh-habit-row', 'pdlh-habits-table', 'pdlh-kpi', 'pdlh-archive-row']) {
    assert.equal(html.includes(removed), false, `${mode} view must not render legacy markup ${removed}`);
  }
}

// Search re-renders only the list body, so the input keeps its focus and value.
const habitsScreen = views.habits;
habitsScreen.view.habitQuery = 'Fap';
habitsScreen.view.renderHabitResults();
const searched = habitsScreen.containerEl.toHtml('');
assert.equal(searched.includes('No sugar'), true, 'search keeps the matching habit');
assert.equal(searched.includes('Walk 20 minutes'), false, 'search hides non-matching habits');
assert.equal(searched.includes('1/3'), true, 'the block head reports the filtered count');

// Sorting by category groups the rows under category headers.
habitsScreen.view.habitQuery = '';
habitsScreen.view.habitSort = 'category';
habitsScreen.view.renderHabitResults();
assert.equal(habitsScreen.containerEl.toHtml('').includes('pdlh-list-group'), true, 'category sorting renders group headers');
habitsScreen.view.habitSort = 'title';

// Archive is a scope inside Habits, not a destination.
assert.equal(rendered.today.includes('>Archive<'), false, 'the tab bar must not offer an Archive tab');
const tabMarkup = rendered.today.match(/pdlh-tabs[\s\S]*?<\/div>/)?.[0] || '';
assert.equal((tabMarkup.match(/<button/g) || []).length, 4, 'four tabs remain');

const archivedEl = new El('div', { cls: 'view-container' });
archivedEl.createDiv({ cls: 'view-header' });
archivedEl.createDiv({ cls: 'view-content' });
const archivedView = factory({ app, containerEl: archivedEl });
archivedView.mode = 'habits';
archivedView.habitScope = 'archived';
archivedView.habits = scanned;
archivedView.render();
assert.equal(archivedEl.toHtml('').includes('Nothing archived yet'), true, 'archived scope renders its empty state');

console.log(`[verify-bundle] OK — ${habitCount} habits, ${Object.entries(rendered).map(([mode, html]) => `${mode} ${(html.length / 1024).toFixed(1)} KB`).join(', ')}`);
