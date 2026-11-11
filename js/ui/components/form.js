// Piezas de formulario compartidas por los diálogos.
import { h } from '../../utils/dom.js';

/** Campo con etiqueta. */
export const field = (label, forId, control, extraClass = '') =>
  h('div', { class: 'field' + (extraClass ? ' ' + extraClass : '') }, h('label', { for: forId }, label), control);

/** Mensaje de error del formulario. */
export function formError() {
  const el = h('div', { class: 'err', hidden: true });
  return {
    el,
    show(message) { el.textContent = message; el.hidden = false; },
  };
}

/**
 * Envuelve el envío de un formulario: desactiva el botón mientras guarda
 * y muestra el error si la operación falla.
 */
export async function submitting(form, error, task) {
  const btn = form.querySelector('button[type=submit]');
  const label = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Guardando…';
  try {
    await task();
  } catch (x) {
    btn.disabled = false;
    btn.textContent = label;
    error.show(x.message);
  }
}

/** Selector "Evento | Tarea" que aparece al crear. */
export const kindSwitch = (active, { onEvent, onTask }) =>
  h('div', { class: 'seg kind', role: 'group', 'aria-label': 'Tipo' },
    h('button', { type: 'button', 'aria-pressed': String(active === 'event'), onclick: active === 'event' ? null : onEvent }, 'Evento'),
    h('button', { type: 'button', 'aria-pressed': String(active === 'task'), onclick: active === 'task' ? null : onTask }, 'Tarea'));

/** Botonera estándar Borrar · Cancelar · Guardar. */
export const dialogActions = ({ onDelete, onCancel, cancelLabel = 'Cancelar', extra = [] }) =>
  h('div', { class: 'actions' },
    onDelete ? h('button', { class: 'btn danger', type: 'button', onclick: onDelete }, 'Borrar') : null,
    h('div', { class: 'spacer' }),
    h('button', { class: 'btn', type: 'button', onclick: onCancel }, cancelLabel),
    ...extra);
