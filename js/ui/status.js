/** Indicador de conexión de la barra superior. kind: 'load' | 'ok' | 'warn'. */
export function createStatusIndicator(el) {
  const label = el.querySelector('span');
  return function setStatus(kind, text) {
    el.dataset.s = kind;
    label.textContent = text;
  };
}
