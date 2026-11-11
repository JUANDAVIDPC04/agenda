// Reglas de negocio de los eventos: recurrencias, orden, etiquetas y reparto en carriles.
import { DEFAULT_CALENDAR } from '../config/calendars.js';
import { ymd, parseYmd, addDays, toMin, DAY_MS } from '../utils/date.js';

export const isRecurring = ev => !!ev.repeat && ev.repeat !== 'none';

export const timeLabel = e => (e.allDay ? 'Todo el día' : `${e.start}${e.end ? '–' + e.end : ''}`);

// Estrategias de recurrencia (Open/Closed): para un nuevo tipo de repetición
// basta con añadir una entrada a este mapa.
const RECURRENCE = {
  none(start, from, end, push) {
    if (start >= from && start < end) push(start);
  },
  daily(start, from, end, push) {
    for (let d = start < from ? new Date(from) : new Date(start); d < end; d = addDays(d, 1)) push(d);
  },
  weekly(start, from, end, push) {
    let d = new Date(start);
    if (d < from) d = addDays(d, Math.ceil((from - d) / DAY_MS / 7) * 7);
    for (; d < end; d = addDays(d, 7)) if (d >= from) push(d);
  },
  monthly: (start, from, end, push) => stepByCalendar(start, from, end, push, i => new Date(start.getFullYear(), start.getMonth() + i, start.getDate())),
  yearly: (start, from, end, push) => stepByCalendar(start, from, end, push, i => new Date(start.getFullYear() + i, start.getMonth(), start.getDate())),
};

function stepByCalendar(start, from, end, push, nth) {
  const day = start.getDate();
  for (let i = 0; i < 600; i++) {
    const d = nth(i);
    if (d.getDate() !== day) continue; // p. ej. día 31 en meses cortos
    if (d >= end) break;
    if (d >= from) push(d);
  }
}

const compareOccurrences = (a, b) =>
  a.occ.localeCompare(b.occ) ||
  (b.allDay ? 1 : 0) - (a.allDay ? 1 : 0) ||
  toMin(a.start) - toMin(b.start) ||
  (a.title || '').localeCompare(b.title || '');

/**
 * Expande los eventos (incluidas repeticiones) dentro de [from, to).
 * Cada ocurrencia es una copia del evento con `occ` = fecha 'YYYY-MM-DD'.
 * @param {Array} events
 * @param {Date} from
 * @param {Date} to  exclusivo
 * @param {(calId:string)=>boolean} isHidden
 */
export function occurrences(events, from, to, isHidden = () => false) {
  const out = [];
  for (const ev of events) {
    if (!ev.date || isHidden(ev.cal || DEFAULT_CALENDAR)) continue;
    const strategy = RECURRENCE[ev.repeat || 'none'];
    if (!strategy) continue;
    const start = parseYmd(ev.date);
    const until = isRecurring(ev) && ev.until ? addDays(parseYmd(ev.until), 1) : null;
    const end = until && until < to ? until : to;
    if (isRecurring(ev) && start >= end) continue;
    strategy(start, from, end, d => out.push({ ...ev, occ: ymd(d) }));
  }
  return out.sort(compareOccurrences);
}

/** Agrupa una lista de ocurrencias por fecha. */
export function groupByDay(list) {
  const map = {};
  for (const e of list) (map[e.occ] ||= []).push(e);
  return map;
}

/**
 * Asigna carriles a eventos solapados de un mismo día.
 * Devuelve [{ e, s, en, lane, n }] con minutos de inicio/fin, carril y nº de carriles.
 */
export function layoutDay(list) {
  const items = list
    .map(e => ({ e, s: toMin(e.start), en: Math.max(toMin(e.end || '') || toMin(e.start) + 60, toMin(e.start) + 20) }))
    .sort((a, b) => a.s - b.s || b.en - a.en);
  let cluster = [], lanes = [], clusterEnd = -1;
  const flush = () => {
    const n = lanes.length;
    cluster.forEach(it => (it.n = n));
    cluster = [];
    lanes = [];
  };
  for (const it of items) {
    if (it.s >= clusterEnd) flush();
    let li = lanes.findIndex(end => end <= it.s);
    if (li < 0) { li = lanes.length; lanes.push(0); }
    lanes[li] = it.en;
    it.lane = li;
    cluster.push(it);
    clusterEnd = Math.max(clusterEnd, it.en);
  }
  flush();
  return items;
}

/** Valida un evento a guardar. Devuelve un mensaje de error o null. */
export function validateEvent(ev) {
  if (!ev.title) return 'Escribe un título para el evento.';
  if (!ev.date) return 'Elige una fecha.';
  if (!ev.allDay && !ev.start) return 'Indica la hora de inicio.';
  if (!ev.allDay && ev.end && toMin(ev.end) <= toMin(ev.start)) return 'La hora de fin debe ser posterior a la de inicio.';
  if (ev.until && ev.until < ev.date) return 'La fecha "hasta" debe ser posterior a la del evento.';
  return null;
}
