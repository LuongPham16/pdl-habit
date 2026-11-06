# Changelog

## 1.11.0 - command palette shortcuts and starter habits

- **Quick add a habit** from the palette: type a name, press Enter, done (daily,
  any time of day, check-in type). No form.
- **Open a day** from the palette: pick any date and jump straight to it in Today.
- **Undo last check-in** from the palette: works after the toast has gone, because
  every check-in now remembers the previous frontmatter entry.
- **Five starter habits** for a brand new vault (drink water, walk 20 minutes,
  read 10 pages, workout 3x/week, sleep before 23:00). Buttons appear in the Today
  and Habits empty states, plus a palette command; they are only added when the
  vault has no habits yet.
- Starter habits are written without five separate "created" notices.

## 1.10.0 — Vietnamese interface and flexible schedules

- **Vietnamese UI.** A language setting (Auto / English / Tiếng Việt) now drives every
  label: tabs, page headers, the habit form, the check-in sheet, the detail sheet,
  insights, calendar, settings, reminders, toasts and notices. *Auto* follows the
  Obsidian interface language. About 200 strings have a Vietnamese translation;
  anything untranslated falls back to English.
- **Three new schedule types**, on top of daily / selected days / times per week:
  - **Times per month** — e.g. clean the house 4× a month,
  - **Every N days** — e.g. water the plants every 3 days, cut hair every 28 days
    (anchored to the habit's start date),
  - **A specific time** ("lúc 7:30") on top of the Morning / Afternoon / Evening /
    Afternoon bucket; Today sorts each group by that time.
- Monthly habits are counted as sessions (one check-in per day, target per month);
  the detail sheet reads their target as "4 lần mỗi tháng".
- Tests cover interval scheduling, monthly sessions and month progress.

## 1.9.1 — text encoding repair

- **Fixed a stray accent in the interface.** Several source files had been saved
  through a Windows-PowerShell pipe that decoded UTF-8 as cp1252 and wrote it back as
  UTF-8, so the middot separator came out with a spurious accent character in front
  of it, and Vietnamese text became mojibake. All affected files were repaired,
  byte-order marks removed, and the stylesheet's decorative comments normalised to
  plain ASCII.
- **A guard test now fails the build if that corruption comes back** — it scans
  `src/`, `docs/`, `tests/`, `scripts/`, `styles.css` and the root markdown files for
  double-encoded sequences and byte-order marks.
- No behaviour change: same UI, same data.

## 1.9.0 — any colour, many more icons

- **Colour is now a real picker, not a swatch row.** One round field opens the
  system colour picker with the hex code next to it, so every habit can have its own
  colour instead of choosing from eight.
- **The icon library grew from 84 to 171 icons in 10 groups** — wellness & mood,
  fitness & movement, food & drink, learning & focus, mind & mindfulness, work,
  home & life, people & pets, weather & nature, devices — with the same search box.
- **Missing glyphs fall back to the sprout** instead of an empty square, so an older
  Obsidian build that lacks a given Lucide icon still renders something sensible.
- The icon and colour controls update in place; picking an icon no longer re-renders
  the whole form (your typed name and schedule stay put).

## 1.8.0 — check-in sheet with a 0-based stepper

- **Count and Limit habits start at 0.** The amount field no longer pre-fills the
  target, so opening the sheet no longer means "already done"; you build the value
  up with **− / +** buttons (0–99, − disabled at zero, arrow keys still work).
- **Live hint under the counter**: `0 of 3 ly` → `Goal reached (3 ly)` for counted
  habits, and `Max 2 cái per day — stay under to keep the streak` for limits, which
  turns red and says how far over you are once you pass the cap.
- **Binary habits get a switch.** *Did it* and *times per week* habits showed a
  meaningless "Amount" row; they now offer **Done / Not done**, and *Save* is
  disabled when there is nothing to write.
- **Clear only appears when there is something to clear**, and the sheet header
  shows a readable date (`Fri, Nov 6`) instead of `2026-11-06`.
- The sheet is narrower (440px), keeps *Planned rest* and the note field, autofocuses
  the amount, and still offers **Undo** after saving.
- `isBinaryHabit()` and `clampStepper()` are pure helpers with tests.

## 1.7.0 — habit detail gets a real month calendar

- **The "Recent check-ins" list is gone.** History is read from the calendar instead
  of a scrolling list, so the sheet ends at the month grid.
- **One month at a time, with navigation.** The fixed 28-day strip became a month
  grid with `‹ Today ›` controls and a summary line (`2/6 done · 2 perfect days`).
- **Five distinct states, colour-coded:**
  - *Done* — solid habit colour,
  - *Partial* — light tint of the habit colour (e.g. 1 of 3 glasses),
  - *Missed* — faint red,
  - *Rest* — neutral grey with a dashed border (planned rest),
  - *Today* — amber ring, drawn independently of the state colour.

  Future days, unscheduled days and neighbouring months stay muted and neutral.
  A legend sits under the grid.
- **Click any scheduled day** to open its check-in sheet (amount, note, planned
  rest, clear) — including days from the past.
- The old heatmap and history-list styles were deleted rather than left behind.

## 1.6.1 — form polish

- **Date fields no longer collide with the theme's calendar icon.** Obsidian paints a
  calendar glyph at the start of `input[type="date"]` and pads the field for it; our
  compact inputs overrode that padding, so the text ran underneath the icon. The
  date/time fields now keep room for it and the icon is aligned.
- **No double submit.** Create/Save disables itself and reads *Creating…* / *Saving…*
  while the note is being written, so a double click can't create two habits.
- **Weekly habits hide *Count*.** A times-per-week habit has no per-day amount, so
  the meaningless option is gone and an existing Count draft falls back to *Did it*.
- **No blank schedule chip.** Habits saved with *Selected days* but no days left now
  read "Selected days" instead of rendering an empty chip.
- **The unit `time` is no longer printed.** Quantity rows show `1/3 ly`, binary rows
  show nothing, and the detail sheet says *max 2 per day* instead of *max 2 time*.
- Accessibility pass on the optional fields (category, cue, reward and both dates got
  aria-labels), and the number fields clamp to sane ranges (1–7 per week, 1–999 amount).

## 1.6.0 — a habit form you can finish in one screen

- **Four decisions, one screen.** The form went from 13 stacked rows to
  **Name → Type → When → Look**, with the create button always visible in a sticky
  footer. Optional fields (description, category, cue, reward, start/end dates)
  moved behind **More options**, which reports how many of them are set and opens
  automatically when editing a habit that uses them.
- **Type instead of raw fields.** *Did it* / *Count* / *Limit* replaces the
  direction + target + unit trio: the amount row only appears for Count and Limit,
  and the unit placeholder now suggests real units.
- **Clearer week semantics.** Choosing *Times per week* swaps the amount for a
  session count and says so, so a 3×/week habit no longer pretends to have a
  daily amount.
- **Faster.** The name field is focused on open, **Enter** saves, **Esc** closes,
  ⌘/Ctrl+Enter saves from anywhere, and the button stays disabled until the habit
  has a name.
- **Less noise in the lists.** Binary habits no longer show a meaningless
  `0/1 time` chip in Today; the detail sheet reports their target as *Did it (once)*.
- Form helpers (`src/habit-form.js`) are pure and covered by tests: draft ⇄
  frontmatter mapping, validation, and the tracking-type detection used when
  editing existing habits.

## 1.5.0 — undo, reminders, and a searchable habit list

- **Undo on every check-in.** One-tap check-ins, sheet saves, planned rests and
  clears now raise a small toast with **Undo** for eight seconds; undo restores the
  exact frontmatter entry that was there before (including notes and `skip` state).
- **Daily reminder.** Settings → Reminders: one in-app nudge a day at a chosen time,
  only when habits are still open, sent at most once per day and only within three
  hours of the chosen time. It arrives as a toast with an **Open today** action.
  A **Preview** button shows it immediately. Obsidian has no background push, so the
  reminder runs while the app is open.
- **Search, category filter and sort in Habits.** A toolbar above the list with a
  search box (title, category, description, unit), an "All categories" filter built
  from your own categories, and sorting by title, streak, 30-day rate or category.
  Choosing *Category* groups the rows under category headers, so the long-dormant
  `category` field finally does something.
- The list re-renders on its own while you type, so the search box keeps focus and
  caret; the header reports `3 of 12 habits`; an empty result offers *Clear filters*.
- Reminder maths and the list utilities live in pure modules (`src/reminders.js`,
  `src/habits.js`) and are covered by tests.

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
