import { Modal, Setting } from 'obsidian';
import { entryValue } from '../habits.js';

export class CheckinModal extends Modal {
  constructor(app, plugin, habit, key) {
    super(app); this.plugin = plugin; this.habit = habit; this.key = key;
    const existing = habit.history[key];
    this.previous = existing === undefined ? null : JSON.parse(JSON.stringify(existing));
    this.value = entryValue(existing) || (habit.frequency === 'weekly' ? 1 : habit.target);
    this.note = typeof existing === 'object' ? existing.note || '' : '';
  }

  /** Apply the change, then offer Undo with the state captured when the sheet opened. */
  async apply(message, action) {
    await action();
    this.plugin.offerUndo({ message, habit: this.habit, key: this.key, previous: this.previous });
    this.close();
  }

  onOpen() {
    const el = this.contentEl;
    el.addClass('pdlh-modal');
    el.createEl('h2', { text: this.habit.title });
    el.createEl('p', { cls: 'pdlh-modal-copy', text: this.key });
    new Setting(el).setName(`Amount (${this.habit.unit})`).addText((c) => {
      c.inputEl.type = 'number'; c.inputEl.min = '0';
      c.setValue(String(this.value)).onChange((v) => this.value = Math.max(0, Number(v) || 0));
    });
    new Setting(el).setName('Note').addTextArea((c) => c.setPlaceholder('What helped or got in the way?').setValue(this.note).onChange((v) => this.note = v));
    const actions = new Setting(el);
    actions.addButton((c) => c.setButtonText('Planned rest').onClick(() => this.apply(
      `Planned rest saved for ${this.habit.title}`,
      () => this.plugin.checkIn(this.habit, this.key, 0, this.note, 'skip')
    )));
    actions.addButton((c) => c.setButtonText('Clear').onClick(() => this.apply(
      `Check-in cleared for ${this.habit.title}`,
      () => this.plugin.clearCheckin(this.habit, this.key)
    )));
    actions.addButton((c) => c.setCta().setButtonText('Save').onClick(() => this.apply(
      `${this.habit.title} saved`,
      () => this.plugin.checkIn(this.habit, this.key, this.value, this.note)
    )));
  }

  onClose() { this.contentEl.empty(); }
}
