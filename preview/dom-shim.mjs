/**
 * Just enough of the browser DOM for the preview renderer: Obsidian's HTMLElement
 * helpers (createDiv/createSpan/createEl, empty, addClass…) plus `style` and `setIcon`.
 * Serialises to HTML so a headless browser can screenshot the result.
 */

const VOID = new Set(['input', 'img', 'br', 'hr']);

const escapeHtml = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

class Style {
  constructor() {
    this.props = new Map();
    // Support both `style.setProperty('--x', v)` and `style.width = '40%'`.
    return new Proxy(this, {
      set(target, key, value) {
        if (key === 'props') { target.props = value; return true; }
        if (typeof key === 'string' && !(key in target)) {
          target.props.set(key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`), String(value));
          return true;
        }
        target[key] = value;
        return true;
      }
    });
  }

  setProperty(name, value) { this.props.set(name, String(value)); }
  removeProperty(name) { this.props.delete(name); }
  getPropertyValue(name) { return this.props.get(name) ?? ''; }
  toAttribute() {
    return [...this.props.entries()].map(([name, value]) => `${name}:${value}`).join(';');
  }
}

class El {
  constructor(tag = 'div', options = {}) {
    this.tagName = tag.toUpperCase();
    this.children = [];
    this.parentElement = null;
    this.className = typeof options.cls === 'string' ? options.cls : '';
    this.style = new Style();
    this.attrs = { ...(options.attr || {}) };
    this.textContent = options.text ? String(options.text) : '';
    this.innerHTML = '';
    if (options.title) this.attrs.title = options.title;
    this.dataset = {};
  }

  get classList() {
    const self = this;
    return {
      add: (...names) => { self.className = [...new Set([...self.className.split(/\s+/).filter(Boolean), ...names])].join(' '); },
      remove: (...names) => { self.className = self.className.split(/\s+/).filter((name) => name && !names.includes(name)).join(' '); },
      contains: (name) => self.className.split(/\s+/).includes(name),
      toggle: (name, force) => { const on = force ?? !self.classList.contains(name); on ? self.classList.add(name) : self.classList.remove(name); return on; }
    };
  }

  addClass(...names) { this.classList.add(...names); return this; }
  removeClass(...names) { this.classList.remove(...names); return this; }
  toggleClass(name, force) { this.classList.toggle(name, force); return this; }
  setAttribute(name, value) { this.attrs[name] = String(value); }
  getAttribute(name) { return this.attrs[name]; }
  appendText(value) { this.textContent += String(value); }
  setText(value) { this.textContent = String(value); }
  focus() { this.attrs['data-focused'] = 'true'; }

  /** `input.value = …` should end up in the markup, like a real element. */
  get value() { return this.attrs.value ?? ''; }
  set value(next) {
    if (this.tagName === 'TEXTAREA') { this.textContent = String(next); return; }
    this.attrs.value = String(next);
  }

  /** `disabled` is a reflected property in the browser; mirror it for screenshots. */
  get disabled() { return this.attrs.disabled !== undefined; }
  set disabled(next) {
    if (next) this.attrs.disabled = '';
    else delete this.attrs.disabled;
  }

  appendChild(child) {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  remove() {
    if (!this.parentElement) return;
    const siblings = this.parentElement.children;
    const index = siblings.indexOf(this);
    if (index >= 0) siblings.splice(index, 1);
    this.parentElement = null;
  }

  empty() {
    this.children.forEach((child) => { child.parentElement = null; });
    this.children = [];
    this.textContent = '';
    this.innerHTML = '';
    return this;
  }

  createEl(tag, options = {}) {
    const child = new El(tag, options);
    if (typeof options.cls === 'string') child.className = options.cls;
    this.appendChild(child);
    return child;
  }

  createDiv(options = {}) { return this.createEl('div', options); }
  createSpan(options = {}) { return this.createEl('span', options); }

  set innerHTMLSafe(value) { this.innerHTML = value; }
  get innerHTMLSafe() { return this.innerHTML; }

  on(event, handler) { this[`on${event}`] = handler; }

  toHtml(indent = '') {
    const classes = this.className.trim();
    const style = this.style.toAttribute();
    const attrs = [
      classes ? ` class="${escapeHtml(classes)}"` : '',
      style ? ` style="${escapeHtml(style)}"` : '',
      ...Object.entries(this.attrs).map(([name, value]) => ` ${name}="${escapeHtml(value)}"`)
    ].join('');
    const tag = this.tagName.toLowerCase();
    if (VOID.has(tag)) return `${indent}<${tag}${attrs}>`;
    if (this.innerHTML) return `${indent}<${tag}${attrs}>${this.innerHTML}</${tag}>`;
    const text = this.textContent ? escapeHtml(this.textContent) : '';
    if (!this.children.length) return `${indent}<${tag}${attrs}>${text}</${tag}>`;
    const inner = [text, ...this.children.map((child) => child.toHtml(`${indent}  `))].filter(Boolean).join('\n');
    return `${indent}<${tag}${attrs}>\n${inner}\n${indent}</${tag}>`;
  }
}

export function installDom() {
  const document = {
    body: new El('body'),
    createElement(tag) { return new El(tag); },
    createDocumentFragment() { return new El('fragment'); }
  };
  globalThis.document = document;
  globalThis.window = { document };
  return document;
}

export { El };
