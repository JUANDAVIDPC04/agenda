// Formulario para crear o editar una tarea.
import { h } from '../../utils/dom.js';
import { ymd } from '../../utils/date.js';
import { nowIso } from '../../utils/id.js';
import { MESSAGES } from '../../config/constants.js';
import { confirmBar } from '../components/confirm-bar.js';
import { field, formError, submitting, kindSwitch, dialogActions } from '../components/form.js';

export function openTaskEditor(ctx, init = {}) {
  const { state, services, modal, toast, actions } = ctx;
  if (!ctx.guardWritable()) return;

  const base = (init.id && services.tasks.find(init.id)) || init;
  const t = { title: '', due: '', notes: '', done: false, ...base };
  const isEdit = !!t.id;
  const error = formError();

  const f = {
    title: h('input', { class: 'title-in', id: 'ft-title', placeholder: '¿Qué tienes que hacer?', value: t.title, autofocus: true, 'aria-label': 'Título', maxlength: '200' }),
    due: h('input', { class: 'in', type: 'date', id: 'ft-due', value: t.due || '' }),
    done: h('input', { type: 'checkbox', id: 'ft-done', checked: !!t.done }),
    notes: h('textarea', { class: 'in', id: 'ft-notes', placeholder: 'Detalles, pasos, enlaces' }),
  };
  f.notes.value = t.notes || '';

  const confirm = confirmBar('¿Borrar esta tarea?', async () => {
    try { await services.tasks.remove(t.id); modal.close(); toast('Tarea borrada'); }
    catch { toast(MESSAGES.deleteFailed); }
  });

  const readForm = () => {
    const done = f.done.checked;
    const out = {
      ...(isEdit ? { id: t.id } : {}),
      title: f.title.value.trim(),
      due: f.due.value,
      notes: f.notes.value.trim(),
      done,
      doneAt: done ? (t.doneAt || nowIso()) : '',
      createdAt: t.createdAt || nowIso(),
    };
    if (t.example && out.title === t.title) out.example = true;
    return out;
  };

  const form = h('form', {
    class: 'dialog', role: 'dialog', 'aria-modal': 'true', 'aria-label': isEdit ? 'Editar tarea' : 'Nueva tarea',
    onsubmit: e => {
      e.preventDefault();
      const out = readForm();
      if (!out.title) return error.show('Escribe un título para la tarea.');
      submitting(form, error, async () => {
        await services.tasks.save(out);
        modal.close();
        ctx.render();
        toast(isEdit ? 'Cambios guardados' : 'Tarea creada');
      });
    },
  },
  isEdit
    ? h('h2', {}, 'Editar tarea')
    : kindSwitch('task', { onEvent: () => actions.openEventEditor({ date: f.due.value || ymd(state.cursor), title: f.title.value.trim() }) }),
  f.title,
  h('div', { class: 'row' }, field('Fecha límite (opcional)', 'ft-due', f.due), h('label', { class: 'check' }, f.done, 'Completada')),
  field('Notas', 'ft-notes', f.notes),
  error.el,
  confirm.el,
  dialogActions({
    onDelete: isEdit ? confirm.open : null,
    onCancel: modal.close,
    extra: [h('button', { class: 'btn primary', type: 'submit' }, 'Guardar')],
  }));

  modal.show(form);
}
