import { Modal, Notice, setIcon } from 'obsidian';
import { t } from '../i18n.js';
import { HABIT_ICONS, ICON_NAMES, WEEKDAYS } from '../constants.js';
import { setHabitIcon } from '../dom.js';
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
    head.createEl('h2', { text: editing ? t('Edit habit') : t('New habit') });
    head.createEl('p', {
      cls: 'pdlh-form-sub',
      text: editing ? t('Change what you repeat, or how it is measured.') : t('Name it, choose how it counts, and you are done.')
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
    field.createEl('span', { cls: 'pdlh-field-label', text: t('Name') });
    const input = field.createEl('input', {
      cls: 'pdlh-name-input',
      attr: { type: 'text', placeholder: t('e.g. Read 20 pages'), 'aria-label': t('Habit name'), spellcheck: 'false' }
    });
    input.value = this.draft.name;
    input.oninput = () => { this.draft.name = input.value; this.syncSubmit(); };
    input.onkeydown = (event) => { if (event.key === 'Enter') { event.preventDefault(); this.submit(); } };
    this.nameInput = input;
  }

  renderTracking(form) {
    const field = form.createDiv({ cls: 'pdlh-field' });
    field.createEl('span', { cls: 'pdlh-field-label', text: t('Type') });
    // Weekly habits are sessions, so "Count" has no meaning there.
    const session = this.draft.schedule === 'week' || this.draft.schedule === 'month';
    if (session && this.draft.tracking === 'count') this.draft.tracking = 'check';
    const options = session
      ? TRACKING_OPTIONS.filter(([id]) => id !== 'count')
      : TRACKING_OPTIONS;
    const group = field.createDiv({ cls: 'pdlh-choice', attr: { role: 'group', 'aria-label': 'Habit type' } });
    options.forEach(([id, label]) => {
      const active = this.draft.tracking === id;
      const button = group.createEl('button', { cls: active ? 'is-active' : '', text: t(label), attr: { 'aria-pressed': String(active) } });
      button.onclick = () => { this.draft.tracking = id; this.render(); };
    });

    if (session) {
      field.createEl('p', { cls: 'pdlh-field-hint', text: t('Session-based habits are counted as check-ins, not amounts.') });
      return;
    }
    if (this.draft.tracking === 'check') {
      field.createEl('p', { cls: 'pdlh-field-hint', text: t('One tap marks it done — no amount needed.') });
      return;
    }

    const row = field.createDiv({ cls: 'pdlh-form-inline' });
    row.createEl('span', { cls: 'pdlh-inline-label', text: this.draft.tracking === 'limit' ? t('Max per day') : t('Amount per day') });
    const amount = row.createEl('input', { cls: 'pdlh-number', attr: { type: 'number', min: '1', step: '1', 'aria-label': t('Amount') } });
    amount.value = String(this.draft.target);
    amount.oninput = () => { this.draft.target = Math.max(1, Math.round(Number(amount.value) || 1)); };
    const unit = row.createEl('input', { cls: 'pdlh-unit', attr: { type: 'text', placeholder: t('unit — pages, ly, phút'), 'aria-label': 'Unit' } });
    unit.value = this.draft.unit === 'time' ? '' : this.draft.unit;
    unit.oninput = () => { this.draft.unit = unit.value; };
  }

  renderWhen(form) {
    const field = form.createDiv({ cls: 'pdlh-field' });
    field.createEl('span', { cls: 'pdlh-field-label', text: t('When') });

    const periods = field.createDiv({ cls: 'pdlh-choice', attr: { role: 'group', 'aria-label': 'Time of day' } });
    PERIOD_OPTIONS.forEach(([id, label]) => {
      const active = this.draft.period === id;
      const button = periods.createEl('button', { cls: active ? 'is-active' : '', text: t(label), attr: { 'aria-pressed': String(active) } });
      button.onclick = () => { this.draft.period = id; this.render(); };
    });

    const schedules = field.createDiv({ cls: 'pdlh-choice', attr: { role: 'group', 'aria-label': t('Schedule') } });
    SCHEDULE_OPTIONS.forEach(([id, label]) => {
      const active = this.draft.schedule === id;
      const button = schedules.createEl('button', { cls: active ? 'is-active' : '', text: t(label), attr: { 'aria-pressed': String(active) } });
      button.onclick = () => {
        this.draft.schedule = id;
        if ((id === 'week' || id === 'month') && this.draft.tracking === 'count') this.draft.tracking = 'check';
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

    const countRow = (label, value, min, max, apply) => {
      const row = field.createDiv({ cls: 'pdlh-form-inline' });
      row.createEl('span', { cls: 'pdlh-inline-label', text: label });
      const input = row.createEl('input', { cls: 'pdlh-number', attr: { type: 'number', min: String(min), max: String(max), step: '1', 'aria-label': label } });
      input.value = String(value);
      input.oninput = () => apply(Math.min(max, Math.max(min, Math.round(Number(input.value) || min))));
    };

    if (this.draft.schedule === 'week') countRow(t('Times per week'), this.draft.perWeek, 1, 7, (n) => { this.draft.perWeek = n; });
    if (this.draft.schedule === 'month') countRow(t('Times per month'), this.draft.perMonth, 1, 31, (n) => { this.draft.perMonth = n; });
    if (this.draft.schedule === 'interval') countRow(t('Every N days'), this.draft.intervalDays, 1, 365, (n) => { this.draft.intervalDays = n; });

    const timeRow = field.createDiv({ cls: 'pdlh-form-inline' });
    timeRow.createEl('span', { cls: 'pdlh-inline-label', text: t('at (optional)') });
    const time = timeRow.createEl('input', { cls: 'pdlh-input pdlh-time', attr: { type: 'time', 'aria-label': t('at (optional)') } });
    time.value = this.draft.time || '';
    time.oninput = () => { this.draft.time = time.value; };
  }

  renderLook(form) {
    const field = form.createDiv({ cls: 'pdlh-field' });
    field.createEl('span', { cls: 'pdlh-field-label', text: t('Look') });
    const row = field.createDiv({ cls: 'pdlh-look-row' });

    const picker = row.createEl('button', { cls: 'pdlh-icon-pick', attr: { 'aria-label': t('Choose an icon') } });
    picker.style.setProperty('--habit-color', this.draft.color);
    const mark = picker.createSpan({ cls: 'pdlh-icon-pick-mark' });
    setHabitIcon(mark, this.draft.icon);
    const markName = picker.createSpan({ cls: 'pdlh-icon-pick-name', text: this.draft.icon || 'sprout' });
    picker.onclick = () => new HabitIconModal(this.app, this.draft.icon, this.draft.color, (icon) => {
      this.draft.icon = icon;
      setHabitIcon(mark, icon);
      markName.setText(icon);
    }).open();

    // A native colour field gives infinite colours without a long swatch row.
    const color = row.createDiv({ cls: 'pdlh-color-pick' });
    const input = color.createEl('input', {
      cls: 'pdlh-color-input',
      attr: { type: 'color', 'aria-label': 'Habit colour', title: t('Pick any colour') }
    });
    input.value = this.draft.color;
    const hex = color.createSpan({ cls: 'pdlh-color-hex', text: String(this.draft.color).toUpperCase() });
    const apply = (value) => {
      this.draft.color = value;
      picker.style.setProperty('--habit-color', value);
      hex.setText(String(value).toUpperCase());
      input.value = value;
    };
    input.oninput = () => apply(input.value);
    input.onchange = () => apply(input.value);
  }

  renderMore(form) {
    const more = form.createDiv({ cls: `pdlh-more ${this.moreOpen ? 'is-open' : ''}`.trim() });
    const toggle = more.createEl('button', { cls: 'pdlh-more-toggle', attr: { 'aria-expanded': String(this.moreOpen) } });
    setIcon(toggle.createSpan({ cls: 'pdlh-more-caret' }), this.moreOpen ? 'chevron-down' : 'chevron-right');
    const set = advancedCount(this.draft);
    toggle.createSpan({ text: set ? `More options · ${set} set` : t('More options') });
    toggle.onclick = () => { this.moreOpen = !this.moreOpen; this.render(); };

    const body = more.createDiv({ cls: 'pdlh-more-body' });
    body.createEl('p', { cls: 'pdlh-field-hint', text: t('Optional. Description, category, cue, reward and dates.') });

    const description = body.createDiv({ cls: 'pdlh-field' });
    description.createEl('span', { cls: 'pdlh-field-label', text: t('Description') });
    const descriptionInput = description.createEl('textarea', { cls: 'pdlh-textarea', attr: { rows: '2', placeholder: t('Why this matters') } });
    descriptionInput.value = this.draft.description;
    descriptionInput.oninput = () => { this.draft.description = descriptionInput.value; };

    const category = body.createDiv({ cls: 'pdlh-field' });
    category.createEl('span', { cls: 'pdlh-field-label', text: t('Category') });
    const categoryInput = category.createEl('input', { cls: 'pdlh-input', attr: { type: 'text', placeholder: t('Health, Learning, Mindfulness'), 'aria-label': t('Category') } });
    categoryInput.value = this.draft.category;
    categoryInput.oninput = () => { this.draft.category = categoryInput.value; };

    const loop = body.createDiv({ cls: 'pdlh-form-grid' });
    const cue = loop.createDiv({ cls: 'pdlh-field' });
    cue.createEl('span', { cls: 'pdlh-field-label', text: t('Cue') });
    const cueInput = cue.createEl('input', { cls: 'pdlh-input', attr: { type: 'text', placeholder: t('After morning coffee'), 'aria-label': t('Cue') } });
    cueInput.value = this.draft.cue;
    cueInput.oninput = () => { this.draft.cue = cueInput.value; };

    const reward = loop.createDiv({ cls: 'pdlh-field' });
    reward.createEl('span', { cls: 'pdlh-field-label', text: t('Reward') });
    const rewardInput = reward.createEl('input', { cls: 'pdlh-input', attr: { type: 'text', placeholder: t('A favourite song'), 'aria-label': t('Reward') } });
    rewardInput.value = this.draft.reward;
    rewardInput.oninput = () => { this.draft.reward = rewardInput.value; };

    const dates = body.createDiv({ cls: 'pdlh-form-grid' });
    const start = dates.createDiv({ cls: 'pdlh-field' });
    start.createEl('span', { cls: 'pdlh-field-label', text: t('Starts') });
    const startInput = start.createEl('input', { cls: 'pdlh-input', attr: { type: 'date', 'aria-label': 'Start date' } });
    startInput.value = this.draft.startDate;
    startInput.oninput = () => { this.draft.startDate = startInput.value; };

    const end = dates.createDiv({ cls: 'pdlh-field' });
    end.createEl('span', { cls: 'pdlh-field-label', text: t('Ends (optional)') });
    const endInput = end.createEl('input', { cls: 'pdlh-input', attr: { type: 'date', 'aria-label': 'End date' } });
    endInput.value = this.draft.endDate;
    endInput.oninput = () => { this.draft.endDate = endInput.value; };
  }

  renderFoot(el) {
    const foot = el.createDiv({ cls: 'pdlh-form-foot' });
    foot.createSpan({ cls: 'pdlh-form-hint', text: t('Enter saves · Esc closes') });
    const actions = foot.createDiv({ cls: 'pdlh-form-actions' });
    const cancel = actions.createEl('button', { cls: 'pdlh-ghost-btn', text: t('Cancel') });
    cancel.onclick = () => this.close();
    const submit = actions.createEl('button', { cls: 'pdlh-primary', text: this.habit ? t('Save changes') : t('Create habit') });
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
    el.createEl('h2', { text: t('Choose an icon') });
    el.createEl('p', { cls: 'pdlh-modal-copy', text: `${ICON_NAMES.length} icons organized by purpose.` });
    const search = el.createDiv({ cls: 'pdlh-icon-search' });
    setIcon(search.createSpan(), 'search');
    const input = search.createEl('input', { attr: { type: 'search', placeholder: t('Search icon name'), 'aria-label': 'Search icons' } });
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
        setHabitIcon(button, icon);
        button.onclick = () => { this.onSelect(icon); this.close(); };
      });
    });
    if (!found) parent.createEl('p', { cls: 'pdlh-muted', text: t('No matching icons.') });
  }

  onClose() { this.contentEl.empty(); }
}
