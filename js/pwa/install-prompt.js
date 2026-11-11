// Aviso para instalar la app.
//  - Chrome, Edge, Android, Samsung Internet: botón "Instalar" (evento beforeinstallprompt).
//  - iPhone / iPad (Safari): instrucciones, porque iOS no permite un botón de instalación.
import { h } from '../utils/dom.js';

const DISMISS_KEY = 'agenda.installDismissed';

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

const isIos = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPadOS

const wasDismissed = () => { try { return !!localStorage.getItem(DISMISS_KEY); } catch { return false; } };
const rememberDismiss = () => { try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignorar */ } };

/**
 * @param {HTMLElement} slot  Contenedor donde se muestra el aviso.
 * @param {(msg:string)=>void} toast
 */
export function setupInstallPrompt(slot, toast) {
  if (isStandalone()) return;

  const show = (text, ...buttons) => {
    if (wasDismissed()) return;
    const close = h('button', { class: 'icon-btn sm', 'aria-label': 'Cerrar aviso', onclick: () => { rememberDismiss(); slot.hidden = true; } }, '×');
    slot.replaceChildren(h('img', { src: 'icons/icon-192.png', alt: '', width: 36, height: 36 }), h('span', { class: 'txt' }, text), ...buttons, close);
    slot.hidden = false;
  };

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    const deferred = e;
    show('Instala Mi Agenda para abrirla como una app, incluso sin conexión.',
      h('button', {
        class: 'btn primary',
        onclick: async () => {
          slot.hidden = true;
          deferred.prompt();
          await deferred.userChoice;
        },
      }, 'Instalar'));
  });

  window.addEventListener('appinstalled', () => {
    slot.hidden = true;
    toast('App instalada');
  });

  if (isIos()) {
    show(h('span', {}, 'Para instalarla en tu iPhone o iPad: pulsa ', h('b', {}, 'Compartir'), ' y luego ', h('b', {}, 'Añadir a pantalla de inicio'), '.'));
  }
}
