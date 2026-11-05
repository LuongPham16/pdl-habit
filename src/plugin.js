import { Plugin, Notice, normalizePath } from 'obsidian';
import { DEFAULT_SETTINGS, VIEW_TYPE, VIEW_IDS, PERIODS, COLORS, WEEKDAYS } from './constants.js';
import { isoDate, addDays, parseDate, startOfWeek, safeName, esc } from './dates.js';
import { completion, entryValue, isScheduled, normalizeHistory, scheduledKeys, streakFor } from './habits.js';
import { PDLHabitView } from './view.js';
import { PDLHabitSettingTab } from './settings.js';
import { HabitModal } from './modals/habit.js';
import { HabitModalPicker } from './modals/picker.js';

export class PDLHabitPlugin extends Plugin {
  async onload() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    // Archive is a scope inside Habits now; older settings may still point at it.
    if (!VIEW_IDS.includes(this.settings.defaultView)) this.settings.defaultView = 'today';
    await this.ensureRoot();
    this.registerView(VIEW_TYPE, (leaf) => new PDLHabitView(leaf, this));
    this.addSettingTab(new PDLHabitSettingTab(this.app, this));
    this.addRibbonIcon('sprout', 'Open PDL Habit', () => this.activateView());
    this.addCommand({ id: 'open-dashboard', name: 'Open habit dashboard', callback: () => this.activateView() });
    this.addCommand({ id: 'create-habit', name: 'Create habit', callback: () => new HabitModal(this.app, this).open() });
    this.addCommand({
      id: 'check-in-habit',
      name: 'Check in a habit',
      callback: async () => {
        const habits = (await this.scanHabits()).filter((habit) => isScheduled(habit, isoDate()) && !habit.archived);
        if (!habits.length) return new Notice('No habits are scheduled today.');
        new HabitModalPicker(this.app, this, habits).open();
      }
    });
    const refresh = (file, oldPath = '') => { if (this.isHabitPath(file?.path) || this.isHabitPath(oldPath)) this.scheduleRefresh(); };
    this.registerEvent(this.app.metadataCache.on('changed', refresh));
    this.registerEvent(this.app.vault.on('create', refresh));
    this.registerEvent(this.app.vault.on('delete', refresh));
    this.registerEvent(this.app.vault.on('rename', refresh));
  }

  onunload() { if (this.refreshTimer) clearTimeout(this.refreshTimer); }

  async saveSettings() { await this.saveData(this.settings); }

  async ensureRoot() {
    const path = normalizePath(this.settings.rootFolder);
    if (path && !(await this.app.vault.adapter.exists(path))) await this.app.vault.createFolder(path);
  }

  isHabitPath(path) { return Boolean(path && normalizePath(path).startsWith(`${normalizePath(this.settings.rootFolder)}/`)); }

  scheduleRefresh() {
    clearTimeout(this.refreshTimer);
    this.refreshTimer = setTimeout(() => this.refreshViews(), 180);
  }

  async refreshViews() {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE)) await leaf.view.refresh();
  }

  async activateView() {
    let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (!leaf) {
      leaf = this.app.workspace.getLeaf('tab');
      await leaf.setViewState({ type: VIEW_TYPE, active: true });
    }
    this.app.workspace.revealLeaf(leaf);
  }

  scheduleLabel(habit) {
    if (habit.frequency === 'daily') return 'Every day';
    if (habit.frequency === 'weekly') return `${habit.target} / week`;
    return habit.days.map((day) => WEEKDAYS[day]).join(', ');
  }

  async scanHabits() {
    const prefix = `${normalizePath(this.settings.rootFolder)}/`;
    const habits = [];
    for (const file of this.app.vault.getMarkdownFiles()) {
      if (!file.path.startsWith(prefix)) continue;
      const fm = this.app.metadataCache.getFileCache(file)?.frontmatter || {};
      if (String(fm.type || '').toLowerCase() !== 'habit') continue;
      habits.push({
        id: file.path,
        file,
        title: String(fm.title || file.basename),
        description: String(fm.description || ''),
        category: String(fm.category || 'Personal'),
        period: PERIODS[fm.period] ? fm.period : 'anytime',
        direction: fm.direction === 'quit' ? 'quit' : 'build',
        frequency: ['daily', 'weekdays', 'weekly'].includes(fm.frequency) ? fm.frequency : 'daily',
        days: Array.isArray(fm.days) ? fm.days.map(Number) : [1, 2, 3, 4, 5],
        target: Math.max(1, Number(fm.target) || 1),
        unit: String(fm.unit || 'time'),
        icon: String(fm.icon || 'sprout'),
        color: String(fm.color || COLORS[0]),
        startDate: String(fm.start_date || isoDate()),
        endDate: String(fm.end_date || ''),
        cue: String(fm.cue || ''),
        reward: String(fm.reward || ''),
        archived: Boolean(fm.archived),
        history: normalizeHistory(fm.history)
      });
    }
    return habits.sort((a, b) => a.period.localeCompare(b.period) || a.title.localeCompare(b.title));
  }

  statsFor(habit, days = 30) {
    const keys = scheduledKeys(habit, addDays(isoDate(), -days + 1), isoDate());
    if (habit.frequency !== 'weekly') {
      const done = keys.filter((key) => completion(habit, key).done).length;
      return { due: keys.length, done, rate: keys.length ? Math.round(done / keys.length * 100) : 0, streak: streakFor(habit) };
    }
    const weeks = new Map();
    keys.forEach((key) => {
      const week = isoDate(startOfWeek(parseDate(key), this.settings.weekStartsOn));
      weeks.set(week, (weeks.get(week) || 0) + (entryValue(habit.history[key]) > 0 ? 1 : 0));
    });
    const done = [...weeks.values()].filter((value) => value >= habit.target).length;
    return { due: weeks.size, done, rate: weeks.size ? Math.round(done / weeks.size * 100) : 0, streak: streakFor(habit) };
  }

  async saveHabit(value, existing = null) {
    await this.ensureRoot();
    const name = safeName(value.title);
    let file = existing?.file;
    let path = normalizePath(`${this.settings.rootFolder}/${name}.md`);
    if (!file) {
      let n = 2;
      while (this.app.vault.getAbstractFileByPath(path)) path = normalizePath(`${this.settings.rootFolder}/${name} ${n++}.md`);
      const body = [
        '---',
        'type: habit',
        `title: "${esc(value.title)}"`,
        `description: "${esc(value.description)}"`,
        `category: "${esc(value.category)}"`,
        `period: ${value.period}`,
        `direction: ${value.direction}`,
        `frequency: ${value.frequency}`,
        `days: [${value.days.join(', ')}]`,
        `target: ${Math.max(1, Number(value.target) || 1)}`,
        `unit: "${esc(value.unit)}"`,
        `icon: "${value.icon || 'sprout'}"`,
        `color: "${value.color}"`,
        `start_date: ${value.startDate}`,
        `end_date: ${value.endDate || ''}`,
        `cue: "${esc(value.cue)}"`,
        `reward: "${esc(value.reward)}"`,
        'archived: false',
        'history: {}',
        'llm_managed: true',
        '---',
        '',
        `# ${value.title}`,
        '',
        value.description || '',
        '',
        '## Reflection',
        ''
      ].join('\n');
      file = await this.app.vault.create(path, `${body}\n`);
    } else {
      const target = normalizePath(`${this.settings.rootFolder}/${name}.md`);
      if (target !== file.path && !this.app.vault.getAbstractFileByPath(target)) await this.app.fileManager.renameFile(file, target);
      await this.app.fileManager.processFrontMatter(file, (fm) => Object.assign(fm, {
        title: value.title,
        description: value.description,
        category: value.category,
        period: value.period,
        direction: value.direction,
        frequency: value.frequency,
        days: value.days,
        target: Math.max(1, Number(value.target) || 1),
        unit: value.unit,
        icon: value.icon || 'sprout',
        color: value.color,
        start_date: value.startDate,
        end_date: value.endDate || null,
        cue: value.cue,
        reward: value.reward
      }));
    }
    await this.refreshViews();
    new Notice(existing ? 'Habit updated.' : `Created ${value.title}`);
  }

  async checkIn(habit, key, value, note = '', status = '') {
    await this.app.fileManager.processFrontMatter(habit.file, (fm) => {
      fm.history = normalizeHistory(fm.history);
      fm.history[key] = {
        value: Number(value) || 0,
        ...(note.trim() ? { note: note.trim() } : {}),
        ...(status ? { status } : {}),
        updated: new Date().toISOString()
      };
    });
    await this.refreshViews();
  }

  async clearCheckin(habit, key) {
    await this.app.fileManager.processFrontMatter(habit.file, (fm) => {
      fm.history = normalizeHistory(fm.history);
      delete fm.history[key];
    });
    await this.refreshViews();
    new Notice('Check-in cleared.');
  }

  async setArchived(habit, archived) {
    await this.app.fileManager.processFrontMatter(habit.file, (fm) => {
      fm.archived = archived;
      if (!archived && fm.end_date && String(fm.end_date) < isoDate()) fm.end_date = null;
    });
    await this.refreshViews();
    new Notice(archived ? 'Habit archived.' : 'Habit restored.');
  }

  async deleteHabit(habit) {
    await this.app.fileManager.trashFile(habit.file);
    await this.refreshViews();
    new Notice(`Habit “${habit.title}” moved to Trash.`);
  }
}
