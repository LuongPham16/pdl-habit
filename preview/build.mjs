#!/usr/bin/env node
/**
 * Builds the offline preview: bundles preview/render.mjs with `obsidian` replaced
 * by a stub, then screenshots the generated HTML with headless Edge/Chrome.
 *
 * Usage: node preview/build.mjs [--shot]
 */
import esbuild from "esbuild";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve('.');
const OUT = path.join(ROOT, 'preview/.build');

await esbuild.build({
  entryPoints: [path.join(ROOT, 'preview/render.mjs')],
  outfile: path.join(OUT, 'render.mjs'),
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node20',
  logLevel: 'warning',
  alias: { obsidian: path.join(ROOT, 'preview/obsidian-stub.mjs') }
});

await import(`file://${path.join(OUT, 'render.mjs').replace(/\\/g, '/')}?t=${Date.now()}`);

if (process.argv.includes('--shot')) {
  const browsers = [
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe'
  ];
  const browser = browsers.find((candidate) => fs.existsSync(candidate));
  if (!browser) throw new Error('No Chromium browser found for screenshots.');
  const desktop = { width: 1440, height: 1000 };
  const shots = [
    { name: 'today-desktop.png', file: 'today.html', ...desktop },
    { name: 'today-dark.png', file: 'today-dark.html', ...desktop },
    { name: 'today-empty.png', file: 'today-empty.html', width: 1440, height: 800 },
    { name: 'today-complete.png', file: 'today-complete.html', width: 1440, height: 800 },
    { name: 'today-narrow.png', file: 'today.html', width: 560, height: 1000 },
    { name: 'today-undo.png', file: 'today-undo.html', width: 1440, height: 900 },
    { name: 'habits-desktop.png', file: 'habits.html', ...desktop },
    { name: 'habits-dark.png', file: 'habits-dark.html', ...desktop },
    { name: 'habits-archived.png', file: 'habits-archived.html', width: 1440, height: 760 },
    { name: 'habits-empty.png', file: 'habits-empty.html', width: 1440, height: 700 },
    { name: 'habits-narrow.png', file: 'habits.html', width: 560, height: 900 },
    { name: 'habits-filtered.png', file: 'habits-filtered.html', width: 1440, height: 700 },
    { name: 'habits-grouped.png', file: 'habits-grouped.html', width: 1440, height: 900 },
    { name: 'habits-sorted.png', file: 'habits-sorted.html', width: 1440, height: 800 },
    { name: 'habits-reminder.png', file: 'habits-reminder.html', width: 1440, height: 900 },
    { name: 'calendar-desktop.png', file: 'calendar.html', ...desktop },
    { name: 'calendar-dark.png', file: 'calendar-dark.html', ...desktop },
    { name: 'calendar-narrow.png', file: 'calendar.html', width: 560, height: 900 },
    { name: 'insights-desktop.png', file: 'insights.html', ...desktop },
    { name: 'insights-dark.png', file: 'insights-dark.html', ...desktop },
    { name: 'insights-empty.png', file: 'insights-empty.html', width: 1440, height: 800 },
    { name: 'insights-narrow.png', file: 'insights.html', width: 560, height: 1000 },
    { name: 'habit-new.png', file: 'habit-new.html', width: 900, height: 760 },
    { name: 'habit-new-dark.png', file: 'habit-new-dark.html', width: 900, height: 760 },
    { name: 'habit-count.png', file: 'habit-count.html', width: 900, height: 780 },
    { name: 'habit-week.png', file: 'habit-week.html', width: 900, height: 700 },
    { name: 'habit-advanced.png', file: 'habit-advanced.html', width: 900, height: 1080 },
    { name: 'habit-edit.png', file: 'habit-edit.html', width: 900, height: 900 }
  ];
  for (const shot of shots) {
    const file = path.join(ROOT, 'preview', shot.name);
    execFileSync(browser, [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      `--window-size=${shot.width},${shot.height}`,
      `--screenshot=${file}`,
      `file://${path.join(ROOT, 'preview', shot.file).replace(/\\/g, '/')}`
    ], { stdio: 'ignore' });
    console.log(`[preview] ${file}`);
  }
}
