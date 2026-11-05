/**
 * Shared building blocks so every tab reads the same: one page header, one card
 * surface, one segmented control, one empty state.
 */
import { setIcon } from 'obsidian';

/**
 * Page header: eyebrow, title, one-line summary, optional controls on the right.
 * Mirrors the Today header so tabs feel like chapters of the same page.
 */
export function pageHead(parent, { eyebrow = '', title, sub = '', tools = null }) {
  const head = parent.createDiv({ cls: 'pdlh-page-head' });
  const titleEl = head.createDiv({ cls: 'pdlh-page-title' });
  if (eyebrow) titleEl.createEl('span', { cls: 'pdlh-eyebrow', text: eyebrow });
  titleEl.createEl('h2', { text: title });
  if (sub) titleEl.createEl('p', { cls: 'pdlh-page-sub', text: sub });
  const toolsEl = head.createDiv({ cls: 'pdlh-page-tools' });
  if (typeof tools === 'function') tools(toolsEl);
  return { head, toolsEl };
}

/** Pill group used for filters and scopes (All/Morning, Active/Archived, …). */
export function segmented(parent, options, activeId, onPick, label = 'Filter') {
  const group = parent.createDiv({ cls: 'pdlh-segments', attr: { role: 'group', 'aria-label': label } });
  options.forEach(([id, text]) => {
    const active = id === activeId;
    const button = group.createEl('button', {
      cls: active ? 'is-active' : '',
      text,
      attr: { 'aria-pressed': String(active) }
    });
    button.onclick = () => onPick(id);
  });
  return group;
}

/** Small uppercase label with a count on the right, used above every block. */
export function blockHead(parent, title, count = '') {
  const head = parent.createDiv({ cls: 'pdlh-block-head' });
  head.createEl('h3', { text: title });
  if (count) head.createSpan({ cls: 'pdlh-block-count', text: count });
  return head;
}

/** Surface used by the list, calendar and insight blocks. */
export function card(parent, cls = '') {
  return parent.createDiv({ cls: `pdlh-card ${cls}`.trim() });
}

/** Empty state shared by Today, Habits and Insights. */
export function emptyState(parent, { icon = 'sprout', title, body = '', compact = false, actions = [] } = {}) {
  const empty = parent.createDiv({ cls: `pdlh-empty-state ${compact ? 'is-compact' : ''}`.trim() });
  setIcon(empty.createSpan({ cls: 'pdlh-empty-mark' }), icon);
  empty.createEl('h3', { text: title });
  if (body) empty.createEl('p', { text: body });
  if (actions.length) {
    const row = empty.createDiv({ cls: 'pdlh-empty-actions' });
    actions.forEach(({ label, icon: actionIcon, onClick, primary = false }) => {
      const button = row.createEl('button', { cls: primary ? 'pdlh-primary' : 'pdlh-ghost-btn' });
      if (actionIcon) setIcon(button.createSpan(), actionIcon);
      button.createSpan({ text: label });
      button.onclick = onClick;
    });
  }
  return empty;
}
