# Changelog

## 1.4.0 — one design language across the tabs

The other tabs now use the same frame as Today, and the parts that duplicated each
other are gone.

- **Archive is no longer a tab.** Archived and expired habits live behind an
  **Active / Archived** switch inside Habits. Saved settings pointing at the old
  Archive view fall back to Today.
- **Habits is a list, not a wide table.** The 930px table with a horizontal
  scrollbar became a responsive list: habit, its last seven days as tappable
  check-in cells, streak. Rows open the detail sheet.
- **Row action buttons removed.** Edit, archive and delete now live only in the
  habit detail sheet — one place to act, no button clutter in the list.
- **Insights slimmed down.** The "Most consistent" card is gone (the bar list is
  already sorted by rate), the remaining three cards lead with completion, and the
  completion rate now aggregates per habit, so a 3×/week habit counts as weeks
  instead of seven daily dues.
- **Calendar got a summary and a hint.** The header reports logged / perfect days
  and the month completion rate; future days no longer render rows of `0/n`; the
  footer explains that a tap opens the day in Today.
- **Shared page header everywhere** (eyebrow → title → one-line summary → controls),
  shared card surface, shared block heading, shared empty state.
- Softer seven-day cells, calmer list typography, dark-mode and 560px checks for
  every tab.

## 1.3.0 — Today redesign

A full rebuild of the Today tab. Same data, same notes, new reading order.

- **New layout**: date header → week strip → progress hero → plan. One column,
  no more half-empty two-column grid.
- **Week strip**: seven days with completion bars; click any day to jump there.
  Today is highlighted, completed days turn green.
- **Progress hero**: ring with `done/total`, a dynamic headline
  ("Start with one small win" / "Keep the rhythm" / "Day complete"), and a
  **Next up** pill that checks in the earliest unfinished habit in one tap.
- **Hero stats**: day streak, perfect days this week, check-ins this week.
- **Plan sections**: Morning / Afternoon / Evening / Anytime with icons, counts
  and a completion tick; empty periods disappear instead of leaving blank cards.
- **Habit rows**: colour-matched check target, schedule chip, streak flame,
  quantity progress (dots or "2/3 this week"), and a hover-revealed note button.
  Clicking the row title opens the habit detail.
- **Filter + date navigation** moved into the day header; the broken "AI" chip
  is now a proper "All".
- **Empty states**: compact "A clear day" card with a create-habit action, plus a
  filtered-empty message with a "Show the whole day" link.
- **Accessibility**: `aria-pressed` on check targets and filters, labelled icon
  buttons, visible focus rings, `prefers-reduced-motion` support.
- Repository rebuilt as a proper source project (`src/`, esbuild build script,
  unit tests, offline preview renderer).

## 1.2.0

- Archive tab, manual archive and automatic expiry from `end_date`.
- Today/Habits/Calendar/Insights only use active habits.
- Today empty-state pass, responsive tab bar, larger metadata type.

## 1.1.0

- 84 Lucide icons in seven groups, stored in frontmatter `icon`.
- Habit colour used across Today, the management table and detail modal.

## 1.0.0

- First release: Today, Habits, Calendar and Insights; flexible schedules,
  quantity targets, streaks, planned rest, heatmaps, notes, dark mode.
