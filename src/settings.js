import { PluginSettingTab, Setting, Notice, normalizePath } from 'obsidian';
import { VIEWS } from './constants.js';

export class PDLHabitSettingTab extends PluginSettingTab {
  constructor(app, plugin) { super(app, plugin); this.plugin = plugin; }

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
    new Setting(el).addButton((c) => c.setCta().setButtonText('Apply').onClick(async () => {
      await this.plugin.saveSettings();
      await this.plugin.ensureRoot();
      await this.plugin.refreshViews();
      new Notice('PDL Habit settings saved.');
    }));
  }
}
