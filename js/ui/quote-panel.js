// Panel de la frase del día. Cambia al navegar a otra fecha en la vista Día.
import { ymd, today, fmt } from '../utils/date.js';
import { quoteFor } from '../domain/quotes.js';

export function renderQuote(ctx, { text, author, label }) {
  const { state } = ctx;
  const d = state.view === 'day' ? state.cursor : today();
  const q = quoteFor(d);
  text.textContent = q.text;
  author.textContent = '— ' + q.author;
  label.textContent = ymd(d) === ymd(today()) ? 'Frase de hoy' : 'Frase del ' + fmt(d, { weekday: 'long', day: 'numeric', month: 'long' });
}
