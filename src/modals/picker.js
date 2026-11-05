import { Modal } from 'obsidian';
import { isoDate } from '../dates.js';
import { CheckinModal } from './checkin.js';

export class HabitModalPicker extends Modal {
  constructor(app, plugin, habits) {
    super(app); this.plugin = plugin; this.habits = habits;
  }

  onOpen() {
    this.contentEl.addClass('pdlh-modal');
    this.contentEl.createEl('h2', { text: 'Check in a habit' });
    const list = this.contentEl.createDiv({ cls: 'pdlh-picker' });
    this.habits.forEach((habit) => {
      const button = list.createEl('button');
      button.createSpan({ cls: 'pdlh-color-dot' }).style.background = habit.color;
      button.createSpan({ text: habit.title });
      button.onclick = () => { this.close(); new CheckinModal(this.app, this.plugin, habit, isoDate()).open(); };
    });
  }

  onClose() { this.contentEl.empty(); }
}
