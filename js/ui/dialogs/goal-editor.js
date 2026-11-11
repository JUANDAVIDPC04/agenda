// Formulario para editar un objetivo existente (los nuevos se crean desde la vista).
import { h } from '../../utils/dom.js';
import { horizonOf, MESSAGES } from '../../config/constants.js';
import { goalProgress, goalTarget, isQuitGoal } from '../../domain/goals.js';
import { confirmBar } from '../components/confirm-bar.js';
import { field, formError, submitting, dialogActions } from '../components/form.js';

export function openGoalEditor(ctx, goal) {
  const { services, modal, toast } = ctx;
  if (!ctx.guardWritable()) return;

  const base = services.goals.find(goal.id) || goal;
  const quit = isQuitGoal(base);
  const error = formError();
  const f = {
    title: h('input', { class: 'title-in', id: 'fg-title', value: base.title || '', autofocus: true, 'aria-label': 'Título', maxlength: '200' }),
    notes: h('textarea', { class: 'in', id: 'fg-notes', placeholder: 'Por qué es importante, cómo lo vas a lograr' }),
  };
  f.notes.value = base.notes || '';

  const confirm = confirmBar('¿Borrar este objetivo?', async () => {
    try { await services.goals.remove(base.id); modal.close(); toast('Objetivo borrado'); }
    catch { toast(MESSAGES.deleteFailed); }
  });

  // Campos específicos según el tipo de objetivo
  let typeFields;
  if (quit) {
    f.since = h('input', { class: 'in', type: 'date', id: 'fg-since', value: base.since || '' });
    typeFields = h('div', { class: 'row' },
      field('Sin recaer desde', 'fg-since', f.since),
      h('div', { class: 'field' }, h('span', { class: 'lbl-sm' }, 'Recaídas registradas'), h('span', { class: 'value' }, String((base.slips || []).length))));
  } else {
    f.progress = h('input', { class: 'in', type: 'number', id: 'fg-progress', min: '0', value: String(goalProgress(base)) });
    f.target = h('input', { class: 'in', type: 'number', id: 'fg-target', min: '1', value: String(goalTarget(base)) });
    typeFields = h('div', { class: 'row' }, field('Avance', 'fg-progress', f.progress), field('Meta', 'fg-target', f.target));
  }

  const readForm = () => {
    const out = { ...base, title: f.title.value.trim(), notes: f.notes.value.trim() };
    if (quit) {
      if (f.since.value) out.since = f.since.value;
    } else {
      const target = Math.max(1, Math.round(+f.target.value || 1));
      out.target = target;
      out.progress = Math.min(target, Math.max(0, Math.round(+f.progress.value || 0)));
    }
    if (base.example && out.title !== base.title) delete out.example;
    return out;
  };

  const form = h('form', {
    class: 'dialog', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Editar objetivo',
    onsubmit: e => {
      e.preventDefault();
      const out = readForm();
      if (!out.title) return error.show('Escribe un título para el objetivo.');
      submitting(form, error, async () => {
        await services.goals.save(out);
        modal.close();
        ctx.render();
        toast('Cambios guardados');
      });
    },
  },
  h('h2', {}, 'Editar objetivo'),
  h('div', { class: 'subtitle' }, `${quit ? 'Dejar · ' : ''}${horizonOf(base.horizon).name} · ${base.period || ''}`),
  f.title,
  typeFields,
  field('Notas', 'fg-notes', f.notes),
  error.el,
  confirm.el,
  dialogActions({
    onDelete: confirm.open,
    onCancel: modal.close,
    extra: [h('button', { class: 'btn primary', type: 'submit' }, 'Guardar')],
  }));

  modal.show(form);
}
