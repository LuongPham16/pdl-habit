import test from 'node:test';
import assert from 'node:assert/strict';
import { starterHabits } from '../src/starters.js';

const starters = starterHabits();

test('five starter habits are offered', () => {
  assert.equal(starters.length, 5);
  const titles = new Set(starters.map((habit) => habit.title));
  assert.equal(titles.size, 5, 'titles are unique');
});

test('starters cover the interesting shapes', () => {
  const weekly = starters.find((habit) => habit.frequency === 'weekly');
  assert.ok(weekly, 'one weekly habit');
  assert.equal(weekly.target, 3);

  const timed = starters.find((habit) => habit.time);
  assert.ok(timed, 'one habit with a clock time');
  assert.match(timed.time, /^\d{2}:\d{2}$/);

  const counted = starters.find((habit) => habit.target > 1 && habit.frequency === 'daily');
  assert.ok(counted, 'one counted habit');
  assert.ok(counted.unit && counted.unit !== 'time');
});

test('every starter is saveable', () => {
  starters.forEach((habit) => {
    assert.ok(habit.title.trim().length > 0);
    assert.ok(['daily', 'weekdays', 'weekly', 'monthly', 'interval'].includes(habit.frequency));
    assert.match(habit.color, /^#[0-9a-f]{6}$/i);
    assert.ok(habit.icon);
    assert.match(habit.startDate, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(habit.direction, 'build');
  });
});
