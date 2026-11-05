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
  const shots = [
    { name: 'today-desktop.png', file: 'today.html', width: 1440, height: 1000 },
    { name: 'today-dark.png', file: 'today-dark.html', width: 1440, height: 1000 },
    { name: 'today-empty.png', file: 'today-empty.html', width: 1440, height: 800 },
    { name: 'today-complete.png', file: 'today-complete.html', width: 1440, height: 800 },
    { name: 'today-narrow.png', file: 'today.html', width: 560, height: 1000 }
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
