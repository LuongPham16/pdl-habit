import { Modal } from 'obsidian';
import { isoDate } from '../dates.js';
import { t } from '../i18n.js';

/** "Open a day": pick any date and jump to it in Today. */
export class DayPickerModal extends Modal {
  constructor(app, onPick) {
    super(app);
    this.onPick = onPick;
    this.value = isoDate();
  }

  onOpen() {
    this.modalEl.addClass('pdlh-daypicker-shell');
    this.contentEl.addClass('pdlh-modal', 'pdlh-daypicker');

    const head = this.contentEl.createDiv({ cls: 'pdlh-form-head' });
    head.createEl('h2', { text: t('Open a day') });

    const body = this.contentEl.createDiv({ cls: 'pdlh-form' });
    const field = body.createDiv({ cls: 'pdlh-field' });
    field.createEl('span', { cls: 'pdlh-field-label', text: t('Pick a date') });
    this.input = field.createEl('input', { cls: 'pdlh-input', attr: { type: 'date', 'aria-label': t('Pick a date') } });
    this.input.value = this.value;
    this.input.oninput = () => { this.value = this.input.value; };
    this.input.onkeydown = (event) => {
      if (event.key === 'Enter') { event.preventDefault(); this.submit(); }
    };

    const foot = this.contentEl.createDiv({ cls: 'pdlh-form-foot' });
    foot.createSpan({ cls: 'pdlh-form-hint', text: t('Enter saves · Esc closes') });
    const actions = foot.createDiv({ cls: 'pdlh-form-actions' });
    const today = actions.createEl('button', { cls: 'pdlh-ghost-btn', text: t('Today') });
    today.onclick = () => { this.value = isoDate(); this.submit(); };
    this.submitButton = actions.createEl('button', { cls: 'pdlh-primary', text: t('Go') });
    this.submitButton.onclick = () => this.submit();

    setTimeout(() => this.input?.focus?.(), 0);
  }

  submit() {
    const key = String(this.value || '').slice(0, 10);
    if (!key) return;
    this.close();
    this.onPick?.(key);
  }

  onClose() { this.contentEl.empty(); }
}
