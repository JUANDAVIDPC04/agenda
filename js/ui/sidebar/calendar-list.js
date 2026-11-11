// Lista de calendarios con casillas para mostrar/ocultar.
import { h } from '../../utils/dom.js';
import { CALENDARS, DEFAULT_CALENDAR, TASKS_CALENDAR, calendarColor } from '../../config/calendars.js';

function calendarRow(ctx, { id, name, color, count }) {
  const { state } = ctx;
  const inputId = 'cal-' + id;
  return h('label', { class: 'cal-row', for: inputId, style: `--c:${color}` },
    h('input', {
      type: 'checkbox', id: inputId, checked: !state.hidden.has(id),
      onchange: e => {
        e.target.checked ? state.hidden.delete(id) : state.hidden.add(id);
        ctx.savePrefs();
        ctx.render();
      },
    }),
    name,
    h('span', { class: 'n' }, count));
}

export function renderCalendarList(ctx, container) {
  const { state } = ctx;
  const rows = CALENDARS.map(cal => calendarRow(ctx, {
    id: cal.id,
    name: cal.name,
    color: calendarColor(cal.id),
    count: state.events.filter(e => (e.cal || DEFAULT_CALENDAR) === cal.id).length,
  }));
  rows.push(calendarRow(ctx, {
    id: TASKS_CALENDAR,
    name: 'Tareas',
    color: 'var(--accent)',
    count: state.tasks.filter(t => !t.done).length,
  }));
  container.replaceChildren(h('h3', {}, 'Mis calendarios'), ...rows);
}
