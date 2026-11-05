import { Modal, Setting, Notice, setIcon } from 'obsidian';
import { COLORS, HABIT_ICONS, PERIODS, WEEKDAYS } from '../constants.js';
import { isoDate } from '../dates.js';

export class HabitModal extends Modal {
  constructor(app, plugin, habit = null) {
    super(app); this.plugin = plugin; this.habit = habit;
    this.value = habit ? { ...habit, days: [...habit.days] } : {
      title: '', description: '', category: 'Personal', period: 'anytime', direction: 'build',
      frequency: 'daily', days: [1, 2, 3, 4, 5], target: 1, unit: 'time', icon: 'sprout',
      color: COLORS[0], startDate: isoDate(), endDate: '', cue: '', reward: ''
    };
  }

  onOpen() {
    const el = this.contentEl;
    el.addClass('pdlh-modal');
    el.createEl('h2', { text: this.habit ? 'Edit habit' : 'Create habit' });
    el.createEl('p', { cls: 'pdlh-modal-copy', text: 'Make the action small, specific, and easy to record.' });
    new Setting(el).setName('Name').addText((c) => c.setPlaceholder('e.g. Read 20 pages').setValue(this.value.title).onChange((v) => this.value.title = v));
    new Setting(el).setName('Description').addTextArea((c) => c.setPlaceholder('Why this matters').setValue(this.value.description).onChange((v) => this.value.description = v));
    new Setting(el).setName('Category').addText((c) => c.setPlaceholder('Health, Learning, Mindfulness').setValue(this.value.category).onChange((v) => this.value.category = v));
    new Setting(el).setName('Time of day').addDropdown((c) => { Object.entries(PERIODS).forEach(([id, label]) => c.addOption(id, label)); c.setValue(this.value.period).onChange((v) => this.value.period = v); });
    new Setting(el).setName('Direction').setDesc('Build a behavior or reduce one').addDropdown((c) => c.addOption('build', 'Build a habit').addOption('quit', 'Limit a habit').setValue(this.value.direction).onChange((v) => this.value.direction = v));
    new Setting(el).setName('Schedule').addDropdown((c) => c.addOption('daily', 'Every day').addOption('weekdays', 'Selected days').addOption('weekly', 'Times per week').setValue(this.value.frequency).onChange((v) => { this.value.frequency = v; this.renderDays(); }));
    this.daysHost = el.createDiv({ cls: 'pdlh-days-host' });
    this.renderDays();
    const target = new Setting(el).setName('Target');
    target.addText((c) => { c.inputEl.type = 'number'; c.inputEl.min = '1'; c.setValue(String(this.value.target)).onChange((v) => this.value.target = Math.max(1, Number(v) || 1)); });
    target.addText((c) => c.setPlaceholder('unit').setValue(this.value.unit).onChange((v) => this.value.unit = v.trim() || 'time'));
    new Setting(el).setName('Cue').setDesc('What will trigger this habit?').addText((c) => c.setPlaceholder('After morning coffee').setValue(this.value.cue).onChange((v) => this.value.cue = v));
    new Setting(el).setName('Reward').setDesc('A small immediate reward').addText((c) => c.setPlaceholder('Listen to one favorite song').setValue(this.value.reward).onChange((v) => this.value.reward = v));
    const iconSetting = new Setting(el).setName('Icon').setDesc('Choose a symbol for this habit');
    iconSetting.addButton((c) => {
      this.iconButton = c; this.updateIconButton();
      c.onClick(() => new HabitIconModal(this.app, this.value.icon, this.value.color, (icon) => {
        this.value.icon = icon; this.updateIconButton();
      }).open());
    });
    new Setting(el).setName('Color').addColorPicker((c) => c.setValue(this.value.color).onChange((v) => { this.value.color = v; this.updateIconButton(); }));
    new Setting(el).setName('Start date').addText((c) => { c.inputEl.type = 'date'; c.setValue(this.value.startDate).onChange((v) => this.value.startDate = v); });
    new Setting(el).setName('End date').setDesc('Optional').addText((c) => { c.inputEl.type = 'date'; c.setValue(this.value.endDate).onChange((v) => this.value.endDate = v); });
    new Setting(el).addButton((c) => c.setButtonText('Cancel').onClick(() => this.close())).addButton((c) => c.setCta().setButtonText(this.habit ? 'Save changes' : 'Create habit').onClick(async () => {
      if (!this.value.title.trim()) return new Notice('Enter a habit name.');
      if (this.value.endDate && this.value.endDate < this.value.startDate) return new Notice('End date must be after start date.');
      await this.plugin.saveHabit(this.value, this.habit);
      this.close();
    }));
  }

  updateIconButton() {
    if (!this.iconButton) return;
    this.iconButton.setButtonText('');
    this.iconButton.buttonEl.empty();
    this.iconButton.buttonEl.addClass('pdlh-icon-choice');
    this.iconButton.buttonEl.style.setProperty('--habit-color', this.value.color);
    setIcon(this.iconButton.buttonEl.createSpan(), this.value.icon || 'sprout');
    this.iconButton.buttonEl.createSpan({ text: this.value.icon || 'sprout' });
  }

  renderDays() {
    if (!this.daysHost) return;
    this.daysHost.empty();
    if (this.value.frequency === 'weekdays') {
      const row = this.daysHost.createDiv({ cls: 'pdlh-day-picker' });
      WEEKDAYS.forEach((label, day) => {
        const active = this.value.days.includes(day);
        const button = row.createEl('button', { cls: active ? 'is-active' : '', text: label.slice(0, 1), attr: { title: label, 'aria-pressed': String(active) } });
        button.onclick = () => {
          this.value.days = active ? this.value.days.filter((item) => item !== day) : [...this.value.days, day];
          this.renderDays();
        };
      });
    } else if (this.value.frequency === 'weekly') {
      this.daysHost.createEl('p', { text: 'The target is counted across each calendar week.' });
    }
  }

  onClose() { this.contentEl.empty(); }
}

export class HabitIconModal extends Modal {
  constructor(app, selected, color, onSelect) {
    super(app); this.selected = selected; this.color = color; this.onSelect = onSelect; this.query = '';
  }

  onOpen() {
    this.modalEl.addClass('pdlh-icon-modal-shell');
    this.contentEl.addClass('pdlh-modal');
    this.render();
  }

  render() {
    const el = this.contentEl;
    el.empty();
    el.createEl('h2', { text: 'Choose an icon' });
    el.createEl('p', { cls: 'pdlh-modal-copy', text: `${HABIT_ICONS.reduce((sum, [, icons]) => sum + icons.length, 0)} icons organized by purpose.` });
    const search = el.createDiv({ cls: 'pdlh-icon-search' });
    setIcon(search.createSpan(), 'search');
    const input = search.createEl('input', { attr: { type: 'search', placeholder: 'Search icon name', 'aria-label': 'Search icons' } });
    input.value = this.query;
    const groups = el.createDiv({ cls: 'pdlh-icon-groups' });
    input.oninput = () => { this.query = input.value.toLowerCase().trim(); this.renderGroups(groups); };
    this.renderGroups(groups);
    setTimeout(() => input.focus(), 0);
  }

  renderGroups(parent) {
    parent.empty();
    let found = 0;
    HABIT_ICONS.forEach(([label, icons]) => {
      const matches = icons.filter((icon) => !this.query || icon.includes(this.query));
      if (!matches.length) return;
      found += matches.length;
      const group = parent.createDiv({ cls: 'pdlh-icon-group' });
      group.createEl('h3', { text: label });
      const grid = group.createDiv({ cls: 'pdlh-icon-grid' });
      matches.forEach((icon) => {
        const button = grid.createEl('button', { cls: icon === this.selected ? 'is-selected' : '', attr: { 'aria-label': icon, title: icon, 'aria-pressed': String(icon === this.selected) } });
        button.style.setProperty('--habit-color', this.color);
        setIcon(button, icon);
        button.onclick = () => { this.onSelect(icon); this.close(); };
      });
    });
    if (!found) parent.createEl('p', { cls: 'pdlh-muted', text: 'No matching icons.' });
  }

  onClose() { this.contentEl.empty(); }
}
