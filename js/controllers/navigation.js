// Casos de uso de navegación: cambiar de vista, moverse en el tiempo y entrar/salir de objetivos.
import { GOALS_HASH } from '../config/constants.js';
import { today, ymd, firstOfMonth } from '../utils/date.js';
import { shiftPeriod } from '../domain/goals.js';

export function createNavigation(ctx) {
  const { state } = ctx;

  const syncMiniMonth = () => { state.miniMonth = firstOfMonth(state.cursor); };

  const nav = {
    setView(id) {
      state.view = id;
      ctx.savePrefs();
      ctx.render();
    },

    goToDay(d) {
      state.cursor = d;
      nav.setView('day');
    },

    goToToday() {
      state.cursor = today();
      syncMiniMonth();
      ctx.render();
    },

    /** ‹ › según la estrategia de paso de la vista actual. */
    shift(dir) {
      const step = ctx.views.get(state.view).step;
      if (!step) return;
      state.cursor = step(state.cursor, dir);
      syncMiniMonth();
      ctx.render();
    },

    shiftGoals(dir) {
      state.goalsCursor = shiftPeriod(state.horizon, state.goalsCursor, dir);
      ctx.render();
    },

    openGoals() {
      if (state.view !== 'goals') state.prevView = state.view;
      state.view = 'goals';
      try { if (location.hash !== GOALS_HASH) location.hash = GOALS_HASH.slice(1); } catch { /* sandbox */ }
      ctx.render();
    },

    closeGoals() {
      state.view = state.prevView || 'week';
      try { if (location.hash) history.replaceState(null, '', location.pathname + location.search); } catch { /* sandbox */ }
      ctx.render();
    },

    /** Botón "Crear" / tecla N: crea lo que corresponde a la vista actual. */
    createNew() {
      if (state.view === 'tasks') ctx.actions.openTaskEditor({});
      else ctx.actions.openEventEditor({ date: ymd(state.cursor) });
    },

    /** Sincroniza la vista con el hash (#objetivos) al usar atrás/adelante. */
    syncWithHash() {
      const wantsGoals = location.hash === GOALS_HASH;
      if (wantsGoals && state.view !== 'goals') nav.openGoals();
      else if (!wantsGoals && state.view === 'goals') nav.closeGoals();
    },
  };
  return nav;
}
