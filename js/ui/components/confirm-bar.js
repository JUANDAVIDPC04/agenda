// Barra de confirmación de borrado reutilizada por todos los diálogos.
import { h } from '../../utils/dom.js';

/**
 * @param {string} message
 * @param {() => Promise<void>|void} onConfirm
 * @returns {{ el: HTMLElement, open: () => void }}
 */
export function confirmBar(message, onConfirm) {
  const el = h('div', { class: 'confirm-bar', hidden: true },
    h('span', { class: 'msg' }, message),
    h('button', { class: 'btn', type: 'button', onclick: () => { el.hidden = true; } }, 'Cancelar'),
    h('button', { class: 'btn primary destructive', type: 'button', onclick: onConfirm }, 'Borrar'));
  return { el, open: () => { el.hidden = false; } };
}
