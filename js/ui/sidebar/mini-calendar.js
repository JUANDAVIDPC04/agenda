// Mini-calendario mensual del panel lateral.
import { h, cx } from '../../utils/dom.js';
import { ymd, addDays, addMonths, startOfWeek, today, fmt } from '../../utils/date.js';
import { DOW_SHORT } from '../../config/constants.js';
import { selectors } from '../../state/app-state.js';

export function renderMiniCalendar(ctx, container) {
  const { state } = ctx;
  const first = state.miniMonth;
  const gridStart = startOfWeek(first);
  const byDay = ctx.queries.occurrencesByDay(gridStart, addDays(gridStart, 42));
  const rerender = () => renderMiniCalendar(ctx, container);
  const moveMonth = n => { state.miniMonth = addMonths(first, n); rerender(); };

  const grid = h('div', { class: 'mini-grid' }, DOW_SHORT.map(d => h('div', { class: 'dow' }, d)));
  const todayKey = ymd(today()), selectedKey = ymd(state.cursor);
  for (let i = 0; i < 42; i++) {
    const d = addDays(gridStart, i), k = ymd(d);
    const hasItems = byDay[k] || selectors.tasksOn(state, k).some(t => !t.done);
    grid.append(h('button', {
      class: cx(d.getMonth() !== first.getMonth() && 'out', k === todayKey && 'today', k === selectedKey && 'sel', hasItems && 'has'),
      'aria-label': fmt(d, { day: 'numeric', month: 'long' }),
      onclick: () => { state.cursor = d; ctx.render(); },
    }, d.getDate()));
  }

  container.replaceChildren(
    h('div', { class: 'mini-head' },
      h('span', {}, fmt(first, { month: 'long', year: 'numeric' })),
      h('div', {},
        h('button', { class: 'icon-btn sm', 'aria-label': 'Mes anterior', onclick: () => moveMonth(-1) }, '‹'),
        h('button', { class: 'icon-btn sm', 'aria-label': 'Mes siguiente', onclick: () => moveMonth(1) }, '›'))),
    grid);
}
