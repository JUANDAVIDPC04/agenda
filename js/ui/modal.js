// Gestor de diálogos modales: un único modal abierto a la vez.
import { h } from '../utils/dom.js';

export class Modal {
  #root;
  #onClose = null;

  constructor(root) {
    this.#root = root;
  }

  get isOpen() {
    return !!this.#root.firstChild;
  }

  show(dialog, onClose) {
    this.close();
    this.#onClose = onClose || null;
    const scrim = h('div', { class: 'scrim', onclick: e => { if (e.target === scrim) this.close(); } }, dialog);
    this.#root.append(scrim);
    setTimeout(() => (dialog.querySelector('[autofocus]') || dialog.querySelector('button,input'))?.focus(), 0);
  }

  close = () => {
    this.#root.replaceChildren();
    if (this.#onClose) {
      const fn = this.#onClose;
      this.#onClose = null;
      fn();
    }
  };
}
