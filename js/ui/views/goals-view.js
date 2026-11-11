// Vista Objetivos: horizontes, navegación por periodo, alta y lista de objetivos.
import { h, cx } from '../../utils/dom.js';
import { ymd, addDays, today, fmt } from '../../utils/date.js';
import { HORIZONS, horizonOf, MESSAGES } from '../../config/constants.js';
import {
  periodBounds, periodKey, periodLabel, shiftPeriod, goalsIn, sortGoals, isGoalDone, goalFraction,
  goalTarget, goalProgress, isQuitGoal, quitStats, averagePercent, carryOverCandidates, buildGoal,
} from '../../domain/goals.js';
import { scrollRoot } from './view-registry.js';

const plural = (n, one, many) => (n === 1 ? one : many);

// ---------- Filas ----------

function goalHandlers(ctx) {
  return { onLocalChange: ctx.render, onError: x => ctx.toast(x.message) };
}

function updateGoal(ctx, g, patch) {
  if (!ctx.guardWritable()) return;
  ctx.services.goals.update(g, patch, goalHandlers(ctx));
}

function toggleSlip(ctx, g, dayKey) {
  if (!ctx.guardWritable()) return;
  ctx.services.goals.toggleSlip(g, dayKey, goalHandlers(ctx));
}

/** Calendario de puntos (limpio / recaída) para horizontes cortos. */
function slipDots(ctx, g, q) {
  const t0 = today(), todayKey = ymd(t0);
  const dots = h('div', { class: 'qdots' });
  for (let d = new Date(q.ps); d < q.pe; d = addDays(d, 1)) {
    const k = ymd(d), inactive = d < q.start || d > t0, slipped = q.slips.has(k);
    dots.append(h('button', {
      class: cx('qd', !inactive && (slipped ? 'slip' : 'ok'), k === todayKey && 'today'),
      disabled: inactive,
      title: fmt(d, { weekday: 'short', day: 'numeric', month: 'short' }) + (inactive ? '' : slipped ? ' · recaída (clic para quitar)' : ' · limpio (clic si recaíste)'),
      'aria-label': fmt(d, { weekday: 'long', day: 'numeric' }) + (slipped ? ', recaída' : ''),
      onclick: () => toggleSlip(ctx, g, k),
    }));
  }
  return dots;
}

function quitInfo(q) {
  if (q.ended) {
    return h('span', { class: 'qinfo' }, q.slipsIn
      ? `Periodo cerrado · ${q.clean} de ${q.elapsed} días sin recaer`
      : h('b', {}, `Periodo completo sin recaer: ${q.clean} días`));
  }
  if (!q.current) return h('span', { class: 'qinfo' }, 'Empieza ' + fmt(q.start, { day: 'numeric', month: 'long' }));
  return h('span', { class: 'qinfo' },
    h('b', {}, plural(q.streak, '1 día', `${q.streak} días`)),
    plural(q.streak, ' sin recaer', ' seguidos sin recaer'),
    q.slipsIn ? ` · ${q.slipsIn} recaída${q.slipsIn > 1 ? 's' : ''} en el periodo` : '');
}

function quitRow(ctx, g) {
  const q = quitStats(g);
  const pc = Math.round((q.clean / q.total) * 100);
  const todayKey = ymd(today());
  const action = q.current && !ctx.state.readOnly
    ? h('button', { class: cx('btn qbtn', q.slippedToday && 'undo'), onclick: () => toggleSlip(ctx, g, todayKey) }, q.slippedToday ? 'Deshacer recaída' : 'Recaí hoy')
    : h('span');
  return h('div', { class: cx('goal', isGoalDone(g) && 'done') },
    h('span', { class: 'gring', style: `--p:${pc}`, role: 'img', 'aria-label': `${pc}% de días sin recaer` }),
    h('div', { class: 'gmain' },
      h('button', { class: 'gmain', onclick: () => ctx.actions.openGoalEditor(g) },
        h('span', { class: 'gt' }, h('span', { class: 'qtag' }, 'Dejar'), g.title || MESSAGES.untitled)),
      quitInfo(q),
      g.horizon === 'week' || g.horizon === 'month' ? slipDots(ctx, g, q) : null),
    action);
}

function achieveRow(ctx, g) {
  const t = goalTarget(g), p = goalProgress(g), done = p >= t, pc = Math.round(goalFraction(g) * 100);
  const setProgress = v => updateGoal(ctx, g, { progress: v });
  const indicator = t === 1
    ? h('input', { type: 'checkbox', class: 'tcheck', id: 'gc-' + g.id, checked: done, 'aria-label': (done ? 'Marcar como pendiente: ' : 'Cumplido: ') + (g.title || ''), onchange: () => setProgress(done ? 0 : 1) })
    : h('span', { class: 'gring', style: `--p:${pc}`, role: 'img', 'aria-label': `${pc}% completado` });
  const stepper = t > 1
    ? h('div', { class: 'gstep' },
      h('button', { 'aria-label': 'Restar uno', onclick: () => setProgress(Math.max(0, p - 1)) }, '−'),
      h('span', {}, `${p} / ${t}`),
      h('button', { 'aria-label': 'Sumar uno', onclick: () => setProgress(Math.min(t, p + 1)) }, '+'))
    : h('span');
  return h('div', { class: cx('goal', done && 'done') },
    indicator,
    h('button', { class: 'gmain', onclick: () => ctx.actions.openGoalEditor(g) },
      h('span', { class: 'gt' }, g.title || MESSAGES.untitled),
      t > 1 ? h('div', { class: 'bar' }, h('i', { style: `width:${pc}%` })) : null,
      g.notes ? h('small', {}, g.notes) : null),
    stepper);
}

// Estrategia por tipo de objetivo
const goalRow = (ctx, g) => (isQuitGoal(g) ? quitRow : achieveRow)(ctx, g);

// ---------- Secciones ----------

function horizonTabs(ctx) {
  const { state } = ctx;
  return h('div', { class: 'hz', role: 'tablist', 'aria-label': 'Periodo' }, HORIZONS.map(z => {
    const list = goalsIn(state.goals, z.id, periodKey(z.id, state.goalsCursor));
    const done = list.filter(isGoalDone).length;
    return h('button', { role: 'tab', 'aria-selected': String(z.id === state.horizon), onclick: () => { state.horizon = z.id; ctx.render(); } },
      h('span', { class: 'n' }, z.name, h('span', { class: 'cnt' }, list.length ? `${done}/${list.length}` : '–')),
      h('small', {}, periodLabel(z.id, state.goalsCursor, true)),
      h('div', { class: 'bar' }, h('i', { style: `width:${averagePercent(list)}%` })));
  }));
}

function periodNav(ctx, period) {
  const { state, actions } = ctx;
  return h('div', { class: 'g-nav' },
    h('button', { class: 'icon-btn', 'aria-label': 'Periodo anterior', onclick: () => actions.shiftGoals(-1) }, '‹'),
    h('button', { class: 'icon-btn', 'aria-label': 'Periodo siguiente', onclick: () => actions.shiftGoals(1) }, '›'),
    h('h2', {}, periodLabel(state.horizon, state.goalsCursor)),
    period.isCurrent
      ? h('span', { class: 'left' }, period.daysLeft === 1 ? 'Queda 1 día' : `Quedan ${period.daysLeft} días`)
      : h('button', { class: 'btn left', onclick: () => { state.goalsCursor = today(); ctx.render(); } }, 'Ir al actual'));
}

function overallProgress(list) {
  const pct = averagePercent(list), done = list.filter(isGoalDone).length;
  return h('div', { class: 'g-pct' },
    h('div', { class: 'bar' }, h('i', { style: `width:${pct}%` })),
    h('span', {}, `${pct}% · ${done} de ${list.length} cumplidos`));
}

/** Formulario de nuevo objetivo: primero el tipo, y los campos cambian según la elección. */
function newGoalForm(ctx, period) {
  const { state, services, toast } = ctx;
  const draft = state.drafts.goal;
  const quit = draft.type === 'quit';
  const defaultSince = ymd(period.isCurrent ? today() : period.start);
  const pick = type => { draft.type = type; draft.focus = true; ctx.render(); };

  const title = h('input', {
    class: 'in', id: 'g-new', maxlength: '200', value: draft.title, oninput: e => { draft.title = e.target.value; },
    placeholder: quit ? 'Ej.: fumar, el azúcar, el móvil en la cama' : 'Ej.: leer 4 libros, ir al gimnasio, terminar el informe',
  });
  const target = h('input', { class: 'in', type: 'number', id: 'g-target', min: '1', max: '100000', placeholder: 'Ej.: 4', value: draft.target, oninput: e => { draft.target = e.target.value; } });
  const since = h('input', { class: 'in', type: 'date', id: 'g-since', value: draft.since || defaultSince, onchange: e => { draft.since = e.target.value; } });

  const fieldBox = (label, forId, control, cls = '') => h('div', { class: cx('field', cls) }, h('label', { for: forId }, label), control);
  const isCurrentLabel = period.isCurrent ? horizonOf(state.horizon).empty : periodLabel(state.horizon, state.goalsCursor, true);

  const form = h('form', {
    class: 'gnew',
    onsubmit: async e => {
      e.preventDefault();
      const value = title.value.trim();
      if (!value) { title.focus(); toast(quit ? 'Escribe qué quieres dejar.' : 'Escribe qué quieres lograr.'); return; }
      if (!ctx.guardWritable()) return;
      const doc = buildGoal({ type: draft.type, title: value, horizon: state.horizon, period: period.key, target: target.value, since: since.value || defaultSince });
      Object.assign(draft, { title: '', target: '', since: '', focus: true });
      try {
        await services.goals.save(doc);
        toast(quit ? 'Hábito a dejar añadido' : 'Objetivo añadido');
      } catch (x) {
        Object.assign(draft, { title: value, target: target.value });
        toast(x.message);
      }
      ctx.render();
    },
  },
  h('h3', {}, `Nuevo objetivo para ${isCurrentLabel}`),
  h('div', { class: 'gchoice', role: 'group', 'aria-label': 'Tipo de objetivo' },
    h('button', { type: 'button', 'aria-pressed': String(!quit), onclick: () => pick('achieve') },
      h('b', {}, 'Lograr algo'), h('small', {}, 'Una meta que quieres conseguir')),
    h('button', { type: 'button', class: 'quit', 'aria-pressed': String(quit), onclick: () => pick('quit') },
      h('b', {}, 'Dejar algo'), h('small', {}, 'Un hábito que quieres abandonar'))),
  quit
    ? h('div', { class: 'gfields' },
      fieldBox('¿Qué quieres dejar?', 'g-new', title),
      fieldBox('Sin hacerlo desde', 'g-since', since, 'sm'),
      h('button', { class: 'btn primary destructive', type: 'submit' }, 'Añadir'))
    : h('div', { class: 'gfields' },
      fieldBox('¿Qué quieres lograr?', 'g-new', title),
      fieldBox('Cantidad (opcional)', 'g-target', target, 'sm'),
      h('button', { class: 'btn primary', type: 'submit' }, 'Añadir')),
  h('p', { class: 'ghelp' }, quit
    ? 'Cada día sin hacerlo suma a tu racha. Si tienes un tropiezo, pulsa «Recaí hoy» y vuelves a empezar.'
    : 'Si se puede contar (4 libros, 10 km), pon la cantidad y ve sumando con + y −. Si no, solo lo marcas cuando lo cumplas.'));

  if (draft.focus) { draft.focus = false; setTimeout(() => title.focus(), 0); }
  return form;
}

function carryOverButton(ctx, current, period) {
  const { state, services, toast } = ctx;
  if (state.readOnly) return null;
  const prevDate = shiftPeriod(state.horizon, state.goalsCursor, -1);
  const pending = carryOverCandidates(goalsIn(state.goals, state.horizon, periodKey(state.horizon, prevDate)), current);
  if (!pending.length) return null;
  return h('button', {
    class: 'btn g-carry',
    onclick: async () => {
      try { await services.goals.carryOver(pending, period.key); toast('Pendientes traídos'); }
      catch (x) { toast(x.message); }
    },
  }, `Traer ${pending.length} pendiente${pending.length > 1 ? 's' : ''} de ${periodLabel(state.horizon, prevDate, true)}`);
}

function render(ctx, { keepScroll }) {
  const { state } = ctx;
  const [start, end] = periodBounds(state.horizon, state.goalsCursor);
  const t0 = today();
  const period = {
    key: periodKey(state.horizon, state.goalsCursor),
    start,
    isCurrent: t0 >= start && t0 < end,
    daysLeft: Math.round((end - t0) / 864e5),
  };
  const list = sortGoals(goalsIn(state.goals, state.horizon, period.key));

  const wrap = h('div', { class: 'goals' },
    horizonTabs(ctx),
    periodNav(ctx, period),
    list.length ? overallProgress(list) : null,
    newGoalForm(ctx, period),
    list.length
      ? h('div', { class: 'goal-list' }, list.map(g => goalRow(ctx, g)))
      : h('div', { class: 'empty compact' },
        h('strong', {}, `Sin objetivos para ${period.isCurrent ? horizonOf(state.horizon).empty : 'este periodo'}`),
        h('span', {}, 'Escribe arriba qué quieres lograr. Si se puede contar, pon la cantidad y ve sumando tu avance.')),
    carryOverButton(ctx, list, period));

  return scrollRoot(wrap, keepScroll);
}

export const goalsView = {
  id: 'goals',
  title: () => 'Mis objetivos',
  step: null,
  render,
  refreshEachMinute: true,
};
