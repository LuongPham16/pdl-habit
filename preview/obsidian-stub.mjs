/** Stand-in for the `obsidian` module while rendering the preview offline. */
import fs from 'node:fs';
import path from 'node:path';
import { El } from './dom-shim.mjs';

const ICON_DIR = path.resolve('node_modules/lucide-static/icons');
const cache = new Map();

function loadIcon(name) {
  if (cache.has(name)) return cache.get(name);
  let markup = '';
  try {
    const svg = fs.readFileSync(path.join(ICON_DIR, `${name}.svg`), 'utf8');
    markup = svg
      .replace(/^[\s\S]*?<svg[^>]*>/, '')
      .replace(/<\/svg>\s*$/, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .trim();
  } catch {
    markup = '<circle cx="12" cy="12" r="8"></circle>';
  }
  const html = `<svg class="svg-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${markup}</svg>`;
  cache.set(name, html);
  return html;
}

export function setIcon(el, name) {
  el.innerHTML = loadIcon(String(name || 'circle'));
}

export class ItemView {
  constructor(leaf) { this.leaf = leaf; this.containerEl = leaf.containerEl; this.app = leaf.app; }
}

export class Modal {
  constructor(app) {
    this.app = app;
    this.modalEl = new El('div', { cls: 'modal' });
    this.contentEl = new El('div', { cls: 'modal-content' });
  }
  open() {}
  close() { this.onClose?.(); }
}

export class Setting {
  constructor() {}
  setName() { return this; }
  setDesc() { return this; }
  addText() { return this; }
  addTextArea() { return this; }
  addDropdown() { return this; }
  addButton() { return this; }
  addColorPicker() { return this; }
}

export class PluginSettingTab { constructor(app, plugin) { this.app = app; this.plugin = plugin; } }

export class Plugin {
  constructor(app, manifest) {
    this.app = app;
    this.manifest = manifest;
    this.views = new Map();
    this.commands = [];
    this.tabs = [];
  }
  registerView(type, factory) { this.views.set(type, factory); }
  addSettingTab(tab) { this.tabs.push(tab); }
  addRibbonIcon() { return {}; }
  registerInterval(id) { return id; }
  addCommand(command) { this.commands.push(command); return command; }
  registerEvent() {}
  async loadData() { return {}; }
  async saveData() {}
}

export class Notice {}
export const normalizePath = (value) => String(value).replace(/\\/g, '/');
