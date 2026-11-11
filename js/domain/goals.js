// Reglas de negocio de los objetivos: periodos, progreso y estadísticas de hábitos a dejar.
import { HORIZONS, MONTHS_SHORT } from '../config/constants.js';
import { pad, ymd, parseYmd, addDays, startOfWeek, today, dayDiff, isoWeek, fmt } from '../utils/date.js';

const monthsOf = hz => HORIZONS.find(z => z.id === hz)?.months;

// ---------- Periodos ----------

/** [inicio, fin) del periodo del horizonte `hz` que contiene `d`. */
export function periodBounds(hz, d) {
  if (hz === 'week') {
    const s = startOfWeek(d);
    return [s, addDays(s, 7)];
  }
  const len = monthsOf(hz);
  const y = d.getFullYear(), m = d.getMonth();
  const sm = hz === 'month' ? m : hz === 'year' ? 0 : Math.floor(m / len) * len;
  return [new Date(y, sm, 1), new Date(y, sm + len, 1)];
}

/** Clave estable del periodo: 2026-W45, 2026-11, 2026-Q4, 2026-H2, 2026. */
export function periodKey(hz, d) {
  const y = d.getFullYear(), m = d.getMonth();
  switch (hz) {
    case 'week': { const [fy, w] = isoWeek(d); return `${fy}-W${pad(w)}`; }
    case 'month': return `${y}-${pad(m + 1)}`;
    case 'quarter': return `${y}-Q${Math.floor(m / 3) + 1}`;
    case 'half': return `${y}-H${m < 6 ? 1 : 2}`;
    default: return `${y}`;
  }
}

/** Inverso de periodKey: primera fecha del periodo. */
export function keyToDate(hz, key) {
  const y = parseInt(key, 10);
  switch (hz) {
    case 'week': return addDays(startOfWeek(new Date(y, 0, 4)), (parseInt(key.split('-W')[1], 10) - 1) * 7);
    case 'month': return new Date(y, parseInt(key.split('-')[1], 10) - 1, 1);
    case 'quarter': return new Date(y, (parseInt(key.split('-Q')[1], 10) - 1) * 3, 1);
    case 'half': return new Date(y, (parseInt(key.split('-H')[1], 10) - 1) * 6, 1);
    default: return new Date(y, 0, 1);
  }
}

export function periodLabel(hz, d, short = false) {
  const y = d.getFullYear(), m = d.getMonth();
  switch (hz) {
    case 'week': {
      const [, w] = isoWeek(d), [s] = periodBounds('week', d), e = addDays(s, 6);
      return short ? `Semana ${w}` : `Semana ${w} · ${s.getDate()} ${MONTHS_SHORT[s.getMonth()]} – ${e.getDate()} ${MONTHS_SHORT[e.getMonth()]}`;
    }
    case 'month': return fmt(d, { month: 'long', year: 'numeric' });
    case 'quarter': {
      const q = Math.floor(m / 3);
      return short ? `T${q + 1} ${y}` : `${['1er', '2º', '3er', '4º'][q]} trimestre ${y} · ${MONTHS_SHORT[q * 3]}–${MONTHS_SHORT[q * 3 + 2]}`;
    }
    case 'half': {
      const first = m < 6;
      return short ? `S${first ? 1 : 2} ${y}` : `${first ? '1er' : '2º'} semestre ${y} · ${first ? 'ene–jun' : 'jul–dic'}`;
    }
    default: return short ? `${y}` : `Año ${y}`;
  }
}

/** Desplaza `d` un periodo hacia delante (dir=1) o atrás (dir=-1). */
export const shiftPeriod = (hz, d, dir) =>
  hz === 'week' ? addDays(d, 7 * dir) : new Date(d.getFullYear(), d.getMonth() + monthsOf(hz) * dir, 1);

// ---------- Progreso ----------

export const goalTarget = g => Math.max(1, Math.round(+g.target || 1));
export const goalProgress = g => Math.max(0, Math.round(+g.progress || 0));
export const isQuitGoal = g => g.type === 'quit';

/** Estadísticas de un objetivo "dejar algo": días limpios, recaídas y racha. */
export function quitStats(g) {
  const [ps, pe] = periodBounds(g.horizon, keyToDate(g.horizon, g.period || ''));
  const since = g.since ? parseYmd(g.since) : ps;
  const start = since > ps ? since : ps;
  const t0 = today(), lastDay = addDays(pe, -1);
  const slips = new Set(g.slips || []);
  const total = Math.max(1, dayDiff(start, pe));
  let elapsed = 0, clean = 0;
  for (let d = new Date(start); d <= (t0 < lastDay ? t0 : lastDay); d = addDays(d, 1)) {
    elapsed++;
    if (!slips.has(ymd(d))) clean++;
  }
  const s0 = ymd(ps), s1 = ymd(pe);
  const slipsIn = [...slips].filter(s => s >= s0 && s < s1).length;
  const past = [...slips].filter(s => s <= ymd(t0)).sort();
  const from = past.length ? addDays(parseYmd(past[past.length - 1]), 1) : since;
  const slippedToday = slips.has(ymd(t0));
  const streak = slippedToday ? 0 : Math.max(0, dayDiff(from, t0) + 1);
  return { ps, pe, start, total, elapsed, clean, slips, slipsIn, streak, slippedToday, ended: t0 >= pe, current: t0 >= ps && t0 < pe };
}

export function isGoalDone(g) {
  if (isQuitGoal(g)) {
    const q = quitStats(g);
    return q.ended && q.slipsIn === 0;
  }
  return goalProgress(g) >= goalTarget(g);
}

/** Fracción completada (0..1). */
export function goalFraction(g) {
  if (isQuitGoal(g)) {
    const q = quitStats(g);
    return q.clean / q.total;
  }
  return Math.min(goalProgress(g) / goalTarget(g), 1);
}

export const averagePercent = list =>
  list.length ? Math.round((list.reduce((a, g) => a + goalFraction(g), 0) / list.length) * 100) : 0;

export const goalsIn = (goals, hz, key) => goals.filter(g => g.horizon === hz && g.period === key);

export const sortGoals = list =>
  list.sort((a, b) => isGoalDone(a) - isGoalDone(b) || (a.createdAt || '').localeCompare(b.createdAt || ''));

/** Objetivos del periodo anterior que siguen pendientes y aún no están en el actual. */
export const carryOverCandidates = (previous, current) =>
  previous.filter(g => (isQuitGoal(g) || !isGoalDone(g)) && !current.some(x => x.title === g.title));

export const withToggledSlip = (g, key) => {
  const s = new Set(g.slips || []);
  s.has(key) ? s.delete(key) : s.add(key);
  return [...s].sort();
};

/** Construye un objetivo nuevo según su tipo. */
export function buildGoal({ type, title, horizon, period, target, since }) {
  const base = { title, horizon, period, notes: '', createdAt: new Date().toISOString() };
  return type === 'quit'
    ? { ...base, type: 'quit', since, slips: [] }
    : { ...base, type: 'achieve', target: Math.max(1, Math.round(+target || 1)), progress: 0 };
}
