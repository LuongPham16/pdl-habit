#!/usr/bin/env node
/**
 * Proves that the shipped `main.js` is reproducible.
 *
 * The community-store review rebuilds a plugin from its tagged source and compares the
 * result byte-for-byte with the released `main.js`; any difference shows up as
 * "build output does not match the released main.js artifact". This script performs the
 * same check locally: it rebuilds twice, compares those two builds with each other, and
 * compares them with the committed `main.js`.
 *
 * Usage: node scripts/verify-build.mjs
 */
import esbuild from "esbuild";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { ROOT, buildOptions } from "./esbuild.config.mjs";

const MAIN = path.join(ROOT, "main.js");
const sha256 = (file) => createHash("sha256").update(fs.readFileSync(file)).digest("hex");

if (!fs.existsSync(MAIN)) {
  console.error("[verify-build] main.js is missing - run `npm run build` first");
  process.exit(1);
}

const work = fs.mkdtempSync(path.join(os.tmpdir(), "pdlh-build-"));
try {
  const runs = [path.join(work, "main.js"), path.join(work, "main-again.js")];
  for (const outfile of runs) {
    await esbuild.build(buildOptions({ outfile, production: true }));
  }
  const [first, second] = runs.map(sha256);
  if (first !== second) {
    console.error(`[verify-build] the build is not deterministic: ${first.slice(0, 16)}… != ${second.slice(0, 16)}…`);
    process.exit(1);
  }
  const shipped = sha256(MAIN);
  if (shipped !== first) {
    console.error("[verify-build] main.js does not match a fresh build of src/.");
    console.error(`  shipped:  ${shipped.slice(0, 16)}…`);
    console.error(`  rebuilt:  ${first.slice(0, 16)}…`);
    console.error("  Run `npm run build` and commit the result.");
    process.exit(1);
  }
  console.log(`[verify-build] OK - two rebuilds and main.js all hash to ${shipped.slice(0, 16)}…`);
} finally {
  fs.rmSync(work, { recursive: true, force: true });
}
