/**
 * Registro de vistas (Open/Closed + Liskov): todas cumplen la misma interfaz y el
 * resto de la app las usa sin saber cuál es. Para añadir una vista nueva basta con
 * crear su módulo y registrarlo en main.js.
 *
 * @typedef {Object} ViewDefinition
 * @property {string} id
 * @property {(state:Object) => string} title                 Texto del periodo en la cabecera.
 * @property {((cursor:Date, dir:number) => Date)|null} step  Navegación ‹ ›; null = sin navegación.
 * @property {(ctx:Object, opts:{keepScroll?:number}) => HTMLElement} render
 * @property {boolean} [refreshEachMinute]                     Re-render periódico (línea de "ahora", rachas…).
 */
export class ViewRegistry {
  #views = new Map();
  #fallback;

  register(view) {
    this.#views.set(view.id, view);
    this.#fallback ??= view.id;
    return this;
  }

  setFallback(id) {
    this.#fallback = id;
    return this;
  }

  has(id) {
    return this.#views.has(id);
  }

  get(id) {
    return this.#views.get(id) || this.#views.get(this.#fallback);
  }
}

/** Marca el contenedor con scroll propio y restaura la posición tras un re-render. */
export function scrollRoot(el, keepScroll, fallback) {
  el.dataset.scrollRoot = '';
  requestAnimationFrame(() => {
    const top = keepScroll ?? fallback;
    if (top) el.scrollTop = top;
    el.dataset.ready = '1';
  });
  return el;
}

/** Lee la posición de scroll de la vista actual (si ya terminó de montarse). */
export function currentScroll(viewEl) {
  const el = viewEl.querySelector('[data-scroll-root]');
  return el && el.dataset.ready ? el.scrollTop : undefined;
}
