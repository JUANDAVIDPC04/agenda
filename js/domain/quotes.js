import { QUOTES } from '../config/quotes.js';
import { DAY_MS } from '../utils/date.js';

/** Frase determinista para una fecha: siempre la misma para el mismo día. */
export function quoteFor(d) {
  const n = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY_MS);
  const len = QUOTES.length;
  const [text, author] = QUOTES[(((n * 7) % len) + len) % len];
  return { text, author };
}
