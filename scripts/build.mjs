#!/usr/bin/env node
/**
 * Builds PDL Habit.
 *
 * `npm run build` produces the artifact the community store ships: a minified,
 * sourcemap-free `main.js` next to `styles.css` and `manifest.json` at the repo root.
 * The same files are staged into `dist/` for `npm run deploy` and `npm run publish`.
 *
 * Usage:
 *   node scripts/build.mjs              # production build - this is the release artifact
 *   node scripts/build.mjs --dev        # unminified + inline sourcemap, written to dist/
 *   node scripts/build.mjs --watch      # dev rebuild on change, written to dist/
 *   node scripts/build.mjs --deploy     # also copy the result into the vault
 *
 * The production output is reproducible: no timestamps, no absolute paths, minified
 * with the pinned esbuild version. `npm run verify:build` rebuilds it twice and
 * compares the hashes with the committed `main.js`.
 */
import esbuild from "esbuild";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { ROOT, buildOptions, readManifest } from "./esbuild.config.mjs";

const args = new Set(process.argv.slice(2));
const watch = args.has("--watch");
const deploy = args.has("--deploy");
const production = !watch && !args.has("--dev");

const MAIN = path.join(ROOT, "main.js");
const DIST = path.join(ROOT, "dist");
const manifest = readManifest();

function sha256(file) {
  return createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

/** Copy the files Obsidian needs into `dist/`, the folder `deploy`/`publish` read. */
function stageDist() {
  fs.mkdirSync(DIST, { recursive: true });
  for (const file of ["main.js", "styles.css", "manifest.json", "versions.json"]) {
    fs.copyFileSync(path.join(ROOT, file), path.join(DIST, file));
  }
}

/** Deploy `dist/` into a vault. Reads OBSIDIAN_VAULT + OBSIDIAN_PLUGIN_DIR, or .deploy.json. */
function deployToVault() {
  let vault = process.env.OBSIDIAN_VAULT;
  let pluginDir = process.env.OBSIDIAN_PLUGIN_DIR || "pdl-habit";
  const configPath = path.join(ROOT, ".deploy.json");
  if ((!vault || !pluginDir) && fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    vault = vault || config.vault;
    pluginDir = config.pluginDir || pluginDir;
  }
  if (!vault) {
    console.warn("[deploy] No vault configured. Set OBSIDIAN_VAULT or create .deploy.json.");
    return;
  }
  const target = path.join(vault, ".obsidian", "plugins", pluginDir);
  fs.mkdirSync(target, { recursive: true });
  for (const file of ["main.js", "styles.css", "manifest.json"]) {
    fs.copyFileSync(path.join(DIST, file), path.join(target, file));
  }
  console.log(`[deploy] Copied main.js, styles.css, manifest.json -> ${target}`);
  console.log("[deploy] Reload Obsidian (Ctrl/Cmd+R) to pick up the new build.");
}

if (watch) {
  const context = await esbuild.context(buildOptions({ outfile: path.join(DIST, "main.js"), production: false }));
  await context.watch();
  console.log("[build] Watching src/ - dev build (inline sourcemap) in dist/main.js");
} else if (!production) {
  fs.mkdirSync(DIST, { recursive: true });
  await esbuild.build(buildOptions({ outfile: path.join(DIST, "main.js"), production: false }));
  console.log("[build] dist/main.js (dev, inline sourcemap) - `npm run build` writes the release artifact");
} else {
  await esbuild.build(buildOptions({ outfile: MAIN, production: true }));
  stageDist();
  const size = (fs.statSync(MAIN).size / 1024).toFixed(1);
  console.log(`[build] main.js v${manifest.version} - ${size} KB, sha256 ${sha256(MAIN).slice(0, 16)}...`);
  console.log("[build] staged dist/ (main.js, styles.css, manifest.json, versions.json)");
}

if (deploy) deployToVault();
