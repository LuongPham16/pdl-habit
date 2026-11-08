# Changelog

## 1.0.2 — clean review, reproducible build

Nothing about how habits work changed; this release exists to pass the community-store
review cleanly and to make the shipped bundle verifiable.

- **All 470 `!important` declarations are gone.** The rules that relied on them now win
  the cascade on specificity instead — every rule carries an extra `:root:root` scope —
  so the plugin still overrides Obsidian's defaults without forcing styles. Nothing
  moved: computed styles for every element and pseudo-element of all 47 offline preview
  pages are identical before and after.
- **No partially supported CSS.** `scrollbar-width` was dropped; the tab strip already
  hides its scrollbar with `::-webkit-scrollbar`, which works in every Obsidian version.
- **Duplicate selector blocks merged** — 16 blocks that were restated later in the same
  scope now live once.
- **The release artifact is reproducible.** `npm run build` writes the shipped
  `main.js` at the repo root in production mode (minified, no sourcemap), `main.js` is
  committed again, esbuild is pinned to one exact version and the build contains no
  timestamp or absolute path. A fresh build from the tag is byte-identical, which is
  what the store's "build output does not match the released main.js artifact" check
  compares.
- **`npm run verify` now audits the review rules.** It fails on `!important`,
  `scrollbar-width`/`scrollbar-color`, `:has()`, duplicate selectors, rules that leak
  into Obsidian's global UI, an unminified or stale `main.js`, and a build that is not
  reproducible.
- Dev builds moved to `dist/main.js`, so `npm run dev` can never dirty the committed
  release file.

## 1.0.1 — layout balance and review lint

- The Insights trend card now shares the same inset as the other cards, so the axis
  dates and the average percentage no longer hug the card edges. The line itself is
  unchanged, flat 0% stretches included.
- `manifest.json` no longer contains the word "Obsidian" in its description, which
  the community plugin review rejects.

## 1.0.0 — first public release

PDL Habit is a Markdown-first habit tracker for Obsidian: every habit is a note in
your vault, every check-in is one line of frontmatter.

**Capture**

- Compact habit form — name it, choose how it counts, choose when; everything
  optional lives behind *More options*, and Enter saves.
- Five schedules: every day, selected weekdays, times per week, times per month,
  every N days — plus an optional exact time of day.
- Build or limit behaviours, with planned rest days that never break a streak.

**Check in**

- Counted habits start at 0 with − / + steppers and a live hint; binary habits get a
  Done / Not done switch.
- Undo for every check-in, planned rest and clear — eight seconds, exact restore.
- One in-app daily reminder, only when habits are still open.

**Review**

- Today: week strip, progress ring, *Next up*, and the plan grouped by morning,
  afternoon, evening and anytime.
- Habit detail with a one-month calendar (done / partial / missed / rest / today),
  ‹ Today › navigation and click-to-fix.
- Insights with a 7 / 30 / 90-day range: completion trend, weekday and category
  breakdowns, and habits losing momentum.

**Find & tidy**

- Habits: search, category filter, sort, and a seven-day check-in row per habit;
  Active / Archived is a switch.
- Any colour via a native colour field; 171 Lucide icons in ten searchable groups.
- English and Vietnamese interface (Auto follows Obsidian).

**Extras**

- Command palette: Quick add, Open a day, Undo last check-in, Add starter habits.
- Five starter habits for a new vault.
- Markdown frontmatter schema documented in the README.

Development history before the public release is kept in
[docs/CHANGELOG-DEV.md](docs/CHANGELOG-DEV.md).
