/** Crea la función de notificación breve ligada a un elemento. */
export function createToast(el, durationMs = 2600) {
  let timer;
  return function toast(message) {
    el.textContent = message;
    el.hidden = false;
    clearTimeout(timer);
    timer = setTimeout(() => (el.hidden = true), durationMs);
  };
}
