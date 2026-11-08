/**
 * One place that defines how the shipped bundle is produced.
 *
 * `scripts/build.mjs` builds `main.js` with it and `scripts/verify-build.mjs` rebuilds
 * the same source with it to prove the artifact is reproducible, so both always agree
 * on the entry point, externals, banner and minification.
 */
import fs from "node:fs";
import path from "node:path";
import { builtinModules } from "node:module";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function readManifest() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, "manifest.json"), "utf8"));
}

/**
 * @param {{ outfile: string, production: boolean }} options
 * @returns {import("esbuild").BuildOptions}
 */
export function buildOptions({ outfile, production }) {
  const manifest = readManifest();
  return {
    entryPoints: [path.join(ROOT, "src", "index.js")],
    outfile,
    bundle: true,
    format: "cjs",
    target: "es2022",
    platform: "node",
    logLevel: "warning",
    external: ["obsidian", "electron", ...builtinModules, ...builtinModules.map((name) => `node:${name}`)],
    // A sourcemap embeds the absolute build path, which would make the release artifact
    // impossible to reproduce byte-for-byte from the same source. Production ships
    // without one; the dev build keeps an inline sourcemap for debugging.
    sourcemap: production ? false : "inline",
    minify: production,
    legalComments: "none",
    // Obsidian reads the plugin as `module.exports = PluginClass`, while the source uses
    // `export default`; this footer bridges the two.
    footer: { js: "module.exports = module.exports.default;" },
    banner: { js: `/* PDL Habit v${manifest.version} - https://github.com/LuongPham16/pdl-habit */` }
  };
}
