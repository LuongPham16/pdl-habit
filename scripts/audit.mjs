#!/usr/bin/env node
/**
 * Checks the things the community-store review flags, so they cannot creep back:
 *
 *   - no `!important` in styles.css (review: "avoid !important")
 *   - no partially supported CSS (scrollbar-width/-color, :has()) for the declared
 *     minimum Obsidian version
 *   - no duplicate selector in the same media context
 *   - no rule that styles Obsidian's global UI instead of the plugin's own markup
 *   - main.js is present, built from the current manifest version, minified and
 *     free of an inline sourcemap
 *   - manifest.json / versions.json / package.json agree on the version
 *
 * Usage: node scripts/audit.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { ROOT } from "./esbuild.config.mjs";

const failures = [];
const warnings = [];
const fail = (message) => failures.push(message);
const warn = (message) => warnings.push(message);
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(ROOT, file), "utf8"));

/* ------------------------------------------------------------------ CSS audit */

const CSS_FILE = path.join(ROOT, "styles.css");
const cssSource = fs.readFileSync(CSS_FILE, "utf8");
// Comments are allowed to mention `!important` when they explain the policy.
const css = cssSource.replace(/\/\*[\s\S]*?\*\//g, "");

if (/!\s*important/i.test(css)) {
  fail(`styles.css still has ${(css.match(/!\s*important/gi) || []).length} !important declaration(s) - the review rejects them`);
}

for (const feature of ["scrollbar-width", "scrollbar-color"]) {
  if (new RegExp(`[\\s;{]${feature}\\s*:`, "i").test(css)) {
    fail(`styles.css uses ${feature}, which Obsidian's Chromium baseline does not fully support - style the scrollbar with ::-webkit-scrollbar instead`);
  }
}
if (/:has\(/i.test(css)) fail("styles.css uses :has(), which the review flags for selector-invalidation cost");

/** Minimal block scanner: enough to walk rules, at-rules and their context. */
function scanCss(text) {
  const blocks = [];
  const stack = [];
  let i = 0;
  const skip = () => {
    for (;;) {
      while (i < text.length && /\s/.test(text[i])) i += 1;
      if (text.startsWith("/*", i)) {
        const end = text.indexOf("*/", i + 2);
        i = end === -1 ? text.length : end + 2;
        continue;
      }
      return;
    }
  };
  const readUntil = (stops) => {
    let quote = null;
    const start = i;
    while (i < text.length) {
      const ch = text[i];
      if (quote) {
        if (quote === ch) quote = null;
        i += 1;
        continue;
      }
      if (ch === '"' || ch === "'") {
        quote = ch;
        i += 1;
        continue;
      }
      if (stops.includes(ch)) return text.slice(start, i);
      i += 1;
    }
    return text.slice(start);
  };
  const closeOf = (from) => {
    let depth = 1;
    let j = from;
    while (j < text.length) {
      if (text.startsWith("/*", j)) {
        const end = text.indexOf("*/", j + 2);
        j = end === -1 ? text.length : end + 2;
        continue;
      }
      if (text[j] === "{") depth += 1;
      else if (text[j] === "}") {
        depth -= 1;
        if (depth === 0) return j;
      }
      j += 1;
    }
    throw new Error("unbalanced braces in styles.css");
  };
  for (;;) {
    skip();
    if (i >= text.length) break;
    const head = readUntil(["{", "}", ";"]).trim();
    const ch = text[i];
    if (ch === ";") {
      i += 1;
      continue;
    }
    if (ch === "}") {
      if (stack.length) stack.pop();
      i += 1;
      continue;
    }
    const bodyStart = i + 1;
    const bodyEnd = closeOf(bodyStart);
    if (head.startsWith("@")) {
      blocks.push({ kind: "at", head, context: [...stack] });
      if (/^@(media|supports|layer|container|scope)\b/i.test(head)) {
        stack.push(head.replace(/\s+/g, " "));
        i = bodyStart;
        continue;
      }
    } else {
      blocks.push({ kind: "rule", head, context: [...stack] });
    }
    i = bodyEnd + 1;
  }
  return blocks;
}

const blocks = scanCss(css);
const seen = new Map();
for (const block of blocks) {
  if (block.kind !== "rule") continue;
  const key = `${block.context.join(" ")} || ${block.head}`;
  seen.set(key, (seen.get(key) || 0) + 1);
  if (seen.get(key) > 1) fail(`styles.css declares the selector ${block.head} twice in the same scope`);

  const selectorList = block.head.split(",");
  for (const selector of selectorList) {
    const trimmed = selector.trim();
    if (!trimmed) continue;
    const scoped = /\.pdlh-/.test(trimmed) || /\[data-type="pdlh-habit-dashboard"\]/.test(trimmed);
    if (!scoped) fail(`styles.css rule "${trimmed}" is not scoped to the plugin's own markup - it would restyle Obsidian globally`);
    if (!trimmed.startsWith(":root:root")) warn(`styles.css rule "${trimmed}" has no :root:root specificity boost`);
  }
}

/* --------------------------------------------------------------- bundle audit */

const manifest = readJson("manifest.json");
const versions = readJson("versions.json");
const pkg = readJson("package.json");
const MAIN = path.join(ROOT, "main.js");

if (!fs.existsSync(MAIN)) {
  fail("main.js is missing at the repo root - run `npm run build`");
} else {
  const bundle = fs.readFileSync(MAIN, "utf8");
  if (!bundle.startsWith(`/* PDL Habit v${manifest.version} -`)) {
    fail(`main.js was not built from manifest.json v${manifest.version} - run \`npm run build\``);
  }
  if (/sourceMappingURL/.test(bundle)) fail("main.js contains a sourcemap, so the release artifact cannot be reproduced");
  if (/!\s*important/.test(bundle)) fail("main.js ships an !important declaration");
  if (!bundle.trimEnd().endsWith("module.exports = module.exports.default;")) {
    fail("main.js is missing the CommonJS export footer");
  }
  if (bundle.length < 20_000) fail("main.js looks truncated (< 20 KB)");
  const lines = bundle.split("\n").length;
  if (lines > 60) fail(`main.js is not minified (${lines} lines) - the release build must stay minified`);
}

for (const file of ["styles.css", "manifest.json", "versions.json"]) {
  if (!fs.existsSync(path.join(ROOT, file))) fail(`${file} is missing at the repo root`);
}

/* ------------------------------------------------------------- metadata audit */

if (pkg.version !== manifest.version) fail(`package.json (${pkg.version}) and manifest.json (${manifest.version}) disagree`);
if (versions[manifest.version] !== manifest.minAppVersion) {
  fail(`versions.json must map ${manifest.version} to minAppVersion ${manifest.minAppVersion}`);
}
if (/obsidian/i.test(manifest.description)) fail("manifest.json description must not contain \"Obsidian\"");
if (/obsidian/i.test(manifest.name)) fail("manifest.json name must not contain \"Obsidian\"");
if (manifest.id !== manifest.id.toLowerCase() || /\s/.test(manifest.id)) fail("manifest.json id must be lowercase kebab-case");

/* ------------------------------------------------------------ dist/ freshness */

const DIST = path.join(ROOT, "dist");
if (fs.existsSync(path.join(DIST, "main.js"))) {
  for (const file of ["main.js", "styles.css", "manifest.json"]) {
    const root = path.join(ROOT, file);
    const staged = path.join(DIST, file);
    const same = fs.existsSync(root) && fs.existsSync(staged) && fs.readFileSync(root).equals(fs.readFileSync(staged));
    if (!same) fail(`dist/${file} is stale - run \`npm run build\` before deploying or publishing`);
  }
}

/* --------------------------------------------------------------------- report */

for (const message of warnings) console.warn(`[audit] warn  ${message}`);
if (failures.length) {
  for (const message of failures) console.error(`[audit] fail  ${message}`);
  console.error(`\n[audit] ${failures.length} problem(s) - the community review would flag these.`);
  process.exit(1);
}
console.log(`[audit] OK - ${blocks.filter((b) => b.kind === "rule").length} CSS rules, no !important, no unsupported features, main.js matches v${manifest.version}`);
