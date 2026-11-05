/** Tiny DOM helpers shared by views and modals (Obsidian extends HTMLElement). */
import { setIcon } from 'obsidian';

export function iconButton(parent, icon, label, cls = '') {
  const button = parent.createEl('button', {
    cls: `pdlh-icon-btn ${cls}`.trim(),
    attr: { 'aria-label': label, title: label }
  });
  setIcon(button, icon);
  return button;
}

/**
 * Habit icon with a safety net: if the running Obsidian build does not ship the
 * chosen glyph, fall back to the sprout instead of leaving an empty slot.
 */
export function setHabitIcon(el, name) {
  const icon = String(name || '').trim() || 'sprout';
  setIcon(el, icon);
  if (typeof el.querySelector === 'function' && !el.querySelector('svg')) setIcon(el, 'sprout');
  return el;
}

/** Small inline "icon + text" chip used in habit metadata lines. */
export function metaChip(parent, icon, text, cls = '') {
  const chip = parent.createSpan({ cls: `pdlh-meta-chip ${cls}`.trim() });
  if (icon) setIcon(chip.createSpan({ cls: 'pdlh-meta-icon' }), icon);
  chip.createSpan({ cls: 'pdlh-meta-text', text });
  return chip;
}
