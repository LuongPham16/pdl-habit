/**
 * Loads the *built* bundle (dist/main.js) with a stubbed Obsidian API, feeds it a
 * fake vault and renders the Today view — a last check that the shipped artifact
 * works, not just the source modules.
 *
 * Usage: node scripts/verify-bundle.mjs
 */
import esbuild from 'esbuild';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { El, installDom } from '../preview/dom-shim.mjs';

const ROOT = path.resolve('.');
const OUT = path.join(ROOT, 'preview/.build/bundle-check.mjs');

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

const notes = [
  { path: '03 - Area/Habits/Chườm đá.md', frontmatter: { type: 'habit', title: 'Chườm đá', period: 'morning', frequency: 'daily', target: 1, unit: 'lần', icon: 'snowflake', color: '#059669', history: { [todayKey()]: { value: 1 } } } },
  { path: '03 - Area/Habits/Uống nước.md', frontmatter: { type: 'habit', title: 'Uống nước', period: 'afternoon', frequency: 'daily', target: 3, unit: 'ly', icon: 'glass-water', color: '#0891b2', history: {} } },
  { path: '03 - Area/Habits/No Fap.md', frontmatter: { type: 'habit', title: 'No Fap', period: 'anytime', frequency: 'weekly', target: 3, unit: 'lần', icon: 'shield', color: '#db2777', history: {} } }
];

function todayKey() {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const files = notes.map((note) => ({ path: note.path, basename: path.basename(note.path, '.md') }));
const app = {
  vault: {
    adapter: { exists: async () => true },
    getMarkdownFiles: () => files,
    getAbstractFileByPath: () => null,
    on: () => ({})
  },
  metadataCache: { getFileCache: (file) => ({ frontmatter: notes.find((note) => note.path === file.path)?.frontmatter }), on: () => ({}) },
  workspace: { getLeavesOfType: () => [], getLeaf: () => ({}), revealLeaf: () => {} },
  fileManager: { processFrontMatter: async () => {}, renameFile: async () => {}, trashFile: async () => {} }
};

const plugin = new PDLHabitPlugin(app, { id: 'pdl-habit', version: '1.3.0' });
await plugin.onload();

const factory = plugin.views.get('pdl-habit-dashboard');
assert.equal(typeof factory, 'function', 'plugin must register the dashboard view');
assert.equal(plugin.commands.length >= 3, true, 'plugin must register its commands');

const habitCount = (await plugin.scanHabits()).length;
assert.equal(habitCount, 3, 'scanHabits must read the markdown frontmatter');

const containerEl = new El('div', { cls: 'view-container' });
containerEl.createDiv({ cls: 'view-header' });
containerEl.createDiv({ cls: 'view-content' });
const view = factory({ app, containerEl });
view.habits = await plugin.scanHabits();
view.render();

const html = containerEl.toHtml('');
for (const expected of ['Chườm đá', 'Uống nước', 'No Fap', 'pdlh-hero-ring', 'pdlh-week', 'pdlh-group-head', 'Next up', 'pdlh-row-check']) {
  assert.equal(html.includes(expected), true, `rendered Today should contain ${expected}`);
}
for (const removed of ['pdlh-today-grid', 'pdlh-summary', 'pdlh-habit-row']) {
  assert.equal(html.includes(removed), false, `legacy Today markup ${removed} must be gone`);
}

console.log(`[verify-bundle] OK — ${habitCount} habits, ${(html.length / 1024).toFixed(1)} KB of rendered Today markup`);
