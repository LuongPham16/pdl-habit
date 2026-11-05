# PDL Habit

**A calm, Markdown-first habit tracker for [Obsidian](https://obsidian.md).**

Every habit is a plain note; every check-in is a line of frontmatter. Nothing is
locked inside the plugin.

> **Version 1.3.0** · Obsidian **1.5.0+** · desktop and mobile · redesigned Today view

## Highlights

- **Today, rebuilt** — one column that reads top to bottom: date header → week
  strip → progress hero → plan grouped by Morning / Afternoon / Evening / Anytime.
- **Week strip** — seven day tiles with completion bars, so you can jump to any day
  of the week without arrow-clicking.
- **Next up** — the earliest unfinished habit is surfaced with a one-tap check-in.
- **Clear rows** — habit colour, schedule, streak, week progress and a dotted
  progress trail for quantity habits.
- **Flexible schedules** — daily, chosen weekdays or times per week.
- **Build / limit habits** — grow a behaviour or cap one you want less of.
- **Planned rest** — a rest day never breaks a streak.
- **Heatmaps, streaks, insights** — 28-day history per habit, 30-day rates,
  planned-rest counters and recent reflections.
- **Archive** — habits expire from `end_date` or move to the archive by hand.
- **84 Lucide icons**, per-habit colour, dark mode, reduced-motion support.

## Quick start

1. Enable **PDL Habit** in *Community plugins*.
2. Click the sprout ribbon icon, or run **PDL Habit: Open habit dashboard**.
3. Press **New habit**, then set a schedule and a target.
4. Tap the circle beside a habit to check in. Quantity habits open a small sheet
   for the amount, a note, or a planned rest.

Notes live in `03 - Area/Habits` by default; change the folder in settings.

## Development

```bash
npm install
npm run dev        # rebuild main.js on change
npm run build      # one-off development build into dist/
npm run build:prod # minified build
npm run deploy     # build + copy into the vault from .deploy.json
npm test           # unit tests (scheduling, completion, streaks, aggregates)
```

`node preview/build.mjs --shot` renders the Today view offline with mock data
into `preview/*.png` (light, dark, empty and completed states) — handy for
reviewing visual changes without opening Obsidian.

## Project layout

```
src/
  index.js       bundle entry
  plugin.js      plugin lifecycle, note scanning, persistence
  view.js        dashboard view — Today, Habits, Calendar, Insights, Archive
  habits.js      scheduling, completion, streaks, day/week aggregates
  dates.js       date and string helpers
  constants.js   ids, palette, icon catalogue
  dom.js         small DOM helpers
  modals/        habit form, icon picker, check-in, detail, confirm
  settings.js    settings tab
styles.css       base sheets + the Today redesign
preview/         offline renderer used for design review
```

## Install

Copy `main.js`, `manifest.json` and `styles.css` into
`<vault>/.obsidian/plugins/pdl-habit/`, then enable the plugin.

## License

MIT
