// Registro del service worker (modo sin conexión). No hace nada si el navegador
// no lo admite o si la app corre dentro de un entorno que no lo permite.
export function registerServiceWorker(path = './sw.js') {
  if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(path).catch(() => { /* sin modo offline */ });
  });
}
