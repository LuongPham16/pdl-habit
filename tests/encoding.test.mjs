import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Guards against the encoding accident where a file is decoded as cp1252 and saved
 * as UTF-8 again: "·" becomes "Â·" and Vietnamese text turns into mojibake.
 * The patterns are built from escapes so this test never matches itself.
 */
const BROKEN = [
  new RegExp('\u00C2\u00B7'),
  new RegExp('\u00C2 '),
  new RegExp('\u00E2\u20AC'),
  new RegExp('\u00C3\u00A6'),
  new RegExp('\u00C3\u00A1\u00C2\u00BB')
];

const TEXT_FILES = ['src', 'docs', 'tests', 'scripts'];
const ROOT_FILES = ['styles.css', 'README.md', 'CHANGELOG.md', 'manifest.json', 'package.json'];

function walk(target, out = []) {
  const full = path.resolve(target);
  if (!fs.existsSync(full)) return out;
  if (fs.statSync(full).isFile()) { out.push(full); return out; }
  for (const entry of fs.readdirSync(full)) {
    if (['node_modules', '.git', '.build'].includes(entry)) continue;
    walk(path.join(full, entry), out);
  }
  return out;
}

const files = [
  ...TEXT_FILES.flatMap((target) => walk(target)),
  ...ROOT_FILES.map((name) => path.resolve(name)).filter((file) => fs.existsSync(file))
].filter((file) => /\.(js|mjs|md|css|json)$/.test(file))
  // This file builds the patterns from escapes, but its own name would still be scanned.
  .filter((file) => !file.endsWith(path.join('tests', 'encoding.test.mjs')));

test('source files contain no double-encoded text', () => {
  const broken = files.filter((file) => {
    const text = fs.readFileSync(file, 'utf8');
    return BROKEN.some((pattern) => pattern.test(text));
  });
  assert.deepEqual(broken.map((file) => path.relative(process.cwd(), file)), [], 'these files contain mojibake');
});

test('source files start without a byte-order mark', () => {
  const withBom = files.filter((file) => {
    const bytes = fs.readFileSync(file);
    return bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF;
  });
  assert.deepEqual(withBom.map((file) => path.relative(process.cwd(), file)), [], 'these files start with a BOM');
});
