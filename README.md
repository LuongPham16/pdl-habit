# PDL Habit

**A calm, Markdown-first habit tracker for [Obsidian](https://obsidian.md).**

Every habit is a plain note; every check-in is a line of frontmatter. Nothing is
locked inside the plugin.

> **Version 1.4.0** · Obsidian **1.5.0+** · desktop and mobile · four tabs, one design language

## Highlights

- **Today** — one column that reads top to bottom: page header → week strip →
  progress hero with **Next up** → plan grouped by Morning / Afternoon / Evening /
  Anytime.
- **Habits** — every habit with its last seven days as tappable check-in cells,
  current streak and 30-day rate. **Active / Archived** is a switch, not a tab.
- **Calendar** — month grid with per-day completion and a month summary; tap a day
  to open it in Today.
- **Insights** — completion, perfect days and planned rests, a per-habit bar list
  and the notes you left during check-ins.
- **One shared frame** — the same header, cards, wording and spacing on every tab.
- **Fewer places to act** — editing, archiving and deleting live in the habit
  detail sheet, so lists stay quiet.
- **Flexible schedules** — daily, chosen weekdays or times per week.
- **Build / limit habits** — grow a behaviour or cap one you want less of.
- **Planned rest** — a rest day never breaks a streak.
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
npm run verify     # load the built bundle against a stubbed Obsidian API
```

`npm run preview` renders every tab offline with mock data into `preview/*.png`
(light, dark, empty, narrow) — handy for reviewing visual changes without
opening Obsidian.

## Project layout

```
src/
  index.js       bundle entry
  plugin.js      plugin lifecycle, note scanning, persistence
  view.js        the four tabs — Today, Habits, Calendar, Insights
  ui.js          shared page header, segmented control, cards, empty states
  habits.js      scheduling, completion, streaks, day/week/month aggregates
  dates.js       date and string helpers
  constants.js   ids, palette, icon catalogue
  dom.js         small DOM helpers
  modals/        habit form, icon picker, check-in, detail, confirm
  settings.js    settings tab
styles.css       base sheets, page frame, tabs and modals
preview/         offline renderer used for design review
```

## Install

Copy `main.js`, `manifest.json` and `styles.css` into
`<vault>/.obsidian/plugins/pdl-habit/`, then enable the plugin.

## License

MIT
