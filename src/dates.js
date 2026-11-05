/** Small date/string helpers shared by the view, the modals and the store. */

export const pad = (value) => String(value).padStart(2, '0');

export const isoDate = (date = new Date()) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const parseDate = (value) => {
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const addDays = (value, amount) => {
  const date = typeof value === 'string' ? parseDate(value) : new Date(value);
  date.setDate(date.getDate() + amount);
  return isoDate(date);
};

export const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));

export const plural = (value, one, many = `${one}s`) => `${value} ${value === 1 ? one : many}`;

export const startOfWeek = (date, weekStartsOn) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - ((result.getDay() - weekStartsOn + 7) % 7));
  return result;
};

export const dateRange = (start, count) => Array.from({ length: count }, (_, index) => addDays(start, index));

export const safeName = (value) => String(value || '').trim().replace(/[\\/:*?"<>|#^\[\]]/g, '').replace(/\s+/g, ' ') || 'Untitled habit';

export const esc = (value) => String(value || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');

export const longDay = (key) => parseDate(key)?.toLocaleDateString(undefined, {
  weekday: 'long', month: 'long', day: 'numeric'
}) || key;

export const shortDay = (key) => parseDate(key)?.toLocaleDateString(undefined, {
  weekday: 'short', month: 'short', day: 'numeric'
}) || key;
