// Constantes de la aplicación (textos de dominio, claves de almacenamiento, horizontes).

export const DOW_SHORT = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
export const DOW_LONG = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
export const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export const REPEAT_OPTIONS = {
  none: 'No se repite',
  daily: 'Cada día',
  weekly: 'Cada semana',
  monthly: 'Cada mes',
  yearly: 'Cada año',
};

/** Horizontes de los objetivos y cuántos meses abarca cada uno (week se trata aparte). */
export const HORIZONS = [
  { id: 'week', name: 'Semana', empty: 'esta semana' },
  { id: 'month', name: 'Mes', empty: 'este mes', months: 1 },
  { id: 'quarter', name: 'Trimestre', empty: 'este trimestre', months: 3 },
  { id: 'half', name: 'Semestre', empty: 'este semestre', months: 6 },
  { id: 'year', name: 'Año', empty: 'este año', months: 12 },
];
export const horizonOf = id => HORIZONS.find(z => z.id === id) || HORIZONS[0];

export const STORAGE_KEYS = {
  prefs: 'agenda.prefs',
  events: 'agenda.events.local',
  tasks: 'agenda.tasks.local',
  goals: 'agenda.goals.local',
};

export const GOALS_HASH = '#objetivos';

export const MESSAGES = {
  readOnly: 'Esta agenda es de solo lectura para ti.',
  deleteFailed: 'No se pudo borrar. Inténtalo de nuevo.',
  untitled: '(Sin título)',
};
