import { state } from './state.js';

const STORAGE_KEY = 'my-places-v5';

export function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.places)); } catch (e) {}
}

export function loadFromStorage() {
  try {
    const r = localStorage.getItem(STORAGE_KEY);
    if (r) {
      state.places = JSON.parse(r);
      return true;
    }
  } catch (e) {}
  return false;
}

export function esc(s) {
  const d = document.createElement('div');
  d.textContent = s || '';
  return d.innerHTML;
}
