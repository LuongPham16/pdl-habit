import { Modal, setIcon } from 'obsidian';
import { PERIODS, WEEKDAYS } from '../constants.js';
import { addDays, isoDate, parseDate } from '../dates.js';
import { completion, isActiveHabit, isScheduled, monthSummary } from '../habits.js';
import { iconButton, setHabitIcon } from '../dom.js';
import { CheckinModal } from './checkin.js';
import { ConfirmModal } from './confirm.js';
import { HabitModal } from './habit.js';

const LEGEND = [
  ['is-done', 'Done'],
  ['is-partial', 'Partial'],
  ['is-missed', 'Missed'],
  ['is-rest', 'Rest'],
  ['is-today', 'Today']
];

export class HabitDetailModal extends Modal {
  constructor(app, plugin, habit) {
    super(app); this.plugin = plugin; this.habit = habit;
    this.monthDate = new Date(); this.monthHost = null;
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
    setHabitIcon(detailIcon, habit.icon);
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

    this.monthHost = el.createDiv({ cls: 'pdlh-detail-month' });
    this.monthHost.style.setProperty('--habit-color', habit.color);
    this.renderMonth();
  }

  /** One month at a time: navigation on the left, colour-coded days on the right. */
  renderMonth() {
    const host = this.monthHost;
    if (!host) return;
    host.empty();
    const habit = this.habit;
    const date = this.monthDate;
    const year = date.getFullYear();
    const month = date.getMonth();
    const summary = monthSummary([habit], year, month);

    const head = host.createDiv({ cls: 'pdlh-detail-month-head' });
    const title = head.createDiv({ cls: 'pdlh-detail-month-title' });
    title.createEl('h3', { text: date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) });
    title.createSpan({
      cls: 'pdlh-detail-month-meta',
      text: summary.due
        ? `${summary.done}/${summary.due} done · ${summary.perfect} perfect ${summary.perfect === 1 ? 'day' : 'days'}`
        : 'No scheduled days this month'
    });

    const nav = head.createDiv({ cls: 'pdlh-date-nav' });
    const prev = iconButton(nav, 'chevron-left', 'Previous month');
    prev.onclick = () => { this.monthDate = new Date(year, month - 1, 1); this.renderMonth(); };
    const today = nav.createEl('button', { cls: `pdlh-today-btn ${this.isCurrentMonth() ? 'is-current' : ''}`.trim(), text: 'Today', attr: { 'aria-label': 'Jump to this month' } });
    today.onclick = () => { this.monthDate = new Date(); this.renderMonth(); };
    const next = iconButton(nav, 'chevron-right', 'Next month');
    next.onclick = () => { this.monthDate = new Date(year, month + 1, 1); this.renderMonth(); };

    const grid = host.createDiv({ cls: 'pdlh-mini-cal' });
    const weekStart = this.plugin.settings.weekStartsOn;
    for (let index = 0; index < 7; index += 1) {
      grid.createDiv({ cls: 'pdlh-mini-cal-wd', text: WEEKDAYS[(index + weekStart) % 7].slice(0, 2) });
    }

    const todayKey = isoDate();
    const first = new Date(year, month, 1);
    const start = addDays(first, -((first.getDay() - weekStart + 7) % 7));
    for (let offset = 0; offset < 42; offset += 1) {
      const key = addDays(start, offset);
      const day = parseDate(key);
      const state = completion(habit, key);
      const scheduled = isScheduled(habit, key);
      const isFuture = key > todayKey;
      const inMonth = day.getMonth() === month;
      const classes = ['pdlh-mini-day'];
      if (!inMonth) classes.push('is-outside');
      if (key === todayKey) classes.push('is-today');
      // Days from the neighbouring months stay neutral; colours are for this month only.
      if (inMonth) {
        if (isFuture) classes.push('is-future');
        if (!scheduled) classes.push('is-off');
        else if (state.skipped) classes.push('is-rest');
        else if (state.done) classes.push('is-done');
        else if (state.ratio > 0) classes.push('is-partial');
        else if (key < todayKey) classes.push('is-missed');
      }

      const status = !inMonth
        ? 'outside this month'
        : !scheduled
          ? 'not scheduled'
          : state.skipped
            ? 'planned rest'
            : state.done
              ? `done${habit.unit && habit.unit !== 'time' ? ` · ${state.value} ${habit.unit}` : ''}`
              : state.ratio > 0
                ? `partial · ${state.value}`
                : isFuture ? 'upcoming' : 'missed';

      const cell = grid.createEl('button', {
        cls: classes.join(' '),
        attr: { 'aria-label': `${key}, ${status}`, title: `${key} · ${status}` }
      });
      cell.createSpan({ text: String(day.getDate()) });
      cell.onclick = () => {
        if (!scheduled) return;
        this.close();
        new CheckinModal(this.app, this.plugin, habit, key).open();
      };
    }

    const legend = host.createDiv({ cls: 'pdlh-mini-legend' });
    LEGEND.forEach(([state, label]) => {
      const item = legend.createSpan();
      item.createEl('i', { cls: state });
      item.createSpan({ text: label });
    });
  }

  isCurrentMonth() {
    const now = new Date();
    return this.monthDate.getFullYear() === now.getFullYear() && this.monthDate.getMonth() === now.getMonth();
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
