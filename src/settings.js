import { PluginSettingTab, Setting, Notice, normalizePath } from 'obsidian';
import { VIEWS } from './constants.js';
import { DEFAULT_REMINDERS } from './reminders.js';

export class PDLHabitSettingTab extends PluginSettingTab {
  constructor(app, plugin) { super(app, plugin); this.plugin = plugin; }

  get reminders() {
    return this.plugin.settings.reminders || DEFAULT_REMINDERS;
  }

  display() {
    const { containerEl: el } = this;
    el.empty();
    el.createEl('h2', { text: 'PDL Habit settings' });
    new Setting(el)
      .setName('Habits folder')
      .setDesc('Markdown habit notes live here')
      .addText((c) => c.setValue(this.plugin.settings.rootFolder).onChange((v) => this.plugin.settings.rootFolder = normalizePath(v.trim())));
    new Setting(el)
      .setName('Week starts on')
      .addDropdown((c) => c.addOption('1', 'Monday').addOption('0', 'Sunday').setValue(String(this.plugin.settings.weekStartsOn)).onChange((v) => this.plugin.settings.weekStartsOn = Number(v)));
    new Setting(el)
      .setName('Default view')
      .addDropdown((c) => { VIEWS.forEach((view) => c.addOption(view.id, view.label)); c.setValue(this.plugin.settings.defaultView).onChange((v) => this.plugin.settings.defaultView = v); });

    el.createEl('h3', { text: 'Reminders' });
    new Setting(el)
      .setName('Daily reminder')
      .setDesc('One gentle nudge a day, only when something is still open. Obsidian has to be running.')
      .addToggle((c) => c.setValue(Boolean(this.reminders.enabled)).onChange(async (v) => {
        this.plugin.settings.reminders = { ...this.reminders, enabled: v };
        await this.plugin.saveSettings();
      }));
    new Setting(el)
      .setName('Reminder time')
      .setDesc('Shown once, at this time or up to three hours after.')
      .addText((c) => {
        c.inputEl.type = 'time';
        c.setValue(this.reminders.time || DEFAULT_REMINDERS.time).onChange(async (v) => {
          this.plugin.settings.reminders = { ...this.reminders, time: v || DEFAULT_REMINDERS.time };
          await this.plugin.saveSettings();
        });
      });
    new Setting(el)
      .setName('Preview reminder')
      .setDesc('Show the reminder now to check how it looks.')
      .addButton((c) => c.setButtonText('Preview').onClick(() => this.plugin.previewReminder()));

    new Setting(el).addButton((c) => c.setCta().setButtonText('Apply').onClick(async () => {
      await this.plugin.saveSettings();
      await this.plugin.ensureRoot();
      await this.plugin.refreshViews();
      new Notice('PDL Habit settings saved.');
    }));
  }
}
