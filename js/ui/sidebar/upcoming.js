// Próximos 5 eventos de las dos próximas semanas.
import { h } from '../../utils/dom.js';
import { ymd, parseYmd, addDays, today, toMin, nowMinutes, fmt } from '../../utils/date.js';
import { calendarColor } from '../../config/calendars.js';
import { MESSAGES } from '../../config/constants.js';

const LIMIT = 5;
const DAYS_AHEAD = 14;

export function renderUpcoming(ctx, container) {
  const { state, actions } = ctx;
  const t0 = today(), todayKey = ymd(t0), tomorrowKey = ymd(addDays(t0, 1)), now = nowMinutes();
  const list = ctx.queries.occurrences(t0, addDays(t0, DAYS_AHEAD))
    .filter(e => e.occ > todayKey || e.allDay || toMin(e.end || e.start) >= now)
    .slice(0, LIMIT);

  const title = h('h3', {}, 'Próximos');
  if (!list.length) {
    container.replaceChildren(title, h('div', { class: 'hint' }, state.loaded ? 'Nada en las próximas dos semanas.' : 'Cargando tu agenda…'));
    return;
  }

  const whenOf = occ => (occ === todayKey ? 'Hoy' : occ === tomorrowKey ? 'Mañana' : fmt(parseYmd(occ), { weekday: 'short', day: 'numeric' }));
  container.replaceChildren(title, ...list.map(e =>
    h('button', { class: 'up-item', style: `--c:${calendarColor(e.cal)}`, onclick: () => actions.openEventDetail(e) },
      h('span', { class: 't' }, e.allDay ? '—' : e.start),
      h('span', { class: 'x' }, e.title || MESSAGES.untitled,
        h('small', {}, whenOf(e.occ) + (e.location ? ' · ' + e.location : ''))))));
}
