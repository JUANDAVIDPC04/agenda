// Formulario para crear o editar un evento.
import { h } from '../../utils/dom.js';
import { ymd, parseYmd, toMin, fromMin, nowMinutes, MINUTES_PER_DAY } from '../../utils/date.js';
import { CALENDARS, DEFAULT_CALENDAR, calendarColor } from '../../config/calendars.js';
import { REPEAT_OPTIONS } from '../../config/constants.js';
import { validateEvent } from '../../domain/events.js';
import { field, formError, submitting, kindSwitch } from '../components/form.js';

function defaults(state, init) {
  const ev = { title: '', date: ymd(state.cursor), start: '09:00', end: '10:00', allDay: false, cal: DEFAULT_CALENDAR, repeat: 'none', until: '', location: '', notes: '', ...init };
  if (!init.start && !init.id) {
    // Sugerir la próxima media hora
    const m = Math.min(22 * 60, Math.ceil(nowMinutes() / 30) * 30);
    ev.start = fromMin(m);
    ev.end = fromMin(m + 60);
  }
  return ev;
}

export function openEventEditor(ctx, init = {}, onClose) {
  const { state, services, modal, toast, actions } = ctx;
  if (!ctx.guardWritable()) { onClose?.(); return; }

  const ev = defaults(state, init);
  const isEdit = !!ev.id;
  const f = {};
  const error = formError();

  // Horas: al cambiar el inicio se conserva la duración
  f.start = h('input', { class: 'in', type: 'time', id: 'f-start', value: ev.start, step: '300' });
  f.end = h('input', { class: 'in', type: 'time', id: 'f-end', value: ev.end, step: '300' });
  f.start.addEventListener('change', () => {
    const dur = toMin(ev.end) - toMin(ev.start);
    ev.start = f.start.value;
    if (dur > 0) f.end.value = fromMin(Math.min(toMin(ev.start) + dur, MINUTES_PER_DAY - 1));
    ev.end = f.end.value;
  });
  f.end.addEventListener('change', () => { ev.end = f.end.value; });
  const timeRow = h('div', { class: 'row', hidden: ev.allDay }, field('Empieza', 'f-start', f.start), field('Termina', 'f-end', f.end));

  f.until = h('input', { class: 'in', type: 'date', id: 'f-until', value: ev.until || '' });
  const untilField = field('Hasta (opcional)', 'f-until', f.until);
  untilField.hidden = ev.repeat === 'none';

  f.title = h('input', { class: 'title-in', id: 'f-title', placeholder: 'Añade un título', value: ev.title, autofocus: true, 'aria-label': 'Título', maxlength: '140' });
  f.date = h('input', { class: 'in', type: 'date', id: 'f-date', value: ev.date, required: true });
  f.allDay = h('input', { type: 'checkbox', id: 'f-allday', checked: ev.allDay, onchange: () => { timeRow.hidden = f.allDay.checked; } });
  f.repeat = h('select', { class: 'in', id: 'f-repeat', onchange: () => { untilField.hidden = f.repeat.value === 'none'; } },
    Object.entries(REPEAT_OPTIONS).map(([k, v]) => h('option', { value: k, selected: ev.repeat === k }, v)));
  f.location = h('input', { class: 'in', id: 'f-location', value: ev.location || '', placeholder: 'Añade un lugar' });
  f.notes = h('textarea', { class: 'in', id: 'f-notes', placeholder: 'Detalles, enlaces, lo que necesites recordar' });
  f.notes.value = ev.notes || '';

  const readForm = form => {
    const allDay = f.allDay.checked;
    const out = {
      ...(isEdit ? { id: ev.id } : {}),
      title: f.title.value.trim(),
      date: f.date.value,
      allDay,
      start: allDay ? '' : f.start.value,
      end: allDay ? '' : f.end.value,
      cal: form.querySelector('input[name="cal"]:checked')?.value || DEFAULT_CALENDAR,
      repeat: f.repeat.value,
      until: f.repeat.value === 'none' ? '' : f.until.value,
      location: f.location.value.trim(),
      notes: f.notes.value.trim(),
    };
    if (ev.example && out.title === ev.title) out.example = true;
    return out;
  };

  const form = h('form', {
    class: 'dialog', role: 'dialog', 'aria-modal': 'true', 'aria-label': isEdit ? 'Editar evento' : 'Nuevo evento',
    onsubmit: e => {
      e.preventDefault();
      const out = readForm(form);
      const invalid = validateEvent(out);
      if (invalid) return error.show(invalid);
      submitting(form, error, async () => {
        await services.events.save(out);
        state.cursor = parseYmd(out.date);
        modal.close();
        ctx.render();
        toast(isEdit ? 'Cambios guardados' : 'Evento creado');
      });
    },
  },
  isEdit
    ? h('h2', {}, 'Editar evento')
    : kindSwitch('event', { onTask: () => actions.openTaskEditor({ title: f.title.value.trim(), due: f.date.value }) }),
  f.title,
  h('div', { class: 'row' }, field('Fecha', 'f-date', f.date), h('label', { class: 'check' }, f.allDay, 'Todo el día')),
  timeRow,
  h('div', { class: 'row' }, field('Repetir', 'f-repeat', f.repeat), untilField),
  h('div', { class: 'field' }, h('span', { class: 'lbl-sm' }, 'Calendario'),
    h('div', { class: 'swatches', role: 'radiogroup', 'aria-label': 'Calendario' },
      CALENDARS.map(c => h('label', { style: `--c:${calendarColor(c.id)}` },
        h('input', { type: 'radio', name: 'cal', value: c.id, id: 'f-cal-' + c.id, checked: (ev.cal || DEFAULT_CALENDAR) === c.id }),
        h('i'), c.name)))),
  field('Lugar', 'f-location', f.location),
  field('Notas', 'f-notes', f.notes),
  error.el,
  h('div', { class: 'actions' },
    h('button', { class: 'btn', type: 'button', onclick: modal.close }, 'Cancelar'),
    h('button', { class: 'btn primary', type: 'submit' }, 'Guardar')));

  modal.show(form, onClose);
}
