// Raíz de composición: crea las dependencias, las conecta entre sí y arranca la app.
// Es el único módulo que conoce las implementaciones concretas (Dependency Inversion).
import { byId, debounce } from './utils/dom.js';
import { groupByDay, occurrences } from './domain/events.js';
import { MESSAGES } from './config/constants.js';

import { createAppState, selectors } from './state/app-state.js';
import { savePreferences } from './data/preferences.js';
import { createStorage } from './data/storage-factory.js';

import { EventService } from './services/event-service.js';
import { TaskService } from './services/task-service.js';
import { GoalService } from './services/goal-service.js';

import { Modal } from './ui/modal.js';
import { createToast } from './ui/toast.js';
import { createStatusIndicator } from './ui/status.js';
import { renderHeader } from './ui/header.js';
import { renderQuote } from './ui/quote-panel.js';
import { renderMiniCalendar } from './ui/sidebar/mini-calendar.js';
import { renderCalendarList } from './ui/sidebar/calendar-list.js';
import { renderUpcoming } from './ui/sidebar/upcoming.js';

import { openEventDetail } from './ui/dialogs/event-detail.js';
import { openEventEditor } from './ui/dialogs/event-editor.js';
import { openTaskEditor } from './ui/dialogs/task-editor.js';
import { openGoalEditor } from './ui/dialogs/goal-editor.js';

import { ViewRegistry, currentScroll } from './ui/views/view-registry.js';
import { dayView, weekView } from './ui/views/time-grid-view.js';
import { monthView } from './ui/views/month-view.js';
import { agendaView } from './ui/views/agenda-view.js';
import { tasksView } from './ui/views/tasks-view.js';
import { goalsView } from './ui/views/goals-view.js';

import { createNavigation } from './controllers/navigation.js';
import { bindKeyboard } from './controllers/keyboard.js';

import { registerServiceWorker } from './pwa/service-worker.js';
import { setupInstallPrompt } from './pwa/install-prompt.js';

const CONNECT_TIMEOUT_MS = 10_000;

// ---------- DOM estático ----------
const dom = {
  app: document.querySelector('.app'),
  brandDay: byId('brandDay'),
  period: byId('period'),
  viewSwitcher: byId('viewSwitcher'),
  prevBtn: byId('prevBtn'),
  nextBtn: byId('nextBtn'),
  todayBtn: byId('todayBtn'),
  backBtn: byId('backBtn'),
  goalsBtn: byId('goalsBtn'),
  createBtn: byId('createBtn'),
  examplesNote: byId('exNote'),
  clearExamplesBtn: byId('clearEx'),
  mini: byId('mini'),
  calendars: byId('cals'),
  upcoming: byId('upcoming'),
  quote: { text: byId('qText'), author: byId('qWho'), label: byId('qLabel') },
  view: byId('view'),
};

// ---------- Contexto compartido ----------
const state = createAppState();
const setStatus = createStatusIndicator(byId('status'));
const toast = createToast(byId('toast'));
const modal = new Modal(byId('modalRoot'));

const views = new ViewRegistry()
  .register(weekView)
  .register(dayView)
  .register(monthView)
  .register(agendaView)
  .register(tasksView)
  .register(goalsView)
  .setFallback('week');
if (!views.has(state.view)) state.view = 'week';

/**
 * Contexto que reciben los módulos de UI. Exponen solo lo que necesitan:
 * estado, servicios, consultas, piezas de UI y acciones.
 */
const ctx = {
  state,
  views,
  modal,
  toast,
  services: {},
  actions: {},
  queries: {
    occurrences: (from, to) => occurrences(state.events, from, to, id => selectors.isCalendarHidden(state, id)),
    occurrencesByDay: (from, to) => groupByDay(ctx.queries.occurrences(from, to)),
  },
  render,
  savePrefs: () => savePreferences({ view: selectors.persistentView(state), hidden: state.hidden }),
  /** Devuelve false (y avisa) si la agenda es de solo lectura. */
  guardWritable() {
    if (!state.readOnly) return true;
    toast(MESSAGES.readOnly);
    return false;
  },
};

Object.assign(ctx.actions, createNavigation(ctx), {
  openEventDetail: e => openEventDetail(ctx, e),
  openEventEditor: (init, onClose) => openEventEditor(ctx, init, onClose),
  openTaskEditor: init => openTaskEditor(ctx, init),
  openGoalEditor: g => openGoalEditor(ctx, g),
});

// ---------- Render ----------
function render() {
  renderHeader(ctx, dom);
  renderMiniCalendar(ctx, dom.mini);
  renderCalendarList(ctx, dom.calendars);
  renderUpcoming(ctx, dom.upcoming);
  renderQuote(ctx, dom.quote);

  const keepScroll = currentScroll(dom.view);
  dom.view.replaceChildren(views.get(state.view).render(ctx, { keepScroll }));
}

// ---------- Persistencia ----------
async function connectStorage() {
  const storage = await createStorage();
  state.store = storage.mode;

  const deps = list => ({ getAll: () => state[list], onReadOnly: () => { state.readOnly = true; setStatus('warn', 'Solo lectura'); } });
  ctx.services.events = new EventService(storage.events, deps('events'));
  ctx.services.tasks = new TaskService(storage.tasks, deps('tasks'));
  ctx.services.goals = new GoalService(storage.goals, deps('goals'));

  if (storage.mode === 'local') setStatus('warn', 'Guardado en este navegador');
  const timer = setTimeout(() => { if (!state.loaded) setStatus('warn', 'No se pudo conectar aún'); }, CONNECT_TIMEOUT_MS);

  ctx.services.events.subscribe((items, { fromCache }) => {
    state.events = items;
    if (!fromCache && !state.loaded) {
      clearTimeout(timer);
      state.loaded = true;
      if (storage.mode === 'db') setStatus('ok', state.readOnly ? 'Solo lectura' : 'Sincronizado');
    }
    render();
  }, err => {
    clearTimeout(timer);
    state.loaded = true;
    setStatus('warn', err?.code === 'revoked' ? 'Acceso retirado' : 'Sin conexión con la agenda');
    render();
  });
  ctx.services.tasks.subscribe(items => { state.tasks = items; render(); });
  ctx.services.goals.subscribe(items => { state.goals = items; render(); });
}

// ---------- Eventos globales ----------
function bindChrome() {
  const { actions } = ctx;
  dom.prevBtn.onclick = () => actions.shift(-1);
  dom.nextBtn.onclick = () => actions.shift(1);
  dom.todayBtn.onclick = actions.goToToday;
  dom.createBtn.onclick = actions.createNew;
  dom.goalsBtn.onclick = actions.openGoals;
  dom.backBtn.onclick = actions.closeGoals;
  dom.viewSwitcher.querySelectorAll('button').forEach(b => { b.onclick = () => actions.setView(b.dataset.view); });

  dom.clearExamplesBtn.onclick = async () => {
    const { events, tasks, goals } = ctx.services;
    const groups = [[events, events.examples()], [tasks, tasks.examples()], [goals, goals.examples()]];
    const total = groups.reduce((n, [, list]) => n + list.length, 0);
    try {
      for (const [service, list] of groups) await service.removeMany(list);
      toast(`${total} ejemplos borrados`);
    } catch {
      toast('No se pudieron borrar todos los ejemplos.');
    }
  };

  window.addEventListener('hashchange', actions.syncWithHash);
  window.addEventListener('resize', debounce(render, 150));
  setInterval(() => {
    if (!modal.isOpen && views.get(state.view).refreshEachMinute) render();
  }, 60_000);
  bindKeyboard(ctx);
}

// ---------- Arranque ----------
bindChrome();
render();
connectStorage();
registerServiceWorker();
setupInstallPrompt(byId('installBanner'), toast);
