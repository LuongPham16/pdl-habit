import { Modal, Notice, setIcon } from 'obsidian';
import { COLORS, HABIT_ICONS, WEEKDAYS } from '../constants.js';
import {
  PERIOD_OPTIONS, SCHEDULE_OPTIONS, TRACKING_OPTIONS,
  advancedCount, draftFromHabit, emptyDraft, habitFromDraft, validateDraft
} from '../habit-form.js';

/**
 * Compact habit sheet. Four decisions are visible — name, type, when, look —
 * everything else lives behind "More options" so creating a habit is one screen.
 */
export class HabitModal extends Modal {
  constructor(app, plugin, habit = null) {
    super(app);
    this.plugin = plugin;
    this.habit = habit;
    this.draft = habit ? draftFromHabit(habit) : emptyDraft();
    this.moreOpen = Boolean(habit) && advancedCount(this.draft) > 0;
    this.submitButton = null;
    this.saving = false;
  }

  onOpen() {
    this.modalEl.addClass('pdlh-habit-shell');
    this.contentEl.addClass('pdlh-habit-form');
    this.contentEl.onkeydown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        this.submit();
      }
    };
    this.render();
    setTimeout(() => this.nameInput?.focus?.(), 0);
  }

  onClose() { this.contentEl.empty(); }

  /* ------------------------------------------------------------- render */

  render() {
    const el = this.contentEl;
    el.empty();
    const editing = Boolean(this.habit);

    const head = el.createDiv({ cls: 'pdlh-form-head' });
    head.createEl('h2', { text: editing ? 'Edit habit' : 'New habit' });
    head.createEl('p', {
      cls: 'pdlh-form-sub',
      text: editing ? 'Change what you repeat, or how it is measured.' : 'Name it, choose how it counts, and you are done.'
    });

    const form = el.createDiv({ cls: 'pdlh-form' });
    this.renderName(form);
    this.renderTracking(form);
    this.renderWhen(form);
    this.renderLook(form);
    this.renderMore(form);
    this.renderFoot(el);
  }

  renderName(form) {
    const field = form.createDiv({ cls: 'pdlh-field' });
    field.createEl('span', { cls: 'pdlh-field-label', text: 'Name' });
    const input = field.createEl('input', {
      cls: 'pdlh-name-input',
      attr: { type: 'text', placeholder: 'e.g. Read 20 pages', 'aria-label': 'Habit name', spellcheck: 'false' }
    });
    input.value = this.draft.name;
    input.oninput = () => { this.draft.name = input.value; this.syncSubmit(); };
    input.onkeydown = (event) => { if (event.key === 'Enter') { event.preventDefault(); this.submit(); } };
    this.nameInput = input;
  }

  renderTracking(form) {
    const field = form.createDiv({ cls: 'pdlh-field' });
    field.createEl('span', { cls: 'pdlh-field-label', text: 'Type' });
    // Weekly habits are sessions, so "Count" has no meaning there.
    if (this.draft.schedule === 'week' && this.draft.tracking === 'count') this.draft.tracking = 'check';
    const options = this.draft.schedule === 'week'
      ? TRACKING_OPTIONS.filter(([id]) => id !== 'count')
      : TRACKING_OPTIONS;
    const group = field.createDiv({ cls: 'pdlh-choice', attr: { role: 'group', 'aria-label': 'Habit type' } });
    options.forEach(([id, label]) => {
      const active = this.draft.tracking === id;
      const button = group.createEl('button', { cls: active ? 'is-active' : '', text: label, attr: { 'aria-pressed': String(active) } });
      button.onclick = () => { this.draft.tracking = id; this.render(); };
    });

    if (this.draft.schedule === 'week') {
      field.createEl('p', { cls: 'pdlh-field-hint', text: 'Times-per-week habits are tracked as sessions, not amounts.' });
      return;
    }
    if (this.draft.tracking === 'check') {
      field.createEl('p', { cls: 'pdlh-field-hint', text: 'One tap marks it done — no amount needed.' });
      return;
    }

    const row = field.createDiv({ cls: 'pdlh-form-inline' });
    row.createEl('span', { cls: 'pdlh-inline-label', text: this.draft.tracking === 'limit' ? 'Max per day' : 'Amount per day' });
    const amount = row.createEl('input', { cls: 'pdlh-number', attr: { type: 'number', min: '1', step: '1', 'aria-label': 'Amount' } });
    amount.value = String(this.draft.target);
    amount.oninput = () => { this.draft.target = Math.max(1, Math.round(Number(amount.value) || 1)); };
    const unit = row.createEl('input', { cls: 'pdlh-unit', attr: { type: 'text', placeholder: 'unit — pages, ly, phút', 'aria-label': 'Unit' } });
    unit.value = this.draft.unit === 'time' ? '' : this.draft.unit;
    unit.oninput = () => { this.draft.unit = unit.value; };
  }

  renderWhen(form) {
    const field = form.createDiv({ cls: 'pdlh-field' });
    field.createEl('span', { cls: 'pdlh-field-label', text: 'When' });

    const periods = field.createDiv({ cls: 'pdlh-choice', attr: { role: 'group', 'aria-label': 'Time of day' } });
    PERIOD_OPTIONS.forEach(([id, label]) => {
      const active = this.draft.period === id;
      const button = periods.createEl('button', { cls: active ? 'is-active' : '', text: label, attr: { 'aria-pressed': String(active) } });
      button.onclick = () => { this.draft.period = id; this.render(); };
    });

    const schedules = field.createDiv({ cls: 'pdlh-choice', attr: { role: 'group', 'aria-label': 'Schedule' } });
    SCHEDULE_OPTIONS.forEach(([id, label]) => {
      const active = this.draft.schedule === id;
      const button = schedules.createEl('button', { cls: active ? 'is-active' : '', text: label, attr: { 'aria-pressed': String(active) } });
      button.onclick = () => {
        this.draft.schedule = id;
        if (id === 'week' && this.draft.tracking === 'count') this.draft.tracking = 'check';
        this.render();
      };
    });

    if (this.draft.schedule === 'days') {
      const days = field.createDiv({ cls: 'pdlh-days', attr: { role: 'group', 'aria-label': 'Days of the week' } });
      WEEKDAYS.forEach((label, day) => {
        const active = this.draft.days.includes(day);
        const button = days.createEl('button', { cls: `pdlh-day-chip ${active ? 'is-active' : ''}`.trim(), text: label.slice(0, 1), attr: { title: label, 'aria-label': label, 'aria-pressed': String(active) } });
        button.onclick = () => {
          this.draft.days = active ? this.draft.days.filter((item) => item !== day) : [...this.draft.days, day];
          this.render();
        };
      });
    }

    if (this.draft.schedule === 'week') {
      const row = field.createDiv({ cls: 'pdlh-form-inline' });
      row.createEl('span', { cls: 'pdlh-inline-label', text: 'Times per week' });
      const count = row.createEl('input', { cls: 'pdlh-number', attr: { type: 'number', min: '1', max: '7', step: '1', 'aria-label': 'Times per week' } });
      count.value = String(this.draft.perWeek);
      count.oninput = () => { this.draft.perWeek = Math.min(7, Math.max(1, Math.round(Number(count.value) || 1))); };
    }
  }

  renderLook(form) {
    const field = form.createDiv({ cls: 'pdlh-field' });
    field.createEl('span', { cls: 'pdlh-field-label', text: 'Look' });
    const row = field.createDiv({ cls: 'pdlh-look-row' });

    const picker = row.createEl('button', { cls: 'pdlh-icon-pick', attr: { 'aria-label': 'Choose an icon' } });
    picker.style.setProperty('--habit-color', this.draft.color);
    setIcon(picker.createSpan({ cls: 'pdlh-icon-pick-mark' }), this.draft.icon || 'sprout');
    picker.createSpan({ cls: 'pdlh-icon-pick-name', text: this.draft.icon || 'sprout' });
    picker.onclick = () => new HabitIconModal(this.app, this.draft.icon, this.draft.color, (icon) => {
      this.draft.icon = icon;
      this.render();
    }).open();

    const swatches = row.createDiv({ cls: 'pdlh-swatches', attr: { role: 'group', 'aria-label': 'Colour' } });
    COLORS.forEach((color) => {
      const active = this.draft.color === color;
      const dot = swatches.createEl('button', { cls: `pdlh-swatch ${active ? 'is-active' : ''}`.trim(), attr: { 'aria-label': color, 'aria-pressed': String(active) } });
      dot.style.background = color;
      dot.onclick = () => { this.draft.color = color; this.render(); };
    });
  }

  renderMore(form) {
    const more = form.createDiv({ cls: `pdlh-more ${this.moreOpen ? 'is-open' : ''}`.trim() });
    const toggle = more.createEl('button', { cls: 'pdlh-more-toggle', attr: { 'aria-expanded': String(this.moreOpen) } });
    setIcon(toggle.createSpan({ cls: 'pdlh-more-caret' }), this.moreOpen ? 'chevron-down' : 'chevron-right');
    const set = advancedCount(this.draft);
    toggle.createSpan({ text: set ? `More options · ${set} set` : 'More options' });
    toggle.onclick = () => { this.moreOpen = !this.moreOpen; this.render(); };

    const body = more.createDiv({ cls: 'pdlh-more-body' });
    body.createEl('p', { cls: 'pdlh-field-hint', text: 'Optional. Description, category, cue, reward and dates.' });

    const description = body.createDiv({ cls: 'pdlh-field' });
    description.createEl('span', { cls: 'pdlh-field-label', text: 'Description' });
    const descriptionInput = description.createEl('textarea', { cls: 'pdlh-textarea', attr: { rows: '2', placeholder: 'Why this matters' } });
    descriptionInput.value = this.draft.description;
    descriptionInput.oninput = () => { this.draft.description = descriptionInput.value; };

    const category = body.createDiv({ cls: 'pdlh-field' });
    category.createEl('span', { cls: 'pdlh-field-label', text: 'Category' });
    const categoryInput = category.createEl('input', { cls: 'pdlh-input', attr: { type: 'text', placeholder: 'Health, Learning, Mindfulness', 'aria-label': 'Category' } });
    categoryInput.value = this.draft.category;
    categoryInput.oninput = () => { this.draft.category = categoryInput.value; };

    const loop = body.createDiv({ cls: 'pdlh-form-grid' });
    const cue = loop.createDiv({ cls: 'pdlh-field' });
    cue.createEl('span', { cls: 'pdlh-field-label', text: 'Cue' });
    const cueInput = cue.createEl('input', { cls: 'pdlh-input', attr: { type: 'text', placeholder: 'After morning coffee', 'aria-label': 'Cue' } });
    cueInput.value = this.draft.cue;
    cueInput.oninput = () => { this.draft.cue = cueInput.value; };

    const reward = loop.createDiv({ cls: 'pdlh-field' });
    reward.createEl('span', { cls: 'pdlh-field-label', text: 'Reward' });
    const rewardInput = reward.createEl('input', { cls: 'pdlh-input', attr: { type: 'text', placeholder: 'A favourite song', 'aria-label': 'Reward' } });
    rewardInput.value = this.draft.reward;
    rewardInput.oninput = () => { this.draft.reward = rewardInput.value; };

    const dates = body.createDiv({ cls: 'pdlh-form-grid' });
    const start = dates.createDiv({ cls: 'pdlh-field' });
    start.createEl('span', { cls: 'pdlh-field-label', text: 'Starts' });
    const startInput = start.createEl('input', { cls: 'pdlh-input', attr: { type: 'date', 'aria-label': 'Start date' } });
    startInput.value = this.draft.startDate;
    startInput.oninput = () => { this.draft.startDate = startInput.value; };

    const end = dates.createDiv({ cls: 'pdlh-field' });
    end.createEl('span', { cls: 'pdlh-field-label', text: 'Ends (optional)' });
    const endInput = end.createEl('input', { cls: 'pdlh-input', attr: { type: 'date', 'aria-label': 'End date' } });
    endInput.value = this.draft.endDate;
    endInput.oninput = () => { this.draft.endDate = endInput.value; };
  }

  renderFoot(el) {
    const foot = el.createDiv({ cls: 'pdlh-form-foot' });
    foot.createSpan({ cls: 'pdlh-form-hint', text: 'Enter saves · Esc closes' });
    const actions = foot.createDiv({ cls: 'pdlh-form-actions' });
    const cancel = actions.createEl('button', { cls: 'pdlh-ghost-btn', text: 'Cancel' });
    cancel.onclick = () => this.close();
    const submit = actions.createEl('button', { cls: 'pdlh-primary', text: this.habit ? 'Save changes' : 'Create habit' });
    submit.onclick = () => this.submit();
    this.submitButton = submit;
    this.syncSubmit();
  }

  /* -------------------------------------------------------------- action */

  syncSubmit() {
    if (!this.submitButton) return;
    const ready = Boolean(String(this.draft.name || '').trim());
    this.submitButton.disabled = !ready;
    this.submitButton.toggleClass('is-disabled', !ready);
  }

  async submit() {
    if (this.saving) return;
    const error = validateDraft(this.draft);
    if (error) return new Notice(error);
    this.saving = true;
    if (this.submitButton) {
      this.submitButton.disabled = true;
      this.submitButton.setText?.(this.habit ? 'Saving…' : 'Creating…');
    }
    try {
      await this.plugin.saveHabit(habitFromDraft(this.draft), this.habit);
      this.close();
    } finally {
      this.saving = false;
    }
  }
}

/** Icon catalogue modal opened from the form. */
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
