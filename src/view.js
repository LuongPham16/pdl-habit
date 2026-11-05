import { ItemView, setIcon } from 'obsidian';
import { PERIODS, PERIOD_ORDER, PERIOD_ICONS, VIEW_TYPE, VIEWS, WEEKDAYS } from './constants.js';
import { addDays, isoDate, longDay, parseDate, plural, shortDay } from './dates.js';
import {
  bestCurrentStreak, completion, daySummary, dueHabits, isActiveHabit, isScheduled, isExpired,
  pickFocus, streakFor, weekCheckins, weekDone, weekOverview, weekProgress
} from './habits.js';
import { iconButton, metaChip } from './dom.js';
import { HabitModal } from './modals/habit.js';
import { CheckinModal } from './modals/checkin.js';
import { ConfirmModal } from './modals/confirm.js';
import { HabitDetailModal } from './modals/detail.js';

const FILTERS = [['all', 'All'], ...Object.entries(PERIODS)];

export class PDLHabitView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.mode = plugin.settings.defaultView;
    this.period = 'all';
    this.selectedDate = isoDate();
    this.calendarDate = new Date();
  }

  getViewType() { return VIEW_TYPE; }
  getDisplayText() { return 'PDL Habit'; }
  getIcon() { return 'sprout'; }
  async onOpen() { await this.refresh(); }

  async refresh() {
    this.habits = await this.plugin.scanHabits();
    this.render();
  }

  render() {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass('pdlh-view');
    const root = container.createDiv({ cls: 'pdlh-shell' });
    this.renderHeader(root);
    this.renderNav(root);
    const content = root.createDiv({ cls: 'pdlh-content' });
    const views = {
      today: () => this.renderToday(content),
      habits: () => this.renderHabits(content),
      calendar: () => this.renderCalendar(content),
      insights: () => this.renderInsights(content),
      archive: () => this.renderArchive(content)
    };
    (views[this.mode] || views.today)();
  }

  renderHeader(root) {
    const header = root.createDiv({ cls: 'pdlh-header' });
    const identity = header.createDiv({ cls: 'pdlh-identity' });
    setIcon(identity.createSpan({ cls: 'pdlh-mark' }), 'sprout');
    const text = identity.createDiv();
    text.createEl('h1', { text: 'PDL Habit' });
    text.createSpan({ text: 'Small actions, visible progress' });
    const actions = header.createDiv({ cls: 'pdlh-header-actions' });
    const add = actions.createEl('button', { cls: 'pdlh-primary' });
    setIcon(add.createSpan(), 'plus');
    add.createSpan({ text: 'New habit' });
    add.onclick = () => new HabitModal(this.app, this.plugin).open();
  }

  renderNav(root) {
    const bar = root.createDiv({ cls: 'pdlh-nav' });
    const tabs = bar.createDiv({ cls: 'pdlh-tabs' });
    VIEWS.forEach((view) => {
      const active = this.mode === view.id;
      const button = tabs.createEl('button', { cls: active ? 'is-active' : '', attr: active ? { 'aria-current': 'page' } : {} });
      setIcon(button.createSpan(), view.icon);
      button.createSpan({ text: view.label });
      button.onclick = () => { this.mode = view.id; this.render(); };
    });
  }

  activeHabits() { return this.habits.filter(isActiveHabit); }
  dueHabits(key) { return dueHabits(this.activeHabits(), key); }

  /* ------------------------------------------------------------------ Today */

  renderToday(parent) {
    const key = this.selectedDate;
    const day = daySummary(this.activeHabits(), key);
    const page = parent.createDiv({ cls: 'pdlh-t-day' });
    this.renderDayHead(page, key, day);
    this.renderWeekStrip(page, key);
    if (!day.total) return this.renderDayEmpty(page, key);
    this.renderHero(page, key, day);
    this.renderPlan(page, key);
  }

  renderDayHead(page, key, day) {
    const head = page.createDiv({ cls: 'pdlh-day-head' });
    const title = head.createDiv({ cls: 'pdlh-day-title' });
    const isToday = key === isoDate();
    title.createEl('span', { cls: 'pdlh-eyebrow', text: isToday ? 'Today' : shortDay(key) });
    title.createEl('h2', { text: longDay(key) });
    title.createEl('p', {
      cls: 'pdlh-day-sub',
      text: day.total
        ? `${day.done} of ${plural(day.total, 'habit')} done${day.skipped ? ` · ${day.skipped} planned rest` : ''}`
        : 'No habits scheduled for this day.'
    });

    const controls = head.createDiv({ cls: 'pdlh-day-controls' });
    const segments = controls.createDiv({ cls: 'pdlh-segments', attr: { role: 'group', 'aria-label': 'Filter by time of day' } });
    FILTERS.forEach(([id, label]) => {
      const button = segments.createEl('button', {
        cls: this.period === id ? 'is-active' : '',
        text: label,
        attr: { 'aria-pressed': String(this.period === id) }
      });
      button.onclick = () => { this.period = id; this.render(); };
    });

    const nav = controls.createDiv({ cls: 'pdlh-date-nav' });
    const prev = iconButton(nav, 'chevron-left', 'Previous day');
    prev.onclick = () => { this.selectedDate = addDays(key, -1); this.render(); };
    const today = nav.createEl('button', {
      cls: `pdlh-today-btn ${isToday ? 'is-current' : ''}`.trim(),
      text: 'Today',
      attr: { 'aria-label': 'Jump to today' }
    });
    today.onclick = () => { this.selectedDate = isoDate(); this.render(); };
    const next = iconButton(nav, 'chevron-right', 'Next day');
    next.onclick = () => { this.selectedDate = addDays(key, 1); this.render(); };
  }

  renderWeekStrip(page, key) {
    const week = weekOverview(this.activeHabits(), key, this.plugin.settings.weekStartsOn);
    const strip = page.createDiv({ cls: 'pdlh-week', attr: { role: 'group', 'aria-label': 'This week' } });
    week.forEach((day) => {
      const button = strip.createEl('button', {
        cls: [
          'pdlh-week-day',
          day.isToday ? 'is-today' : '',
          day.isSelected ? 'is-selected' : '',
          day.isFuture ? 'is-future' : '',
          day.total && day.done === day.total ? 'is-complete' : ''
        ].filter(Boolean).join(' '),
        attr: {
          'aria-label': `${longDay(day.key)}, ${day.done} of ${day.total} complete`,
          'aria-pressed': String(day.isSelected),
          title: `${shortDay(day.key)} · ${day.done}/${day.total}`
        }
      });
      button.createSpan({ cls: 'pdlh-week-wd', text: WEEKDAYS[day.day].slice(0, 2) });
      button.createSpan({ cls: 'pdlh-week-num', text: String(day.date) });
      const bar = button.createSpan({ cls: 'pdlh-week-bar' });
      bar.createSpan({ cls: 'pdlh-week-fill' }).style.width = `${Math.round(day.ratio * 100)}%`;
      button.onclick = () => { this.selectedDate = day.key; this.mode = 'today'; this.render(); };
    });
  }

  renderHero(page, key, day) {
    const hero = page.createDiv({ cls: 'pdlh-hero' });

    const ring = hero.createDiv({ cls: 'pdlh-hero-ring', attr: { role: 'img', 'aria-label': `${day.percent} percent complete` } });
    ring.style.setProperty('--progress', `${day.percent}%`);
    ring.createEl('strong', { text: `${day.done}/${day.total}` });
    ring.createSpan({ text: day.done === day.total ? 'complete' : 'done' });

    const copy = hero.createDiv({ cls: 'pdlh-hero-copy' });
    let headline = 'Start with one small win';
    let line = `${plural(day.total, 'habit')} planned. Progress matters more than perfection.`;
    if (day.done === day.total) {
      headline = 'Day complete';
      line = `All ${plural(day.total, 'habit')} checked off. Rest is part of the plan.`;
    } else if (day.done > 0) {
      headline = 'Keep the rhythm';
      line = `${plural(day.remaining, 'habit')} left today. You are already ${day.percent}% through.`;
    }
    copy.createEl('h3', { text: headline });
    copy.createEl('p', { text: line });

    const focus = pickFocus(this.activeHabits(), key);
    if (focus) {
      const row = copy.createDiv({ cls: 'pdlh-focus' });
      row.createSpan({ cls: 'pdlh-focus-label', text: 'Next up' });
      const button = row.createEl('button', { cls: 'pdlh-focus-habit', attr: { 'aria-label': `Check in ${focus.title}` } });
      button.style.setProperty('--habit-color', focus.color);
      const icon = button.createSpan({ cls: 'pdlh-focus-icon' });
      setIcon(icon, focus.icon || 'sprout');
      const text = button.createSpan({ cls: 'pdlh-focus-text' });
      text.createEl('strong', { text: focus.title });
      text.createSpan({ text: `${PERIODS[focus.period]} · ${this.plugin.scheduleLabel(focus)}` });
      button.createSpan({ cls: 'pdlh-focus-cta', text: 'Check in' });
      button.onclick = () => this.quickCheck(focus, key);
    }

    const stats = hero.createDiv({ cls: 'pdlh-hero-stats' });
    const streak = bestCurrentStreak(this.activeHabits(), key);
    const perfect = weekDone(this.activeHabits(), key, this.plugin.settings.weekStartsOn);
    const checkins = weekCheckins(this.activeHabits(), key, this.plugin.settings.weekStartsOn);
    [
      [String(streak), 'day streak'],
      [`${perfect}/7`, 'perfect days'],
      [String(checkins), 'this week']
    ].forEach(([value, label]) => {
      const cell = stats.createDiv();
      cell.createEl('strong', { text: value });
      cell.createSpan({ text: label });
    });
  }

  renderPlan(page, key) {
    const due = this.dueHabits(key);
    const filtered = this.period === 'all' ? due : due.filter((habit) => habit.period === this.period);
    const plan = page.createDiv({ cls: 'pdlh-plan' });
    const head = plan.createDiv({ cls: 'pdlh-plan-head' });
    head.createEl('h3', { text: 'Plan' });
    head.createSpan({
      cls: 'pdlh-plan-count',
      text: this.period === 'all' ? plural(due.length, 'habit') : `${filtered.length} of ${plural(due.length, 'habit')}`
    });

    if (!filtered.length) {
      const empty = plan.createDiv({ cls: 'pdlh-plan-empty' });
      empty.createEl('p', { text: `Nothing scheduled in the ${PERIODS[this.period]?.toLowerCase() || 'selected'} block today.` });
      const showAll = empty.createEl('button', { cls: 'pdlh-link-btn', text: 'Show the whole day' });
      showAll.onclick = () => { this.period = 'all'; this.render(); };
      return;
    }

    PERIOD_ORDER.forEach((period) => {
      const items = filtered.filter((habit) => habit.period === period);
      if (!items.length) return;
      this.renderGroup(plan, period, items, key);
    });
  }

  renderGroup(plan, period, items, key) {
    const done = items.filter((habit) => completion(habit, key).done).length;
    const group = plan.createDiv({ cls: 'pdlh-group' });
    const head = group.createDiv({ cls: `pdlh-group-head ${done === items.length ? 'is-complete' : ''}`.trim() });
    const icon = head.createSpan({ cls: 'pdlh-group-icon' });
    setIcon(icon, PERIOD_ICONS[period] || 'circle');
    head.createEl('h4', { text: PERIODS[period] });
    const count = head.createSpan({ cls: 'pdlh-group-count' });
    if (done === items.length) setIcon(count.createSpan({ cls: 'pdlh-group-check' }), 'check');
    count.createSpan({ text: `${done}/${items.length}` });
    items.forEach((habit) => this.renderHabitRow(group, habit, key));
  }

  renderHabitRow(group, habit, key) {
    const state = completion(habit, key);
    const streak = streakFor(habit, key);
    const week = weekProgress(habit, key, this.plugin.settings.weekStartsOn);
    const target = habit.frequency === 'weekly' ? week.target : Math.max(1, habit.target);
    const value = habit.frequency === 'weekly' ? week.count : state.value;

    const row = group.createDiv({
      cls: `pdlh-row ${state.done ? 'is-done' : ''} ${state.skipped ? 'is-skipped' : ''}`.replace(/\s+/g, ' ').trim()
    });
    row.style.setProperty('--habit-color', habit.color);

    const check = row.createEl('button', {
      cls: 'pdlh-row-check',
      attr: {
        'aria-label': state.done ? `Edit check-in for ${habit.title}` : `Complete ${habit.title}`,
        'aria-pressed': String(state.done)
      }
    });
    setIcon(check, state.skipped ? 'minus' : state.done ? 'check' : habit.icon || 'sprout');
    check.onclick = () => this.quickCheck(habit, key, state);

    const body = row.createEl('button', { cls: 'pdlh-row-body', attr: { 'aria-label': `Open ${habit.title} details` } });
    body.createSpan({ cls: 'pdlh-row-title', text: habit.title });
    const meta = body.createSpan({ cls: 'pdlh-row-meta' });
    metaChip(meta, 'repeat', this.plugin.scheduleLabel(habit));
    if (streak.current > 0) metaChip(meta, 'flame', String(streak.current), 'is-streak');
    if (state.skipped) metaChip(meta, 'bed', 'Planned rest', 'is-rest');
    else if (habit.direction === 'quit') metaChip(meta, 'gauge', `Limit ${target} ${habit.unit}`);
    else metaChip(meta, 'target', habit.frequency === 'weekly' ? `${value}/${target} this week` : `${value}/${target} ${habit.unit}`);
    body.onclick = () => new HabitDetailModal(this.app, this.plugin, habit).open();

    const trail = row.createDiv({ cls: 'pdlh-row-trail' });
    if (habit.direction === 'build' && target > 1 && target <= 8 && !state.skipped) {
      const dots = trail.createDiv({ cls: 'pdlh-dots', attr: { 'aria-hidden': 'true' } });
      for (let index = 0; index < target; index += 1) dots.createSpan({ cls: index < value ? 'is-on' : '' });
    }
    const note = iconButton(trail, 'message-square-text', `Notes for ${habit.title}`);
    note.onclick = () => new CheckinModal(this.app, this.plugin, habit, key).open();
  }

  /** Circle tap: single-target habits toggle straight away, richer ones open the sheet. */
  async quickCheck(habit, key, state = null) {
    const current = state || completion(habit, key);
    if (current.done || current.skipped) return new CheckinModal(this.app, this.plugin, habit, key).open();
    const single = habit.target === 1 && habit.frequency !== 'weekly';
    if (single && habit.direction === 'build') return this.plugin.checkIn(habit, key, 1, '');
    return new CheckinModal(this.app, this.plugin, habit, key).open();
  }

  renderDayEmpty(page, key) {
    const empty = page.createDiv({ cls: 'pdlh-day-empty' });
    const mark = empty.createSpan({ cls: 'pdlh-day-empty-mark' });
    setIcon(mark, 'calendar-check');
    empty.createEl('h3', { text: key === isoDate() ? 'A clear day' : 'Nothing scheduled' });
    empty.createEl('p', { text: 'No habits are due here. Add one, or review another day while the day stays light.' });
    const actions = empty.createDiv({ cls: 'pdlh-day-empty-actions' });
    const add = actions.createEl('button', { cls: 'pdlh-primary' });
    setIcon(add.createSpan(), 'plus');
    add.createSpan({ text: 'New habit' });
    add.onclick = () => new HabitModal(this.app, this.plugin).open();
    if (key !== isoDate()) {
      const back = actions.createEl('button', { cls: 'pdlh-ghost-btn', text: 'Back to today' });
      back.onclick = () => { this.selectedDate = isoDate(); this.render(); };
    }
  }

  /* ----------------------------------------------------------------- Habits */

  renderHabits(parent) {
    const habits = this.activeHabits();
    const tools = parent.createDiv({ cls: 'pdlh-section-title' });
    const title = tools.createDiv();
    title.createEl('h2', { text: 'All habits' });
    title.createEl('p', { text: `${plural(habits.length, 'active habit')} across your routines` });
    const wrap = parent.createDiv({ cls: 'pdlh-habits-table-wrap' });
    if (!habits.length) return this.renderEmpty(wrap, 'Create your first habit', 'sprout');
    const keys = dateRangeFor(isoDate());
    const table = wrap.createDiv({ cls: 'pdlh-habits-table' });
    const header = table.createDiv({ cls: 'pdlh-habits-grid pdlh-habits-header' });
    header.createSpan({ text: 'Habit' });
    header.createSpan({ text: 'Schedule' });
    const daysHead = header.createDiv({ cls: 'pdlh-seven-days' });
    keys.forEach((key) => {
      const date = parseDate(key);
      const day = daysHead.createDiv({ cls: key === isoDate() ? 'is-today' : '' });
      day.createSpan({ text: WEEKDAYS[date.getDay()].slice(0, 2) });
      day.createEl('strong', { text: String(date.getDate()) });
    });
    header.createSpan({ text: 'Streak' });
    header.createSpan({ text: 'Actions' });

    habits.forEach((habit) => {
      const stats = this.plugin.statsFor(habit, 30);
      const row = table.createDiv({
        cls: `pdlh-habits-grid pdlh-manage-row ${habit.archived ? 'is-archived' : ''}`.trim(),
        attr: { role: 'button', tabindex: '0', 'aria-label': `View details for ${habit.title}` }
      });
      row.style.setProperty('--habit-color', habit.color);
      const open = () => new HabitDetailModal(this.app, this.plugin, habit).open();
      row.onclick = open;
      row.onkeydown = (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); } };

      const identity = row.createDiv({ cls: 'pdlh-manage-identity' });
      setIcon(identity.createSpan({ cls: 'pdlh-manage-icon' }), habit.icon || 'sprout');
      const copy = identity.createDiv();
      copy.createEl('strong', { text: habit.title });
      copy.createSpan({ text: `${habit.category} · ${PERIODS[habit.period]}` });

      const schedule = row.createDiv({ cls: 'pdlh-manage-schedule' });
      schedule.createEl('strong', { text: this.plugin.scheduleLabel(habit) });
      schedule.createSpan({ text: `${stats.rate}% in 30 days` });

      const days = row.createDiv({ cls: 'pdlh-seven-days pdlh-seven-checkins' });
      keys.forEach((key) => {
        const state = completion(habit, key);
        const scheduled = isScheduled(habit, key);
        const button = days.createEl('button', {
          cls: `${state.done ? 'is-done' : ''} ${state.skipped ? 'is-skipped' : ''} ${!scheduled ? 'is-off' : ''}`.replace(/\s+/g, ' ').trim(),
          attr: { 'aria-label': `${habit.title}, ${key}`, title: `${key}: ${state.skipped ? 'Planned rest' : state.done ? `${state.value} ${habit.unit}` : scheduled ? 'Not completed' : 'Not scheduled'}` }
        });
        setIcon(button, state.skipped ? 'minus' : state.done ? 'check' : scheduled ? 'circle' : 'x');
        button.onclick = (event) => { event.stopPropagation(); if (!scheduled) return; new CheckinModal(this.app, this.plugin, habit, key).open(); };
      });

      const streak = row.createDiv({ cls: 'pdlh-manage-streak' });
      setIcon(streak.createSpan(), 'flame');
      streak.createEl('strong', { text: String(stats.streak.current) });
      streak.createSpan({ text: `Best ${stats.streak.best}` });

      const actions = row.createDiv({ cls: 'pdlh-manage-actions' });
      const edit = iconButton(actions, 'pencil', `Edit ${habit.title}`);
      edit.onclick = (event) => { event.stopPropagation(); new HabitModal(this.app, this.plugin, habit).open(); };
      const archive = iconButton(actions, 'archive', `Archive ${habit.title}`);
      archive.onclick = async (event) => { event.stopPropagation(); await this.plugin.setArchived(habit, true); };
      const remove = iconButton(actions, 'trash-2', `Delete ${habit.title}`, 'is-danger');
      remove.onclick = (event) => {
        event.stopPropagation();
        new ConfirmModal(this.app, 'Delete habit?', `“${habit.title}” and its check-in history will be moved to Trash.`, () => this.plugin.deleteHabit(habit)).open();
      };
    });
  }

  /* --------------------------------------------------------------- Calendar */

  renderCalendar(parent) {
    const date = this.calendarDate;
    const year = date.getFullYear();
    const month = date.getMonth();
    const head = parent.createDiv({ cls: 'pdlh-calendar-head' });
    head.createEl('h2', { text: date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) });
    const nav = head.createDiv();
    const prev = iconButton(nav, 'chevron-left', 'Previous month');
    prev.onclick = () => { this.calendarDate = new Date(year, month - 1, 1); this.render(); };
    const now = nav.createEl('button', { text: 'Today' });
    now.onclick = () => { this.calendarDate = new Date(); this.render(); };
    const next = iconButton(nav, 'chevron-right', 'Next month');
    next.onclick = () => { this.calendarDate = new Date(year, month + 1, 1); this.render(); };

    const grid = parent.createDiv({ cls: 'pdlh-calendar' });
    const week = this.plugin.settings.weekStartsOn;
    for (let i = 0; i < 7; i += 1) grid.createDiv({ cls: 'pdlh-weekday', text: WEEKDAYS[(i + week) % 7] });
    const first = new Date(year, month, 1);
    const start = addDays(first, -((first.getDay() - week + 7) % 7));
    dateRangeFrom(start, 42).forEach((key) => {
      const day = parseDate(key);
      const due = this.dueHabits(key);
      const done = due.filter((habit) => completion(habit, key).done).length;
      const cell = grid.createEl('button', {
        cls: `pdlh-calendar-day ${day.getMonth() !== month ? 'is-outside' : ''} ${key === isoDate() ? 'is-today' : ''}`.replace(/\s+/g, ' ').trim(),
        attr: { 'aria-label': `${key}, ${done} of ${due.length} complete` }
      });
      cell.createSpan({ text: String(day.getDate()) });
      const ratio = due.length ? done / due.length : 0;
      const meter = cell.createDiv({ cls: 'pdlh-day-meter' });
      meter.createSpan().style.width = `${ratio * 100}%`;
      if (due.length) cell.createEl('small', { text: `${done}/${due.length}` });
      cell.onclick = () => { this.selectedDate = key; this.mode = 'today'; this.render(); };
    });
  }

  /* --------------------------------------------------------------- Insights */

  renderInsights(parent) {
    const habits = this.activeHabits();
    const stats = habits.map((habit) => ({ habit, ...this.plugin.statsFor(habit, 30) }));
    const totalDue = stats.reduce((sum, item) => sum + item.due, 0);
    const totalDone = stats.reduce((sum, item) => sum + item.done, 0);
    const best = [...stats].sort((a, b) => b.rate - a.rate)[0];

    const head = parent.createDiv({ cls: 'pdlh-section-title' });
    const title = head.createDiv();
    title.createEl('h2', { text: 'Insights' });
    title.createEl('p', { text: 'A calm view of consistency, not a scorecard of worth.' });

    const kpis = parent.createDiv({ cls: 'pdlh-kpis' });
    [
      [`${totalDue ? Math.round(totalDone / totalDue * 100) : 0}%`, 'Completion, 30 days', 'circle-check-big'],
      [stats.reduce((sum, item) => sum + item.streak.current, 0), 'Combined streak', 'flame'],
      [best?.habit.title || 'No data', 'Most consistent', 'trophy'],
      [stats.reduce((sum, item) => sum + Object.values(item.habit.history).filter((entry) => entry?.status === 'skip').length, 0), 'Planned rest days', 'bed']
    ].forEach(([value, label, icon]) => {
      const card = kpis.createDiv({ cls: 'pdlh-kpi' });
      setIcon(card.createSpan(), icon);
      const text = card.createDiv();
      text.createEl('strong', { text: String(value) });
      text.createSpan({ text: label });
    });

    const panel = parent.createDiv({ cls: 'pdlh-insight-panel' });
    panel.createEl('h3', { text: 'Last 30 days' });
    if (!stats.length) return this.renderEmpty(panel, 'No habit data yet', 'chart-no-axes-combined');
    stats.sort((a, b) => b.rate - a.rate).forEach((item) => {
      const row = panel.createDiv({ cls: 'pdlh-insight-row' });
      const name = row.createDiv();
      name.createSpan({ cls: 'pdlh-color-dot' }).style.background = item.habit.color;
      name.createEl('strong', { text: item.habit.title });
      const bar = row.createDiv({ cls: 'pdlh-insight-bar' });
      const fill = bar.createSpan();
      fill.style.width = `${item.rate}%`;
      fill.style.background = item.habit.color;
      row.createEl('b', { text: `${item.rate}%` });
    });

    const notes = parent.createDiv({ cls: 'pdlh-notes-panel' });
    notes.createEl('h3', { text: 'Recent reflections' });
    const entries = habits
      .flatMap((habit) => Object.entries(habit.history)
        .filter(([, entry]) => typeof entry === 'object' && entry.note)
        .map(([key, entry]) => ({ habit, key, note: entry.note })))
      .sort((a, b) => b.key.localeCompare(a.key))
      .slice(0, 8);
    if (!entries.length) notes.createEl('p', { cls: 'pdlh-muted', text: 'Check-in notes will appear here.' });
    entries.forEach((entry) => {
      const item = notes.createDiv({ cls: 'pdlh-note' });
      item.createEl('strong', { text: entry.habit.title });
      item.createSpan({ text: entry.key });
      item.createEl('p', { text: entry.note });
    });
  }

  /* ---------------------------------------------------------------- Archive */

  renderArchive(parent) {
    const habits = this.habits.filter((habit) => habit.archived || isExpired(habit));
    const head = parent.createDiv({ cls: 'pdlh-section-title' });
    const title = head.createDiv();
    title.createEl('h2', { text: 'Archive' });
    title.createEl('p', { text: `${plural(habits.length, 'habit')} no longer shown in Today or Habits` });
    const list = parent.createDiv({ cls: 'pdlh-archive-list' });
    if (!habits.length) return this.renderEmpty(list, 'No archived habits', 'archive');

    habits.sort((a, b) => a.title.localeCompare(b.title)).forEach((habit) => {
      const stats = this.plugin.statsFor(habit, 30);
      const row = list.createDiv({ cls: 'pdlh-archive-row', attr: { role: 'button', tabindex: '0', 'aria-label': `View details for ${habit.title}` } });
      row.style.setProperty('--habit-color', habit.color);
      setIcon(row.createSpan({ cls: 'pdlh-manage-icon' }), habit.icon || 'sprout');
      const copy = row.createDiv({ cls: 'pdlh-archive-copy' });
      copy.createEl('strong', { text: habit.title });
      copy.createSpan({ text: isExpired(habit) ? `Expired ${habit.endDate}` : 'Archived manually' });
      const meta = row.createDiv({ cls: 'pdlh-archive-meta' });
      meta.createEl('strong', { text: `${stats.rate}%` });
      meta.createSpan({ text: 'Last 30 days' });
      const actions = row.createDiv({ cls: 'pdlh-manage-actions' });
      const restore = iconButton(actions, 'archive-restore', `Restore ${habit.title}`);
      restore.onclick = async (event) => { event.stopPropagation(); await this.plugin.setArchived(habit, false); };
      const remove = iconButton(actions, 'trash-2', `Delete ${habit.title}`, 'is-danger');
      remove.onclick = (event) => {
        event.stopPropagation();
        new ConfirmModal(this.app, 'Delete habit?', `“${habit.title}” and its check-in history will be moved to Trash.`, () => this.plugin.deleteHabit(habit)).open();
      };
      row.onclick = () => new HabitDetailModal(this.app, this.plugin, habit).open();
      row.onkeydown = (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); new HabitDetailModal(this.app, this.plugin, habit).open(); } };
    });
  }

  renderEmpty(parent, text, icon) {
    const empty = parent.createDiv({ cls: 'pdlh-empty' });
    setIcon(empty.createSpan(), icon);
    empty.createEl('h3', { text });
  }
}

/** Seven-day window ending today (Habits table). */
function dateRangeFor(end) {
  return Array.from({ length: 7 }, (_, index) => addDays(end, index - 6));
}

/** `count` consecutive ISO days starting at `start` (a string or Date). */
function dateRangeFrom(start, count) {
  const first = typeof start === 'string' ? start : isoDate(start);
  return Array.from({ length: count }, (_, index) => addDays(first, index));
}
