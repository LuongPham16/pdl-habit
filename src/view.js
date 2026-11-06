import { ItemView, setIcon } from 'obsidian';
import { t, weekdayLabel, weekdayShort } from './i18n.js';
import { PERIODS, PERIOD_ORDER, PERIOD_ICONS, VIEW_IDS, VIEW_TYPE, VIEWS } from './constants.js';
import { addDays, isoDate, longDay, parseDate, plural, shortDay } from './dates.js';
import {
  bestCurrentStreak, completion, daySummary, dueHabits, filterHabits, groupHabitsByCategory,
  habitCategories, isActiveHabit, isExpired, isScheduled, monthSummary, pickFocus, sortHabits,
  SORT_MODES, monthProgress, streakFor, weekCheckins, weekDone, weekOverview, weekProgress, windowStats
} from './habits.js';
import { iconButton, metaChip, setHabitIcon } from './dom.js';
import { blockHead, card, emptyState, pageHead, segmented } from './ui.js';
import { HabitModal } from './modals/habit.js';
import { CheckinModal } from './modals/checkin.js';
import { HabitDetailModal } from './modals/detail.js';

/** Built per render so the labels follow the current language. */
const filterOptions = () => [['all', t('All')], ...Object.entries(PERIODS).map(([id, label]) => [id, t(label)])];
const scopeOptions = () => [['active', t('Active')], ['archived', t('Archived')]];

export class PDLHabitView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.mode = VIEW_IDS.includes(plugin.settings.defaultView) ? plugin.settings.defaultView : 'today';
    this.period = 'all';
    this.habitScope = 'active';
    this.habitQuery = '';
    this.habitCategory = 'all';
    this.habitSort = 'title';
    this.habitResults = null;
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
    this.habitResults = null;
    const root = container.createDiv({ cls: 'pdlh-shell' });
    this.renderHeader(root);
    this.renderNav(root);
    const content = root.createDiv({ cls: 'pdlh-content' });
    const views = {
      today: () => this.renderToday(content),
      habits: () => this.renderHabits(content),
      calendar: () => this.renderCalendar(content),
      insights: () => this.renderInsights(content)
    };
    (views[this.mode] || views.today)();
  }

  renderHeader(root) {
    const header = root.createDiv({ cls: 'pdlh-header' });
    const identity = header.createDiv({ cls: 'pdlh-identity' });
    setIcon(identity.createSpan({ cls: 'pdlh-mark' }), 'sprout');
    const text = identity.createDiv();
    text.createEl('h1', { text: 'PDL Habit' });
    text.createSpan({ text: t('Small actions, visible progress') });
    const actions = header.createDiv({ cls: 'pdlh-header-actions' });
    const add = actions.createEl('button', { cls: 'pdlh-primary' });
    setIcon(add.createSpan(), 'plus');
    add.createSpan({ text: t('New habit') });
    add.onclick = () => this.openHabitForm();
  }

  renderNav(root) {
    const bar = root.createDiv({ cls: 'pdlh-nav' });
    const tabs = bar.createDiv({ cls: 'pdlh-tabs' });
    VIEWS.forEach((view) => {
      const active = this.mode === view.id;
      const button = tabs.createEl('button', { cls: active ? 'is-active' : '', attr: active ? { 'aria-current': 'page' } : {} });
      setIcon(button.createSpan(), view.icon);
      button.createSpan({ text: t(view.label) });
      button.onclick = () => { this.mode = view.id; this.render(); };
    });
  }

  /* ---------------------------------------------------------------- shared */

  activeHabits() { return this.habits.filter(isActiveHabit); }
  archivedHabits() { return this.habits.filter((habit) => habit.archived || isExpired(habit)); }
  dueHabits(key) { return dueHabits(this.activeHabits(), key); }
  openDetail(habit) { new HabitDetailModal(this.app, this.plugin, habit).open(); }
  openCheckin(habit, key) { new CheckinModal(this.app, this.plugin, habit, key).open(); }
  openHabitForm(habit = null) { new HabitModal(this.app, this.plugin, habit).open(); }

  /** Small ‹ Today › control shared by Today and Calendar. */
  renderDateNav(parent, { isCurrent, onShift, onToday, label }) {
    const nav = parent.createDiv({ cls: 'pdlh-date-nav' });
    const prev = iconButton(nav, 'chevron-left', t('Previous {label}', { label }));
    prev.onclick = () => onShift(-1);
    const today = nav.createEl('button', {
      cls: `pdlh-today-btn ${isCurrent ? 'is-current' : ''}`.trim(),
      text: t('Today'),
      attr: { 'aria-label': t('Jump to today') }
    });
    today.onclick = onToday;
    const next = iconButton(nav, 'chevron-right', t('Next {label}', { label }));
    next.onclick = () => onShift(1);
    return nav;
  }

  /* ----------------------------------------------------------------- Today */

  renderToday(parent) {
    const key = this.selectedDate;
    const day = daySummary(this.activeHabits(), key);
    const page = parent.createDiv({ cls: 'pdlh-page' });
    pageHead(page, {
      eyebrow: key === isoDate() ? t('Today') : shortDay(key),
      title: longDay(key),
      sub: day.total
        ? [t('{done} of {n} done', { done: day.done, n: plural(day.total, 'habit') }), day.skipped ? t('{n} planned rest', { n: day.skipped }) : ''].filter(Boolean).join(' · ')
        : t('No habits scheduled for this day.'),
      tools: (tools) => {
        segmented(tools, filterOptions(), this.period, (id) => { this.period = id; this.render(); }, t('Filter by time of day'));
        this.renderDateNav(tools, {
          isCurrent: key === isoDate(),
          label: t('day'),
          onShift: (amount) => { this.selectedDate = addDays(key, amount); this.render(); },
          onToday: () => { this.selectedDate = isoDate(); this.render(); }
        });
      }
    });

    this.renderWeekStrip(page, key);
    if (!day.total) {
      emptyState(page, {
        icon: 'calendar-check',
        title: key === isoDate() ? t('A clear day') : t('Nothing scheduled'),
        body: t('No habits are due here. Add one, or review another day while the day stays light.'),
        actions: [
          { label: t('New habit'), icon: 'plus', primary: true, onClick: () => this.openHabitForm() },
          ...(key === isoDate() ? [] : [{ label: t('Back to today'), onClick: () => { this.selectedDate = isoDate(); this.render(); } }])
        ]
      });
      return;
    }
    this.renderHero(page, key, day);
    this.renderPlan(page, key);
  }

  renderWeekStrip(page, key) {
    const week = weekOverview(this.activeHabits(), key, this.plugin.settings.weekStartsOn);
    const strip = page.createDiv({ cls: 'pdlh-week', attr: { role: 'group', 'aria-label': t('This week') } });
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
      button.createSpan({ cls: 'pdlh-week-wd', text: weekdayShort(day.day) });
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
    ring.createSpan({ text: day.done === day.total ? t('complete') : t('done') });

    const copy = hero.createDiv({ cls: 'pdlh-hero-copy' });
    let headline = t('Start with one small win');
    let line = t('{n} planned. Progress matters more than perfection.', { n: plural(day.total, 'habit') });
    if (day.done === day.total) {
      headline = t('Day complete');
      line = t('All {n} checked off. Rest is part of the plan.', { n: plural(day.total, 'habit') });
    } else if (day.done > 0) {
      headline = t('Keep the rhythm');
      line = t('{n} left today. You are already {percent}% through.', { n: plural(day.remaining, 'habit'), percent: day.percent });
    }
    copy.createEl('h3', { text: headline });
    copy.createEl('p', { text: line });

    const focus = pickFocus(this.activeHabits(), key);
    if (focus) {
      const row = copy.createDiv({ cls: 'pdlh-focus' });
      row.createSpan({ cls: 'pdlh-focus-label', text: t('Next up') });
      const button = row.createEl('button', { cls: 'pdlh-focus-habit', attr: { 'aria-label': `Check in ${focus.title}` } });
      button.style.setProperty('--habit-color', focus.color);
      setHabitIcon(button.createSpan({ cls: 'pdlh-focus-icon' }), focus.icon);
      const text = button.createSpan({ cls: 'pdlh-focus-text' });
      text.createEl('strong', { text: focus.title });
      text.createSpan({ text: `${t(PERIODS[focus.period])} · ${this.plugin.scheduleLabel(focus)}` });
      button.createSpan({ cls: 'pdlh-focus-cta', text: t('Check in') });
      button.onclick = () => this.quickCheck(focus, key);
    }

    const stats = hero.createDiv({ cls: 'pdlh-hero-stats' });
    const streak = bestCurrentStreak(this.activeHabits(), key);
    const perfect = weekDone(this.activeHabits(), key, this.plugin.settings.weekStartsOn);
    const checkins = weekCheckins(this.activeHabits(), key, this.plugin.settings.weekStartsOn);
    [
      [String(streak), t('day streak')],
      [`${perfect}/7`, t('perfect days')],
      [String(checkins), t('this week')]
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
    blockHead(plan, t('Plan'), this.period === 'all' ? plural(due.length, 'habit') : `${filtered.length}/${due.length}`);

    if (!filtered.length) {
      const empty = plan.createDiv({ cls: 'pdlh-plan-empty' });
      empty.createEl('p', { text: t('Nothing scheduled in the {period} block today.', { period: t(PERIODS[this.period] || 'all').toLowerCase() }) });
      const showAll = empty.createEl('button', { cls: 'pdlh-link-btn', text: t('Show the whole day') });
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
    setIcon(head.createSpan({ cls: 'pdlh-group-icon' }), PERIOD_ICONS[period] || 'circle');
    head.createEl('h4', { text: t(PERIODS[period]) });
    const count = head.createSpan({ cls: 'pdlh-group-count' });
    if (done === items.length) setIcon(count.createSpan({ cls: 'pdlh-group-check' }), 'check');
    count.createSpan({ text: `${done}/${items.length}` });
    [...items].sort((a, b) => String(a.time || '99:99').localeCompare(String(b.time || '99:99')))
      .forEach((habit) => this.renderHabitRow(group, habit, key));
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
    setHabitIcon(check, state.skipped ? 'minus' : state.done ? 'check' : habit.icon);
    check.onclick = () => this.quickCheck(habit, key, state);

    const body = row.createEl('button', { cls: 'pdlh-row-body', attr: { 'aria-label': `Open ${habit.title} details` } });
    body.createSpan({ cls: 'pdlh-row-title', text: habit.title });
    const meta = body.createSpan({ cls: 'pdlh-row-meta' });
    metaChip(meta, 'repeat', this.plugin.scheduleLabel(habit));
    if (streak.current > 0) metaChip(meta, 'flame', String(streak.current), 'is-streak');
    // "Did it" habits are binary: the check circle already tells the story.
    const binary = habit.direction === 'build' && habit.frequency !== 'weekly' && target === 1;
    const unit = habit.unit && habit.unit !== 'time' ? ` ${habit.unit}` : '';
    if (state.skipped) metaChip(meta, 'bed', t('Planned rest'), 'is-rest');
    else if (habit.direction === 'quit') metaChip(meta, 'gauge', `Limit ${target}${unit || ' time'}`);
    else if (!binary) {
      const monthly = monthProgress(habit, key);
      metaChip(meta, 'target', habit.frequency === 'weekly'
        ? t('{value}/{target} this week', { value, target })
        : habit.frequency === 'monthly'
          ? t('{value}/{target} this month', { value: monthly.count, target: monthly.target })
          : `${value}/${target}${unit}`);
    }
    body.onclick = () => this.openDetail(habit);

    const trail = row.createDiv({ cls: 'pdlh-row-trail' });
    if (habit.direction === 'build' && target > 1 && target <= 8 && !state.skipped) {
      const dots = trail.createDiv({ cls: 'pdlh-dots', attr: { 'aria-hidden': 'true' } });
      for (let index = 0; index < target; index += 1) dots.createSpan({ cls: index < value ? 'is-on' : '' });
    }
    const note = iconButton(trail, 'message-square-text', `Notes for ${habit.title}`);
    note.onclick = () => this.openCheckin(habit, key);
  }

  /** Circle tap: single-target habits toggle straight away, richer ones open the sheet. */
  async quickCheck(habit, key, state = null) {
    const current = state || completion(habit, key);
    if (current.done || current.skipped) return this.openCheckin(habit, key);
    const single = habit.target === 1 && habit.frequency !== 'weekly';
    if (single && habit.direction === 'build') {
      const previous = this.plugin.snapshotCheckin(habit, key);
      await this.plugin.checkIn(habit, key, 1, '');
      this.plugin.offerUndo({ message: `${habit.title} checked in`, habit, key, previous });
      return;
    }
    return this.openCheckin(habit, key);
  }

  /* ---------------------------------------------------------------- Habits */

  renderHabits(parent) {
    const active = this.activeHabits();
    const archived = this.archivedHabits();
    const scope = this.habitScope;
    const pool = scope === 'archived' ? archived : active;
    const page = parent.createDiv({ cls: 'pdlh-page' });

    pageHead(page, {
      eyebrow: t('Habits'),
      title: scope === 'archived' ? t('Archive') : t('All habits'),
      sub: [
        plural(active.length, 'active habit'),
        archived.length ? `${archived.length} archived` : ''
      ].filter(Boolean).join(' · '),
      tools: (tools) => segmented(tools, scopeOptions(), scope, (id) => { this.habitScope = id; this.render(); }, t('Habit scope'))
    });

    if (!pool.length) {
      if (scope === 'archived') {
        emptyState(page, {
          icon: 'archive',
          title: t('Nothing archived yet'),
          body: t('Habits past their end date, or archived by hand, wait here. Restoring keeps their history.'),
          compact: true
        });
      } else {
        emptyState(page, {
          icon: 'sprout',
          title: t('No habits yet'),
          body: t('Start with one small action you can repeat tomorrow.'),
          actions: [{ label: t('New habit'), icon: 'plus', primary: true, onClick: () => this.openHabitForm() }]
        });
      }
      return;
    }

    this.renderHabitToolbar(page, pool);
    this.habitResults = page.createDiv({ cls: 'pdlh-results' });
    this.renderHabitResults();
  }

  /** Search + category filter + sort. Lives above the list and survives re-renders. */
  renderHabitToolbar(page, pool) {
    const toolbar = page.createDiv({ cls: 'pdlh-toolbar' });

    const search = toolbar.createDiv({ cls: 'pdlh-search' });
    setIcon(search.createSpan({ cls: 'pdlh-search-icon' }), 'search');
    const input = search.createEl('input', {
      attr: { type: 'search', placeholder: t('Search habits'), 'aria-label': t('Search habits'), spellcheck: 'false' }
    });
    input.value = this.habitQuery;
    const clear = search.createEl('button', { cls: `pdlh-search-clear ${this.habitQuery ? '' : 'is-hidden'}`.trim(), attr: { 'aria-label': 'Clear search' } });
    setIcon(clear, 'x');
    clear.onclick = () => {
      this.habitQuery = '';
      input.value = '';
      clear.addClass('is-hidden');
      this.renderHabitResults();
      input.focus();
    };
    input.oninput = () => {
      this.habitQuery = input.value;
      if (this.habitQuery) clear.removeClass('is-hidden');
      else clear.addClass('is-hidden');
      this.renderHabitResults();
    };

    const categories = habitCategories(pool);
    const categorySelect = toolbar.createEl('select', { cls: 'pdlh-select', attr: { 'aria-label': 'Filter by category' } });
    categorySelect.createEl('option', { value: 'all', text: t('All categories'), attr: this.habitCategory === 'all' ? { selected: 'selected' } : {} });
    categories.forEach((category) => categorySelect.createEl('option', {
      value: category,
      text: category,
      attr: this.habitCategory === category ? { selected: 'selected' } : {}
    }));
    if (this.habitCategory !== 'all' && !categories.includes(this.habitCategory)) this.habitCategory = 'all';
    categorySelect.value = this.habitCategory;
    categorySelect.onchange = () => { this.habitCategory = categorySelect.value; this.renderHabitResults(); };

    const sortSelect = toolbar.createEl('select', { cls: 'pdlh-select', attr: { 'aria-label': 'Sort habits' } });
    SORT_MODES.forEach(([value, label]) => sortSelect.createEl('option', {
      value,
      text: label,
      attr: this.habitSort === value ? { selected: 'selected' } : {}
    }));
    sortSelect.value = this.habitSort;
    // Grouping changes the card structure, so this one does a full render.
    sortSelect.onchange = () => { this.habitSort = sortSelect.value; this.render(); };
  }

  /** Renders the list body only, so typing in the search box never loses focus. */
  renderHabitResults() {
    const host = this.habitResults;
    if (!host) return;
    host.empty();

    const scope = this.habitScope;
    const pool = scope === 'archived' ? this.archivedHabits() : this.activeHabits();
    const filtered = filterHabits(pool, { query: this.habitQuery, category: this.habitCategory });
    const sorted = sortHabits(filtered, this.habitSort, (habit) => this.plugin.statsFor(habit, 30));
    const keys = lastSevenDays();

    blockHead(
      host,
      scope === 'archived' ? t('Archived') : t('All habits'),
      filtered.length === pool.length ? plural(pool.length, 'habit') : `${filtered.length}/${pool.length}`
    );

    if (!sorted.length) {
      emptyState(host, {
        icon: 'search',
        title: t('No habits match'),
        body: 'Try another word, or clear the filters to see everything again.',
        compact: true,
        actions: [{ label: t('Clear filters'), onClick: () => { this.habitQuery = ''; this.habitCategory = 'all'; this.render(); } }]
      });
      return;
    }

    const list = card(host, 'pdlh-list');
    const head = list.createDiv({ cls: 'pdlh-list-head' });
    head.createSpan({ cls: 'pdlh-list-col', text: t('Habit') });
    const headDays = head.createSpan({ cls: 'pdlh-list-days' });
    keys.forEach((key) => headDays.createSpan({
      cls: key === isoDate() ? 'is-today' : '',
      text: weekdayShort(parseDate(key).getDay())
    }));
    head.createSpan({ cls: 'pdlh-list-col is-streak', text: t('Streak') });
    head.createSpan({ cls: 'pdlh-list-chevron', attr: { 'aria-hidden': 'true' } });

    if (this.habitSort === 'category') {
      groupHabitsByCategory(sorted).forEach((group) => {
        const groupHead = list.createDiv({ cls: 'pdlh-list-group' });
        groupHead.createSpan({ cls: 'pdlh-list-group-name', text: group.category });
        groupHead.createSpan({ cls: 'pdlh-list-group-count', text: String(group.habits.length) });
        group.habits.forEach((habit) => this.renderHabitListRow(list, habit, keys, scope));
      });
    } else {
      sorted.forEach((habit) => this.renderHabitListRow(list, habit, keys, scope));
    }

    list.createEl('p', {
      cls: 'pdlh-list-foot',
      text: scope === 'archived'
        ? t('Open a habit to restore it, or delete it for good.')
        : t('Open a habit to edit it, archive it or see its history.')
    });
  }

  renderHabitListRow(list, habit, keys, scope) {
    const stats = this.plugin.statsFor(habit, 30);
    const streak = stats.streak;
    const row = list.createDiv({
      cls: `pdlh-list-row ${scope === 'archived' ? 'is-archived' : ''}`.trim(),
      attr: { role: 'button', tabindex: '0', 'aria-label': `Open ${habit.title}` }
    });
    row.style.setProperty('--habit-color', habit.color);
    row.onclick = () => this.openDetail(habit);
    row.onkeydown = (event) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); this.openDetail(habit); }
    };

    const identity = row.createDiv({ cls: 'pdlh-list-identity' });
    setHabitIcon(identity.createSpan({ cls: 'pdlh-list-icon' }), habit.icon);
    const copy = identity.createDiv({ cls: 'pdlh-list-copy' });
    copy.createEl('strong', { text: habit.title });
    copy.createSpan({
      cls: 'pdlh-list-meta',
      text: scope === 'archived'
        ? t(isExpired(habit) ? 'Expired {date}' : 'Archived by hand', { date: habit.endDate })
        : t('{schedule} · {period} · {rate}% in 30 days', {
          schedule: this.plugin.scheduleLabel(habit),
          period: t(PERIODS[habit.period]),
          rate: stats.rate
        })
    });

    const days = row.createDiv({ cls: 'pdlh-list-days' });
    keys.forEach((key) => {
      const state = completion(habit, key);
      const scheduled = isScheduled(habit, key);
      const button = days.createEl('button', {
        cls: [
          'pdlh-day-cell',
          scheduled && state.done ? 'is-done' : '',
          state.skipped ? 'is-skipped' : '',
          !scheduled ? 'is-off' : '',
          key === isoDate() ? 'is-today' : ''
        ].filter(Boolean).join(' '),
        attr: {
          'aria-label': `${habit.title}, ${key}`,
          title: `${shortDay(key)} · ${!scheduled ? t('not scheduled') : state.skipped ? t('Planned rest') : state.done ? `done (${state.value} ${habit.unit})` : 'not done yet'}`
        }
      });
      button.createSpan({ cls: 'pdlh-day-num', text: String(parseDate(key).getDate()) });
      button.onclick = (event) => {
        event.stopPropagation();
        if (!scheduled || scope === 'archived') return;
        this.openCheckin(habit, key);
      };
    });

    const streakEl = row.createDiv({ cls: `pdlh-list-streak ${streak.current ? '' : 'is-zero'}`.replace(/\s+/g, ' ').trim() });
    setIcon(streakEl.createSpan(), 'flame');
    streakEl.createSpan({ text: String(streak.current) });

    setIcon(row.createSpan({ cls: 'pdlh-list-chevron' }), 'chevron-right');
  }

  /* -------------------------------------------------------------- Calendar */

  renderCalendar(parent) {
    const date = this.calendarDate;
    const year = date.getFullYear();
    const month = date.getMonth();
    const summary = monthSummary(this.activeHabits(), year, month);
    const page = parent.createDiv({ cls: 'pdlh-page' });

    pageHead(page, {
      eyebrow: t('Calendar'),
      title: date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
      sub: summary.due
        ? t('{days} logged · {perfect} perfect · {rate}% complete', { days: plural(summary.logged, 'day'), perfect: summary.perfect, rate: summary.rate })
        : t('Nothing checked in yet this month.'),
      tools: (tools) => this.renderDateNav(tools, {
        isCurrent: year === new Date().getFullYear() && month === new Date().getMonth(),
        label: 'month',
        onShift: (amount) => { this.calendarDate = new Date(year, month + amount, 1); this.render(); },
        onToday: () => { this.calendarDate = new Date(); this.render(); }
      })
    });

    const cal = card(page, 'pdlh-cal');
    const weekStart = this.plugin.settings.weekStartsOn;
    const weekHead = cal.createDiv({ cls: 'pdlh-cal-week' });
    for (let index = 0; index < 7; index += 1) {
      weekHead.createSpan({ text: weekdayShort((index + weekStart) % 7) });
    }

    const grid = cal.createDiv({ cls: 'pdlh-cal-grid' });
    const first = new Date(year, month, 1);
    const start = addDays(first, -((first.getDay() - weekStart + 7) % 7));
    dateRangeFrom(start, 42).forEach((key) => {
      const day = parseDate(key);
      const due = this.dueHabits(key);
      const done = due.filter((habit) => completion(habit, key).done).length;
      const ratio = due.length ? done / due.length : 0;
      const isFuture = key > isoDate();
      const cell = grid.createEl('button', {
        cls: [
          'pdlh-cal-day',
          day.getMonth() !== month ? 'is-outside' : '',
          key === isoDate() ? 'is-today' : '',
          isFuture ? 'is-future' : '',
          due.length && done === due.length ? 'is-complete' : '',
          due.length ? '' : 'is-empty'
        ].filter(Boolean).join(' '),
        attr: { 'aria-label': `${longDay(key)}, ${isFuture ? t('upcoming') : `${done} of ${due.length} complete`}` }
      });
      cell.createSpan({ cls: 'pdlh-cal-num', text: String(day.getDate()) });
      if (due.length && !isFuture) {
        cell.createSpan({ cls: 'pdlh-cal-count', text: `${done}/${due.length}` });
        const meter = cell.createSpan({ cls: 'pdlh-cal-meter' });
        meter.createSpan({ cls: 'pdlh-cal-fill' }).style.width = `${Math.round(ratio * 100)}%`;
      }
      cell.onclick = () => { this.selectedDate = key; this.mode = 'today'; this.render(); };
    });

    cal.createEl('p', { cls: 'pdlh-cal-foot', text: t('Tap a day to open it in Today.') });
  }

  /* -------------------------------------------------------------- Insights */

  renderInsights(parent) {
    const habits = this.activeHabits();
    const stats = habits.map((habit) => ({ habit, ...this.plugin.statsFor(habit, 30) }));
    const window = windowStats(habits, 30);
    const page = parent.createDiv({ cls: 'pdlh-page' });

    pageHead(page, {
      eyebrow: t('Insights'),
      title: t('Last 30 days'),
      sub: t('Consistency, not a scorecard of worth.')
    });

    const statsRow = page.createDiv({ cls: 'pdlh-stats' });
    // Aggregate per habit so weekly targets count as weeks, not as seven dues.
    const totals = stats.reduce((sum, item) => ({ due: sum.due + item.due, done: sum.done + item.done }), { due: 0, done: 0 });
    const rate = totals.due ? Math.round((totals.done / totals.due) * 100) : 0;
    [
      [`${rate}%`, t('Completion'), 'circle-check-big', t('{done}/{total} check-ins', { done: totals.done, total: totals.due })],
      [String(window.perfect), t('Perfect days'), 'sparkles', t('of {n} days', { n: window.days })],
      [String(window.rests), t('Planned rest'), 'bed', t('streaks kept alive')]
    ].forEach(([value, label, icon, note]) => {
      const tile = statsRow.createDiv({ cls: 'pdlh-stat' });
      setIcon(tile.createSpan({ cls: 'pdlh-stat-icon' }), icon);
      const body = tile.createDiv({ cls: 'pdlh-stat-body' });
      body.createEl('strong', { text: value });
      body.createEl('span', { cls: 'pdlh-stat-label', text: label });
      body.createEl('span', { cls: 'pdlh-stat-note', text: note });
    });

    const bars = card(page, 'pdlh-bars');
    blockHead(bars, t('Per habit'), plural(habits.length, 'habit'));
    if (!habits.length) {
      emptyState(bars, {
        icon: 'chart-no-axes-combined',
        title: t('No habit data yet'),
        body: t('Add a habit and check in for a few days — the trend shows up here.'),
        compact: true
      });
    } else {
      [...stats].sort((a, b) => b.rate - a.rate).forEach((item) => {
        const row = bars.createDiv({ cls: 'pdlh-bar-row' });
        row.style.setProperty('--habit-color', item.habit.color);
        const name = row.createDiv({ cls: 'pdlh-bar-name' });
        name.createSpan({ cls: 'pdlh-bar-dot' });
        name.createEl('strong', { text: item.habit.title });
        name.createSpan({ cls: 'pdlh-bar-detail', text: `${item.done}/${item.due}` });
        const track = row.createDiv({ cls: 'pdlh-bar-track', attr: { 'aria-hidden': 'true' } });
        track.createSpan({ cls: 'pdlh-bar-fill' }).style.width = `${item.rate}%`;
        row.createEl('b', { text: `${item.rate}%` });
      });
    }

    const reflections = card(page, 'pdlh-reflections');
    const entries = habits
      .flatMap((habit) => Object.entries(habit.history)
        .filter(([, entry]) => typeof entry === 'object' && entry.note)
        .map(([key, entry]) => ({ habit, key, note: entry.note })))
      .sort((a, b) => b.key.localeCompare(a.key))
      .slice(0, 8);
    blockHead(reflections, t('Recent reflections'), entries.length ? plural(entries.length, 'note') : '');
    if (!entries.length) {
      reflections.createEl('p', { cls: 'pdlh-muted', text: 'Notes you add during a check-in show up here.' });
    } else {
      entries.forEach((entry) => {
        const item = reflections.createDiv({ cls: 'pdlh-reflection' });
        const top = item.createDiv({ cls: 'pdlh-reflection-top' });
        top.createEl('strong', { text: entry.habit.title });
        top.createSpan({ text: shortDay(entry.key) });
        item.createEl('p', { text: entry.note });
      });
    }
  }
}

/** Seven-day window ending today, oldest first. */
function lastSevenDays() {
  const today = isoDate();
  return Array.from({ length: 7 }, (_, index) => addDays(today, index - 6));
}

/** `count` consecutive ISO days starting at `start` (a string or Date). */
function dateRangeFrom(start, count) {
  const first = typeof start === 'string' ? start : isoDate(start);
  return Array.from({ length: count }, (_, index) => addDays(first, index));
}
