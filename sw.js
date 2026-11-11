// Service worker: guarda la app en caché para que se abra y funcione sin conexión.
// La lista PRECACHE y la versión las genera `node tools/build-sw.mjs`; no las edites a mano.

const VERSION = '79162c09';
const PRECACHE = [
  './',
  './css/base.css',
  './css/components/chip.css',
  './css/components/dialog.css',
  './css/components/install.css',
  './css/components/quote.css',
  './css/components/sidebar.css',
  './css/layout.css',
  './css/tokens.css',
  './css/views/agenda.css',
  './css/views/goals.css',
  './css/views/month.css',
  './css/views/tasks.css',
  './css/views/timegrid.css',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon.svg',
  './icons/maskable-192.png',
  './icons/maskable-512.png',
  './index.html',
  './js/config/calendars.js',
  './js/config/constants.js',
  './js/config/quotes.js',
  './js/controllers/keyboard.js',
  './js/controllers/navigation.js',
  './js/data/collection.js',
  './js/data/local-collection.js',
  './js/data/preferences.js',
  './js/data/remote-collection.js',
  './js/data/storage-error.js',
  './js/data/storage-factory.js',
  './js/domain/events.js',
  './js/domain/goals.js',
  './js/domain/quotes.js',
  './js/domain/tasks.js',
  './js/main.js',
  './js/pwa/install-prompt.js',
  './js/pwa/service-worker.js',
  './js/services/collection-service.js',
  './js/services/event-service.js',
  './js/services/goal-service.js',
  './js/services/task-service.js',
  './js/state/app-state.js',
  './js/ui/components/chips.js',
  './js/ui/components/confirm-bar.js',
  './js/ui/components/form.js',
  './js/ui/dialogs/event-detail.js',
  './js/ui/dialogs/event-editor.js',
  './js/ui/dialogs/goal-editor.js',
  './js/ui/dialogs/task-editor.js',
  './js/ui/header.js',
  './js/ui/modal.js',
  './js/ui/quote-panel.js',
  './js/ui/sidebar/calendar-list.js',
  './js/ui/sidebar/mini-calendar.js',
  './js/ui/sidebar/upcoming.js',
  './js/ui/status.js',
  './js/ui/toast.js',
  './js/ui/views/agenda-view.js',
  './js/ui/views/goals-view.js',
  './js/ui/views/month-view.js',
  './js/ui/views/tasks-view.js',
  './js/ui/views/time-grid-view.js',
  './js/ui/views/view-registry.js',
  './js/utils/date.js',
  './js/utils/dom.js',
  './js/utils/id.js',
  './manifest.webmanifest',
];

const APP_CACHE = `agenda-app-${VERSION}`;
const FONTS_CACHE = 'agenda-fonts-v1';
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(APP_CACHE)
      .then(cache => cache.addAll(PRECACHE.map(p => new Request(p, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keep = new Set([APP_CACHE, FONTS_CACHE]);
    for (const key of await caches.keys()) if (!keep.has(key)) await caches.delete(key);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Fuentes de Google: caché primero (no cambian).
  if (FONT_HOSTS.includes(url.hostname)) {
    event.respondWith(cacheFirst(FONTS_CACHE, request));
    return;
  }
  if (url.origin !== self.location.origin) return;

  // Navegación: siempre la página principal (la app es de una sola página).
  if (request.mode === 'navigate') {
    event.respondWith(caches.match('./index.html', { ignoreSearch: true }).then(r => r || fetch(request)));
    return;
  }
  event.respondWith(cacheFirst(APP_CACHE, request));
});

async function cacheFirst(cacheName, request) {
  const cached = await caches.match(request, { ignoreSearch: true });
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok || response.type === 'opaque') {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}
