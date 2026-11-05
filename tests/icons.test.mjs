import test from 'node:test';
import assert from 'node:assert/strict';
import { HABIT_ICONS, ICON_NAMES, COLORS, DEFAULT_COLOR } from '../src/constants.js';

test('the icon catalogue is large enough to be useful', () => {
  assert.ok(HABIT_ICONS.length >= 8, 'at least eight groups');
  assert.ok(ICON_NAMES.length >= 150, `expected 150+ icons, got ${ICON_NAMES.length}`);
});

test('every group is labelled and carries icons', () => {
  HABIT_ICONS.forEach(([label, icons]) => {
    assert.equal(typeof label, 'string');
    assert.ok(label.trim().length > 0);
    assert.ok(icons.length >= 4, `${label} should keep at least four icons`);
  });
});

test('icon names are unique and look like Lucide ids', () => {
  const seen = new Set();
  ICON_NAMES.forEach((name) => {
    assert.match(name, /^[a-z0-9]+(-[a-z0-9]+)*$/, `${name} is not a Lucide id`);
    assert.equal(seen.has(name), false, `${name} is listed twice`);
    seen.add(name);
  });
});

test('the default icon and colour exist', () => {
  assert.ok(ICON_NAMES.includes('sprout'), 'sprout is the fallback icon');
  assert.ok(COLORS.includes(DEFAULT_COLOR));
  COLORS.forEach((color) => assert.match(color, /^#[0-9a-f]{6}$/i));
});
