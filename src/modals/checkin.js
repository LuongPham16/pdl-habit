import { Modal, setIcon } from 'obsidian';
import { shortDay } from '../dates.js';
import { completion, entryValue, isBinaryHabit } from '../habits.js';
import { clampStepper } from '../habit-form.js';

/**
 * Check-in sheet for a single day.
 *
 * Count / Limit habits start at 0 and are filled with − / + buttons, so recording
 * "2 of 3 glasses" is two taps rather than editing a pre-filled number.
 * Binary habits (did it / times-per-week) get a Done / Not done switch instead.
 */
export class CheckinModal extends Modal {
  constructor(app, plugin, habit, key) {
    super(app);
    this.plugin = plugin;
    this.habit = habit;
    this.key = key;
    const existing = habit.history[key];
    this.previous = existing === undefined ? null : JSON.parse(JSON.stringify(existing));
    this.hasEntry = existing !== undefined;
    this.note = typeof existing === 'object' ? existing.note || '' : '';
    this.binary = isBinaryHabit(habit);
    this.value = this.hasEntry ? Math.max(0, entryValue(existing)) : 0;
    this.done = this.hasEntry && completion(habit, key).done;
    this.saving = false;
  }

  onOpen() {
    this.modalEl.addClass('pdlh-checkin-shell');
    this.contentEl.addClass('pdlh-modal', 'pdlh-checkin');
    this.render();
  }

  onClose() { this.contentEl.empty(); }

  /* -------------------------------------------------------------- render */

  render() {
    const el = this.contentEl;
    el.empty();

    const head = el.createDiv({ cls: 'pdlh-checkin-head' });
    head.createEl('h2', { text: this.habit.title });
    head.createEl('p', { cls: 'pdlh-checkin-date', text: shortDay(this.key) });

    const body = el.createDiv({ cls: 'pdlh-checkin-body' });
    if (this.binary) this.renderStatus(body);
    else this.renderStepper(body);
    this.renderNote(body);
    this.renderFoot(el);
  }

  renderStatus(parent) {
    const field = parent.createDiv({ cls: 'pdlh-field' });
    field.createEl('span', { cls: 'pdlh-field-label', text: 'Status' });
    const group = field.createDiv({ cls: 'pdlh-choice', attr: { role: 'group', 'aria-label': 'Status' } });
    [['done', 'Done'], ['missed', 'Not done']].forEach(([id, label]) => {
      const active = id === 'done' ? this.done : !this.done;
      const button = group.createEl('button', { cls: active ? 'is-active' : '', text: label, attr: { 'aria-pressed': String(active) } });
      button.onclick = () => { this.done = id === 'done'; this.render(); };
    });
  }

  renderStepper(parent) {
    const habit = this.habit;
    const target = Math.max(1, Number(habit.target) || 1);
    const unit = habit.unit && habit.unit !== 'time' ? ` ${habit.unit}` : '';
    const limit = habit.direction === 'quit';

    const field = parent.createDiv({ cls: 'pdlh-field' });
    field.createEl('span', { cls: 'pdlh-field-label', text: `Amount${unit ? ` (${habit.unit})` : ''}` });

    const row = field.createDiv({ cls: 'pdlh-stepper' });
    const minus = row.createEl('button', { cls: 'pdlh-stepper-btn', attr: { 'aria-label': 'Decrease' } });
    setIcon(minus, 'minus');
    const input = row.createEl('input', {
      cls: 'pdlh-stepper-input',
      attr: { type: 'number', min: '0', max: '99', step: '1', inputmode: 'numeric', 'aria-label': 'Amount' }
    });
    const plus = row.createEl('button', { cls: 'pdlh-stepper-btn', attr: { 'aria-label': 'Increase' } });
    setIcon(plus, 'plus');

    const hint = field.createEl('p', { cls: 'pdlh-stepper-hint' });
    const sync = () => {
      input.value = String(this.value);
      minus.disabled = this.value <= 0;
      const over = limit && this.value > target;
      hint.toggleClass('is-over', over);
      hint.setText(over
        ? `${this.value - target} over the ${target}${unit} limit`
        : limit
          ? `Max ${target}${unit} per day — stay under to keep the streak`
          : this.value >= target
            ? `Goal reached (${target}${unit})`
            : `${this.value} of ${target}${unit}`);
    };

    const set = (next) => { this.value = clampStepper(next); sync(); };
    minus.onclick = () => set(this.value - 1);
    plus.onclick = () => set(this.value + 1);
    input.oninput = () => {
      const parsed = Number(input.value);
      this.value = Number.isFinite(parsed) ? clampStepper(parsed) : 0;
      minus.disabled = this.value <= 0;
      const over = limit && this.value > target;
      hint.toggleClass('is-over', over);
      hint.setText(over
        ? `${this.value - target} over the ${target}${unit} limit`
        : limit
          ? `Max ${target}${unit} per day — stay under to keep the streak`
          : this.value >= target
            ? `Goal reached (${target}${unit})`
            : `${this.value} of ${target}${unit}`);
    };
    input.onblur = () => { input.value = String(this.value); };

    sync();
    setTimeout(() => input.focus(), 0);
  }

  renderNote(parent) {
    const field = parent.createDiv({ cls: 'pdlh-field' });
    field.createEl('span', { cls: 'pdlh-field-label', text: 'Note (optional)' });
    const note = field.createEl('textarea', {
      cls: 'pdlh-textarea',
      attr: { rows: '2', placeholder: 'What helped or got in the way?', 'aria-label': 'Note' }
    });
    note.value = this.note;
    note.oninput = () => { this.note = note.value; };
  }

  renderFoot(el) {
    const foot = el.createDiv({ cls: 'pdlh-checkin-foot' });
    const actions = foot.createDiv({ cls: 'pdlh-checkin-actions' });

    const rest = actions.createEl('button', { cls: 'pdlh-ghost-btn', text: 'Planned rest' });
    rest.onclick = () => this.apply(`Planned rest saved for ${this.habit.title}`, () => this.plugin.checkIn(this.habit, this.key, 0, this.note, 'skip'));

    if (this.hasEntry) {
      const clear = actions.createEl('button', { cls: 'pdlh-ghost-btn', text: 'Clear' });
      clear.onclick = () => this.apply(`Check-in cleared for ${this.habit.title}`, () => this.plugin.clearCheckin(this.habit, this.key));
    }

    const save = actions.createEl('button', { cls: 'pdlh-primary', text: 'Save' });
    save.onclick = () => this.submit();
    this.saveButton = save;
    this.syncSave();
  }

  /* -------------------------------------------------------------- action */

  syncSave() {
    if (!this.saveButton) return;
    // Nothing to write when a binary habit is "not done" and had no entry before.
    const writes = !this.binary || this.done || this.hasEntry;
    this.saveButton.disabled = !writes;
  }

  async apply(message, action) {
    if (this.saving) return;
    this.saving = true;
    try {
      await action();
      this.plugin.offerUndo({ message, habit: this.habit, key: this.key, previous: this.previous });
      this.close();
    } finally {
      this.saving = false;
    }
  }

  async submit() {
    if (this.binary) {
      if (this.done) return this.apply(`${this.habit.title} checked in`, () => this.plugin.checkIn(this.habit, this.key, 1, this.note));
      return this.apply(`Check-in cleared for ${this.habit.title}`, () => this.plugin.clearCheckin(this.habit, this.key));
    }
    return this.apply(`${this.habit.title} saved`, () => this.plugin.checkIn(this.habit, this.key, this.value, this.note));
  }
}
