// Estado de la aplicación: un único objeto, creado aquí y compartido por inyección.
import { TASKS_CALENDAR } from '../config/calendars.js';
import { GOALS_HASH } from '../config/constants.js';
import { today, firstOfMonth } from '../utils/date.js';
import { loadPreferences } from '../data/preferences.js';

export function createAppState() {
  const prefs = loadPreferences();
  const state = {
    // Navegación
    view: prefs.view || 'week',
    prevView: 'week',
    cursor: today(),
    miniMonth: firstOfMonth(today()),
    hidden: new Set(prefs.hidden),

    // Datos
    events: [],
    tasks: [],
    goals: [],

    // Conexión
    store: 'loading',
    readOnly: false,
    loaded: false,

    // Borradores de formularios en línea (sobreviven a los re-render)
    drafts: {
      task: { title: '', due: '', focus: false, showDone: false },
      goal: { type: 'achieve', title: '', target: '', since: '', focus: false },
    },

    // Objetivos
    horizon: 'week',
    goalsCursor: today(),
  };

  // Accesos directos del icono instalado: ?vista=tasks
  const requested = new URLSearchParams(location.search).get('vista');
  if (requested) state.view = requested;
  else if (window.innerWidth < 640 && state.view === 'week') state.view = 'day';
  if (state.view === 'goals') state.view = 'week';
  if (location.hash === GOALS_HASH) {
    state.prevView = state.view;
    state.view = 'goals';
  }
  return state;
}

/** Selectores: lecturas derivadas del estado. */
export const selectors = {
  isCalendarHidden: (state, calId) => state.hidden.has(calId),
  tasksVisible: state => !state.hidden.has(TASKS_CALENDAR),
  tasksOn: (state, key) => (selectors.tasksVisible(state) ? state.tasks.filter(t => t.due === key) : []),
  hasExamples: state => [state.events, state.tasks, state.goals].some(list => list.some(x => x.example)),
  /** Vista "persistible" (objetivos no se recuerda como vista por defecto). */
  persistentView: state => (state.view === 'goals' ? state.prevView : state.view),
};
