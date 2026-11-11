// Catálogo de calendarios. Para añadir uno nuevo basta con agregarlo aquí
// y definir su color --c-<id> en css/tokens.css (Open/Closed).
export const CALENDARS = [
  { id: 'personal', name: 'Personal' },
  { id: 'trabajo', name: 'Trabajo' },
  { id: 'salud', name: 'Salud' },
  { id: 'familia', name: 'Familia' },
  { id: 'social', name: 'Social' },
];

export const DEFAULT_CALENDAR = 'personal';

/** Id del "calendario" virtual que muestra/oculta las tareas en las vistas. */
export const TASKS_CALENDAR = 'tareas';

export const calendarOf = id => CALENDARS.find(c => c.id === (id || DEFAULT_CALENDAR));

export const calendarColor = id =>
  `var(--c-${CALENDARS.some(c => c.id === id) ? id : DEFAULT_CALENDAR})`;
