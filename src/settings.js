import { PluginSettingTab, Setting, Notice, normalizePath } from 'obsidian';
import { LANGUAGES, t } from './i18n.js';
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
    el.createEl('h2', { text: t('PDL Habit settings') });
    new Setting(el)
      .setName(t('Habits folder'))
      .setDesc(t('Markdown habit notes live here'))
      .addText((c) => c.setValue(this.plugin.settings.rootFolder).onChange((v) => this.plugin.settings.rootFolder = normalizePath(v.trim())));
    new Setting(el)
      .setName(t('Week starts on'))
      .addDropdown((c) => c.addOption('1', t('Monday')).addOption('0', t('Sunday')).setValue(String(this.plugin.settings.weekStartsOn)).onChange((v) => this.plugin.settings.weekStartsOn = Number(v)));
    new Setting(el)
      .setName(t('Language'))
      .setDesc(t('Interface language'))
      .addDropdown((c) => { LANGUAGES.forEach(([id, label]) => c.addOption(id, label)); c.setValue(this.plugin.settings.language || 'auto').onChange(async (v) => { await this.plugin.setLanguageSetting(v); }); });
    new Setting(el)
      .setName(t('Default view'))
      .addDropdown((c) => { VIEWS.forEach((view) => c.addOption(view.id, view.label)); c.setValue(this.plugin.settings.defaultView).onChange((v) => this.plugin.settings.defaultView = v); });

    el.createEl('h3', { text: t('Reminders') });
    new Setting(el)
      .setName(t('Daily reminder'))
      .setDesc(t('One gentle nudge a day, only when something is still open. Obsidian has to be running.'))
      .addToggle((c) => c.setValue(Boolean(this.reminders.enabled)).onChange(async (v) => {
        this.plugin.settings.reminders = { ...this.reminders, enabled: v };
        await this.plugin.saveSettings();
      }));
    new Setting(el)
      .setName(t('Reminder time'))
      .setDesc(t('Shown once, at this time or up to three hours after.'))
      .addText((c) => {
        c.inputEl.type = 'time';
        c.setValue(this.reminders.time || DEFAULT_REMINDERS.time).onChange(async (v) => {
          this.plugin.settings.reminders = { ...this.reminders, time: v || DEFAULT_REMINDERS.time };
          await this.plugin.saveSettings();
        });
      });
    new Setting(el)
      .setName(t('Preview reminder'))
      .setDesc(t('Show the reminder now to check how it looks.'))
      .addButton((c) => c.setButtonText('Preview').onClick(() => this.plugin.previewReminder()));

    new Setting(el).addButton((c) => c.setCta().setButtonText('Apply').onClick(async () => {
      await this.plugin.saveSettings();
      await this.plugin.ensureRoot();
      await this.plugin.refreshViews();
      new Notice(t('PDL Habit settings saved.'));
    }));
  }
}
