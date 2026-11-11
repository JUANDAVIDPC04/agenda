// Diálogo de solo lectura con el detalle de un evento.
import { h } from '../../utils/dom.js';
import { parseYmd, fmt } from '../../utils/date.js';
import { calendarOf, calendarColor } from '../../config/calendars.js';
import { REPEAT_OPTIONS, MESSAGES } from '../../config/constants.js';
import { isRecurring, timeLabel } from '../../domain/events.js';
import { confirmBar } from '../components/confirm-bar.js';
import { dialogActions } from '../components/form.js';

const metaRow = (icon, ...content) => h('div', {}, h('span', { class: 'k' }, icon), ...content);

export function openEventDetail(ctx, occurrence) {
  const { state, services, modal, toast, actions } = ctx;
  const ev = services.events.find(occurrence.id) || occurrence;
  const cal = calendarOf(ev.cal);
  const occDate = parseYmd(occurrence.occ || ev.date);

  const confirm = confirmBar(
    isRecurring(ev) ? '¿Borrar este evento y todas sus repeticiones?' : '¿Borrar este evento?',
    async () => {
      try { await services.events.remove(ev.id); modal.close(); toast('Evento borrado'); }
      catch { toast(MESSAGES.deleteFailed); }
    });

  const recurrence = isRecurring(ev)
    ? REPEAT_OPTIONS[ev.repeat] + (ev.until ? ' hasta el ' + fmt(parseYmd(ev.until), { day: 'numeric', month: 'long', year: 'numeric' }) : '')
    : null;

  const dialog = h('div', { class: 'dialog', role: 'dialog', 'aria-modal': 'true', 'aria-label': ev.title || 'Evento', style: `--c:${calendarColor(ev.cal)}` },
    h('div', { class: 'detail-title' }, h('i'),
      h('div', {},
        h('h2', {}, ev.title || MESSAGES.untitled),
        h('div', { class: 'detail-when' }, fmt(occDate, { weekday: 'long', day: 'numeric', month: 'long' }) + ' · ' + timeLabel(ev)))),
    h('div', { class: 'detail-meta' },
      recurrence ? metaRow('↻', recurrence) : null,
      ev.location ? metaRow('⌖', ev.location) : null,
      ev.notes ? metaRow('≡', h('span', { class: 'notes' }, ev.notes)) : null,
      metaRow('●', cal ? cal.name : 'Personal')),
    confirm.el,
    dialogActions({
      onDelete: state.readOnly ? null : confirm.open,
      onCancel: modal.close,
      cancelLabel: 'Cerrar',
      extra: state.readOnly ? [] : [h('button', { class: 'btn primary', autofocus: true, onclick: () => actions.openEventEditor(ev) }, 'Editar')],
    }));

  modal.show(dialog);
}
