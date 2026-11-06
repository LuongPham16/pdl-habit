import { Modal, Notice } from 'obsidian';
import { DEFAULT_COLOR } from '../constants.js';
import { isoDate } from '../dates.js';
import { t } from '../i18n.js';

/** Fast path: type a name, press Enter, the habit exists with sensible defaults. */
export class QuickAddModal extends Modal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
    this.saving = false;
  }

  onOpen() {
    this.modalEl.addClass('pdlh-quickadd-shell');
    this.contentEl.addClass('pdlh-modal', 'pdlh-quickadd');

    const head = this.contentEl.createDiv({ cls: 'pdlh-form-head' });
    head.createEl('h2', { text: t('Quick add') });
    head.createEl('p', { cls: 'pdlh-form-sub', text: t('Daily, any time of day, one tap to check in.') });

    const body = this.contentEl.createDiv({ cls: 'pdlh-form' });
    const field = body.createDiv({ cls: 'pdlh-field' });
    field.createEl('span', { cls: 'pdlh-field-label', text: t('Habit name') });
    this.input = field.createEl('input', {
      cls: 'pdlh-name-input',
      attr: { type: 'text', placeholder: t('e.g. Read 20 pages'), 'aria-label': t('Habit name') }
    });
    this.input.onkeydown = (event) => {
      if (event.key === 'Enter') { event.preventDefault(); this.submit(); }
    };

    const foot = this.contentEl.createDiv({ cls: 'pdlh-form-foot' });
    foot.createSpan({ cls: 'pdlh-form-hint', text: t('Enter saves · Esc closes') });
    const actions = foot.createDiv({ cls: 'pdlh-form-actions' });
    const cancel = actions.createEl('button', { cls: 'pdlh-ghost-btn', text: t('Cancel') });
    cancel.onclick = () => this.close();
    this.submitButton = actions.createEl('button', { cls: 'pdlh-primary', text: t('Create habit') });
    this.submitButton.onclick = () => this.submit();
    this.submitButton.disabled = true;

    this.input.oninput = () => { this.submitButton.disabled = !this.input.value.trim(); };
    setTimeout(() => this.input?.focus?.(), 0);
  }

  async submit() {
    if (this.saving) return;
    const title = String(this.input?.value || '').trim();
    if (!title) return new Notice(t('Give the habit a name.'));
    this.saving = true;
    try {
      await this.plugin.saveHabit({
        title,
        description: '',
        category: 'Personal',
        period: 'anytime',
        time: '',
        direction: 'build',
        frequency: 'daily',
        days: [],
        target: 1,
        unit: 'time',
        icon: 'sprout',
        color: DEFAULT_COLOR,
        startDate: isoDate(),
        endDate: '',
        cue: '',
        reward: ''
      });
      this.close();
    } finally {
      this.saving = false;
    }
  }

  onClose() { this.contentEl.empty(); }
}
