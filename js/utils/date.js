// Utilidades de fechas puras (sin estado ni DOM). Las fechas "clave" usan el formato YYYY-MM-DD.

export const DAY_MS = 864e5;
export const MINUTES_PER_DAY = 24 * 60;

export const pad = n => String(n).padStart(2, '0');

/** Date → 'YYYY-MM-DD' (hora local). */
export const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** 'YYYY-MM-DD' → Date a medianoche local. */
export const parseYmd = s => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export const addMonths = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, 1);

export const firstOfMonth = d => new Date(d.getFullYear(), d.getMonth(), 1);

/** Índice de día de la semana empezando en lunes (0 = lunes … 6 = domingo). */
export const weekdayIndex = d => (d.getDay() + 6) % 7;

export const isWeekend = d => weekdayIndex(d) >= 5;

/** Lunes de la semana de `d`. */
export const startOfWeek = d => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return addDays(x, -weekdayIndex(x));
};

export const today = () => {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
};

export const dayDiff = (a, b) => Math.round((b - a) / DAY_MS);

/** 'HH:MM' → minutos desde medianoche. */
export const toMin = t => {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

/** minutos → 'HH:MM'. */
export const fromMin = m => `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`;

export const nowMinutes = () => {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
};

/** Semana ISO 8601: [año, semana]. */
export function isoWeek(d) {
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  t.setDate(t.getDate() - weekdayIndex(t) + 3);
  const fy = t.getFullYear();
  const jan4 = new Date(fy, 0, 4);
  return [fy, 1 + Math.round(((t - jan4) / DAY_MS - 3 + weekdayIndex(jan4)) / 7)];
}

const formatters = new Map();
/** Formatea con Intl en español, reutilizando instancias. */
export function fmt(d, options) {
  const key = JSON.stringify(options);
  if (!formatters.has(key)) formatters.set(key, new Intl.DateTimeFormat('es', options));
  return formatters.get(key).format(d);
}
