// Preferencias por navegador (vista elegida y calendarios ocultos).
import { STORAGE_KEYS } from '../config/constants.js';

export function loadPreferences() {
  try {
    const p = JSON.parse(localStorage.getItem(STORAGE_KEYS.prefs) || '{}');
    return { view: p.view, hidden: Array.isArray(p.hidden) ? p.hidden : [] };
  } catch {
    return { view: undefined, hidden: [] };
  }
}

export function savePreferences({ view, hidden }) {
  try { localStorage.setItem(STORAGE_KEYS.prefs, JSON.stringify({ view, hidden: [...hidden] })); } catch { /* ignorar */ }
}
