import { Modal, Setting } from 'obsidian';
import { entryValue } from '../habits.js';

export class CheckinModal extends Modal {
  constructor(app, plugin, habit, key) {
    super(app); this.plugin = plugin; this.habit = habit; this.key = key;
    const existing = habit.history[key];
    this.value = entryValue(existing) || (habit.frequency === 'weekly' ? 1 : habit.target);
    this.note = typeof existing === 'object' ? existing.note || '' : '';
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
    actions.addButton((c) => c.setButtonText('Planned rest').onClick(async () => {
      await this.plugin.checkIn(this.habit, this.key, 0, this.note, 'skip');
      this.close();
    }));
    actions.addButton((c) => c.setButtonText('Clear').onClick(async () => {
      await this.plugin.clearCheckin(this.habit, this.key);
      this.close();
    }));
    actions.addButton((c) => c.setCta().setButtonText('Save').onClick(async () => {
      await this.plugin.checkIn(this.habit, this.key, this.value, this.note);
      this.close();
    }));
  }

  onClose() { this.contentEl.empty(); }
}
