// Chips compactos de evento y tarea (mes y franja "todo el día").
import { h, cx } from '../../utils/dom.js';
import { calendarColor } from '../../config/calendars.js';
import { MESSAGES } from '../../config/constants.js';
import { timeLabel } from '../../domain/events.js';

const stop = fn => ev => { ev.stopPropagation(); fn(); };

export function eventChip(ctx, e) {
  return h('button', {
    class: cx('chip', e.allDay && 'all'),
    style: `--c:${calendarColor(e.cal)}`,
    title: `${timeLabel(e)} · ${e.title || ''}`,
    onclick: stop(() => ctx.actions.openEventDetail(e)),
  },
  e.allDay ? null : h('span', { class: 'dot' }),
  e.allDay ? null : h('span', { class: 'tm' }, e.start),
  h('span', { class: 'tt' }, e.title || MESSAGES.untitled));
}

export function taskChip(ctx, t) {
  return h('button', {
    class: cx('chip', t.done && 'done'),
    style: '--c:var(--accent)',
    title: 'Tarea: ' + (t.title || ''),
    onclick: stop(() => ctx.actions.openTaskEditor(t)),
  },
  h('span', { class: 'tbox' }, t.done ? '✓' : ''),
  h('span', { class: 'tt' }, t.title || MESSAGES.untitled));
}
