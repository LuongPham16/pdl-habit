import { Modal, Setting } from 'obsidian';

export class ConfirmModal extends Modal {
  constructor(app, title, message, confirm, label = 'Move to Trash') {
    super(app); this.title = title; this.message = message; this.confirm = confirm; this.label = label;
  }

  onOpen() {
    this.contentEl.addClass('pdlh-modal');
    this.contentEl.createEl('h2', { text: this.title });
    this.contentEl.createEl('p', { cls: 'pdlh-modal-copy', text: this.message });
    new Setting(this.contentEl)
      .addButton((c) => c.setButtonText('Cancel').onClick(() => this.close()))
      .addButton((c) => c.setWarning().setButtonText(this.label).onClick(async () => {
        await this.confirm();
        this.close();
      }));
  }

  onClose() { this.contentEl.empty(); }
}
