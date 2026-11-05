# Changelog

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
