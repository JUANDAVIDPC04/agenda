// Vistas Semana y Día: rejilla horaria con arrastre para crear eventos.
import { h, cx } from '../../utils/dom.js';
import { pad, ymd, addDays, startOfWeek, today, isWeekend, weekdayIndex, nowMinutes, fromMin, fmt, MINUTES_PER_DAY } from '../../utils/date.js';
import { DOW_LONG, MESSAGES } from '../../config/constants.js';
import { calendarColor } from '../../config/calendars.js';
import { selectors } from '../../state/app-state.js';
import { layoutDay, timeLabel } from '../../domain/events.js';
import { eventChip, taskChip } from '../components/chips.js';
import { scrollRoot } from './view-registry.js';

const HOURS_COLUMN = '56px';
const DEFAULT_SCROLL_HOUR = 7;

const hourHeight = () =>
  parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hour')) || 48;

/** Permite arrastrar sobre una columna para crear un evento en ese rango. */
function attachDragToCreate(ctx, colEl, date, hourPx) {
  let startMin = null, ghost = null;
  const minuteAt = ev => {
    const r = colEl.getBoundingClientRect();
    return Math.max(0, Math.min(MINUTES_PER_DAY, Math.round(((ev.clientY - r.top) / hourPx * 60) / 15) * 15));
  };
  const update = endMin => {
    const a = Math.min(startMin, endMin), b = Math.max(startMin, endMin);
    ghost.style.top = a / 60 * hourPx + 'px';
    ghost.style.height = Math.max(b - a, 15) / 60 * hourPx + 'px';
    ghost.dataset.a = a;
    ghost.dataset.b = b;
  };

  colEl.addEventListener('pointerdown', ev => {
    if (ev.button !== 0) return;
    startMin = Math.floor(minuteAt(ev) / 30) * 30;
    ghost = h('div', { class: 'ghost' });
    colEl.append(ghost);
    update(startMin + 60);
    colEl.setPointerCapture(ev.pointerId);
  });
  colEl.addEventListener('pointermove', ev => {
    if (startMin == null) return;
    const m = minuteAt(ev);
    update(m === startMin ? startMin + 60 : m);
  });
  colEl.addEventListener('pointerup', () => {
    if (startMin == null) return;
    const a = +ghost.dataset.a;
    let b = +ghost.dataset.b;
    if (b - a < 15) b = a + 60;
    b = Math.min(b, MINUTES_PER_DAY - 1);
    startMin = null;
    const g = ghost;
    ctx.actions.openEventEditor({ date, start: fromMin(a), end: fromMin(b) }, () => g?.remove());
  });
  colEl.addEventListener('pointercancel', () => { startMin = null; ghost?.remove(); });
}

function eventBlock(ctx, it, hourPx) {
  const e = it.e;
  const top = it.s / 60 * hourPx;
  const height = Math.max((it.en - it.s) / 60 * hourPx - 2, 18);
  const w = 100 / it.n;
  return h('button', {
    class: cx('ev', height < 34 && 'short'),
    style: `--c:${calendarColor(e.cal)};top:${top}px;height:${height}px;left:calc(${w * it.lane}% + 2px);width:calc(${w}% - 4px)`,
    title: `${timeLabel(e)} · ${e.title || ''}`,
    onpointerdown: ev => ev.stopPropagation(),
    onclick: ev => { ev.stopPropagation(); ctx.actions.openEventDetail(e); },
  },
  h('b', {}, e.title || MESSAGES.untitled),
  h('span', {}, timeLabel(e) + (e.location && height >= 50 ? ' · ' + e.location : '')));
}

function renderTimeGrid(ctx, days, keepScroll) {
  const { state, actions } = ctx;
  const start = days === 7 ? startOfWeek(state.cursor) : new Date(state.cursor);
  const byDay = ctx.queries.occurrencesByDay(start, addDays(start, days));
  const todayKey = ymd(today());
  const hourPx = hourHeight();
  const columns = `grid-template-columns:${HOURS_COLUMN} repeat(${days},minmax(0,1fr))`;

  const head = h('div', { class: 'tg-head', style: columns }, h('div', {}));
  const allDay = h('div', { class: 'tg-allday', style: columns }, h('div', { class: 'lbl' }, 'día'));
  const inner = h('div', { class: 'tg-inner', style: columns });

  const hours = h('div', { class: 'hours' });
  for (let i = 1; i < 24; i++) hours.append(h('span', { style: `top:calc(var(--hour) * ${i})` }, `${pad(i)}:00`));
  inner.append(hours);

  for (let i = 0; i < days; i++) {
    const d = addDays(start, i), k = ymd(d), list = byDay[k] || [];
    head.append(h('div', { class: cx('hcell', k === todayKey && 'today') },
      h('small', {}, DOW_LONG[weekdayIndex(d)]),
      h('button', { 'aria-label': 'Ver día ' + fmt(d, { day: 'numeric', month: 'long' }), onclick: () => actions.goToDay(d) }, d.getDate())));

    allDay.append(h('div', { class: 'ad' },
      selectors.tasksOn(state, k).map(t => taskChip(ctx, t)),
      list.filter(e => e.allDay).map(e => eventChip(ctx, e))));

    const col = h('div', { class: cx('col', isWeekend(d) && 'weekend'), 'data-date': k });
    for (const it of layoutDay(list.filter(e => !e.allDay))) col.append(eventBlock(ctx, it, hourPx));
    if (k === todayKey) col.append(h('div', { class: 'nowline', style: `top:${nowMinutes() / 60 * hourPx}px` }));
    attachDragToCreate(ctx, col, k, hourPx);
    inner.append(col);
  }

  const body = scrollRoot(h('div', { class: 'tg-body' }, inner), keepScroll, DEFAULT_SCROLL_HOUR * hourPx - 8);
  return h('div', { class: 'tgrid-wrap' }, head, allDay, body);
}

function weekTitle(state) {
  const s = startOfWeek(state.cursor), e = addDays(s, 6);
  return s.getMonth() === e.getMonth()
    ? `${s.getDate()}–${e.getDate()} de ${fmt(s, { month: 'long', year: 'numeric' })}`
    : `${fmt(s, { day: 'numeric', month: 'short' })} – ${fmt(e, { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

export const weekView = {
  id: 'week',
  title: weekTitle,
  step: (cursor, dir) => addDays(cursor, 7 * dir),
  render: (ctx, { keepScroll }) => renderTimeGrid(ctx, 7, keepScroll),
  refreshEachMinute: true,
};

export const dayView = {
  id: 'day',
  title: state => fmt(state.cursor, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
  step: (cursor, dir) => addDays(cursor, dir),
  render: (ctx, { keepScroll }) => renderTimeGrid(ctx, 1, keepScroll),
  refreshEachMinute: true,
};
