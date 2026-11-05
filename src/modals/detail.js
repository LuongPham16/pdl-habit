import { Modal, setIcon } from 'obsidian';
import { PERIODS } from '../constants.js';
import { addDays, dateRange, isoDate, parseDate } from '../dates.js';
import { completion, isActiveHabit } from '../habits.js';
import { iconButton } from '../dom.js';
import { CheckinModal } from './checkin.js';
import { ConfirmModal } from './confirm.js';
import { HabitModal } from './habit.js';

export class HabitDetailModal extends Modal {
  constructor(app, plugin, habit) {
    super(app); this.plugin = plugin; this.habit = habit;
  }

  onOpen() {
    const habit = this.habit;
    const el = this.contentEl;
    const stats = this.plugin.statsFor(habit, 30);
    this.modalEl.addClass('pdlh-detail-shell');
    el.addClass('pdlh-modal', 'pdlh-detail-modal');

    const head = el.createDiv({ cls: 'pdlh-detail-head' });
    const identity = head.createDiv();
    const detailIcon = identity.createSpan({ cls: 'pdlh-detail-icon' });
    detailIcon.style.background = habit.color;
    setIcon(detailIcon, habit.icon || 'sprout');
    const text = identity.createDiv();
    text.createEl('h2', { text: habit.title });
    text.createEl('p', { text: habit.description || 'No description yet.' });

    const actions = head.createDiv({ cls: 'pdlh-detail-actions' });
    const edit = iconButton(actions, 'pencil', 'Edit habit');
    edit.onclick = () => { this.close(); new HabitModal(this.app, this.plugin, habit).open(); };
    const archive = iconButton(actions, isActiveHabit(habit) ? 'archive' : 'archive-restore', isActiveHabit(habit) ? 'Archive habit' : 'Restore habit');
    archive.onclick = async () => { await this.plugin.setArchived(habit, isActiveHabit(habit)); this.close(); };
    const remove = iconButton(actions, 'trash-2', 'Delete habit', 'is-danger');
    remove.onclick = () => {
      this.close();
      new ConfirmModal(this.app, 'Delete habit?', `“${habit.title}” and its check-in history will be moved to Trash.`, () => this.plugin.deleteHabit(habit)).open();
    };

    const metrics = el.createDiv({ cls: 'pdlh-detail-metrics' });
    [[stats.streak.current, 'Current streak'], [stats.streak.best, 'Best streak'], [`${stats.rate}%`, 'Last 30 days']].forEach(([value, label]) => {
      const item = metrics.createDiv();
      item.createEl('strong', { text: String(value) });
      item.createSpan({ text: label });
    });

    const facts = el.createDiv({ cls: 'pdlh-detail-facts' });
    [
      ['Category', habit.category],
      ['Time', PERIODS[habit.period]],
      ['Schedule', this.plugin.scheduleLabel(habit)],
      ['Target', targetLabel(habit)],
      ['Direction', habit.direction === 'quit' ? 'Limit behavior' : 'Build habit'],
      ['Started', habit.startDate]
    ].forEach(([label, value]) => {
      const item = facts.createDiv();
      item.createSpan({ text: label });
      item.createEl('strong', { text: value });
    });

    if (habit.cue || habit.reward) {
      const loop = el.createDiv({ cls: 'pdlh-detail-loop' });
      if (habit.cue) {
        const item = loop.createDiv();
        setIcon(item.createSpan(), 'bell-ring');
        const copy = item.createDiv();
        copy.createSpan({ text: 'Cue' });
        copy.createEl('strong', { text: habit.cue });
      }
      if (habit.reward) {
        const item = loop.createDiv();
        setIcon(item.createSpan(), 'gift');
        const copy = item.createDiv();
        copy.createSpan({ text: 'Reward' });
        copy.createEl('strong', { text: habit.reward });
      }
    }

    el.createEl('h3', { cls: 'pdlh-detail-section-title', text: 'Last 28 days' });
    const heat = el.createDiv({ cls: 'pdlh-detail-heatmap' });
    dateRange(addDays(isoDate(), -27), 28).forEach((key) => {
      const state = completion(habit, key);
      const button = heat.createEl('button', {
        cls: `${state.done ? 'is-done' : ''} ${state.skipped ? 'is-skipped' : ''}`.trim(),
        attr: { title: `${key}: ${state.skipped ? 'planned rest' : `${state.value} ${habit.unit}`}`, 'aria-label': key }
      });
      button.style.setProperty('--habit-color', habit.color);
      button.createSpan({ text: String(parseDate(key).getDate()) });
      button.onclick = () => { this.close(); new CheckinModal(this.app, this.plugin, habit, key).open(); };
    });

    el.createEl('h3', { cls: 'pdlh-detail-section-title', text: 'Recent check-ins' });
    const history = el.createDiv({ cls: 'pdlh-detail-history' });
    const entries = Object.entries(habit.history).sort(([a], [b]) => b.localeCompare(a)).slice(0, 7);
    if (!entries.length) history.createEl('p', { cls: 'pdlh-muted', text: 'No check-ins yet.' });
    entries.forEach(([key, entry]) => {
      const row = history.createEl('button');
      const state = completion(habit, key);
      const mark = row.createSpan({ cls: `pdlh-history-mark ${state.done ? 'is-done' : ''}`.trim() });
      setIcon(mark, state.skipped ? 'minus' : state.done ? 'check' : 'circle');
      const copy = row.createDiv();
      copy.createEl('strong', { text: parseDate(key).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) });
      copy.createSpan({ text: state.skipped ? 'Planned rest' : `${state.value} ${habit.unit}${typeof entry === 'object' && entry.note ? ` · ${entry.note}` : ''}` });
      row.onclick = () => { this.close(); new CheckinModal(this.app, this.plugin, habit, key).open(); };
    });
  }

  onClose() { this.contentEl.empty(); }
}

/** Human label for the "Target" fact: binary habits have no amount. */
function targetLabel(habit) {
  const unit = habit.unit && habit.unit !== 'time' ? ` ${habit.unit}` : '';
  if (habit.frequency === 'weekly') return `${habit.target} times per week`;
  if (habit.direction === 'quit') return `max ${habit.target}${unit} per day`;
  if (Number(habit.target) === 1) return 'Did it (once)';
  return `${habit.target}${unit} per day`;
}
