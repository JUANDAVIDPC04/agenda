// Vista Agenda: lista de eventos y tareas de los próximos 60 días.
import { h, cx } from '../../utils/dom.js';
import { ymd, parseYmd, addDays, today, fmt } from '../../utils/date.js';
import { calendarColor } from '../../config/calendars.js';
import { MESSAGES } from '../../config/constants.js';
import { selectors } from '../../state/app-state.js';
import { timeLabel } from '../../domain/events.js';

const RANGE_DAYS = 60;

function tasksByDue(state, fromKey, toKey) {
  const map = {};
  if (!selectors.tasksVisible(state)) return map;
  for (const t of state.tasks) if (t.due && t.due >= fromKey && t.due < toKey) (map[t.due] ||= []).push(t);
  return map;
}

const taskRow = (ctx, t) =>
  h('button', { class: cx('ag-ev', t.done && 'done'), style: '--c:var(--accent)', onclick: () => ctx.actions.openTaskEditor(t) },
    h('span', { class: 'tm' }, 'Tarea'),
    h('span', { class: 'tbox' }, t.done ? '✓' : ''),
    h('span', { class: 'tt' }, t.title || MESSAGES.untitled));

const eventRow = (ctx, e) =>
  h('button', { class: 'ag-ev', style: `--c:${calendarColor(e.cal)}`, onclick: () => ctx.actions.openEventDetail(e) },
    h('span', { class: 'tm' }, timeLabel(e)),
    h('span', { class: 'dot' }),
    h('span', { class: 'tt' }, e.title || MESSAGES.untitled, e.location ? h('small', {}, e.location) : null));

function render(ctx) {
  const { state, actions } = ctx;
  const start = new Date(state.cursor), end = addDays(start, RANGE_DAYS);
  const events = ctx.queries.occurrencesByDay(start, end);
  const tasks = tasksByDue(state, ymd(start), ymd(end));
  const keys = [...new Set([...Object.keys(events), ...Object.keys(tasks)])].sort();
  const wrap = h('div', { class: 'agenda' });

  if (!keys.length) {
    wrap.append(h('div', { class: 'empty' },
      h('strong', {}, state.loaded ? 'Nada programado' : 'Cargando tu agenda…'),
      h('span', {}, state.loaded ? `No hay eventos en los próximos ${RANGE_DAYS} días.` : 'Tus eventos aparecerán aquí.'),
      state.loaded ? h('button', { class: 'btn primary', onclick: () => actions.openEventEditor({ date: ymd(start) }) }, 'Crear evento') : null));
    return wrap;
  }

  const todayKey = ymd(today());
  for (const k of keys) {
    const d = parseYmd(k);
    wrap.append(h('div', { class: cx('ag-day', k === todayKey && 'today') },
      h('div', { class: 'ag-date' }, h('b', {}, d.getDate()), h('small', {}, fmt(d, { weekday: 'short' }), h('br'), fmt(d, { month: 'short' }))),
      h('div', { class: 'ag-list' },
        (tasks[k] || []).map(t => taskRow(ctx, t)),
        (events[k] || []).map(e => eventRow(ctx, e)))));
  }
  return wrap;
}

export const agendaView = {
  id: 'agenda',
  title: state => `Desde ${fmt(state.cursor, { day: 'numeric', month: 'long', year: 'numeric' })}`,
  step: (cursor, dir) => addDays(cursor, 30 * dir),
  render,
};
