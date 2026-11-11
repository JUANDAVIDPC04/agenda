// Vista Mes.
import { h, cx, byId } from '../../utils/dom.js';
import { ymd, addDays, addMonths, startOfWeek, today, weekdayIndex, fmt } from '../../utils/date.js';
import { DOW_LONG } from '../../config/constants.js';
import { selectors } from '../../state/app-state.js';
import { eventChip, taskChip } from '../components/chips.js';

const CHIP_HEIGHT = 20;
const CELL_HEADER = 34;

function render(ctx) {
  const { state, actions } = ctx;
  const c = state.cursor;
  const first = new Date(c.getFullYear(), c.getMonth(), 1);
  const gridStart = startOfWeek(first);
  const daysInMonth = new Date(c.getFullYear(), c.getMonth() + 1, 0).getDate();
  const weeks = Math.ceil((weekdayIndex(first) + daysInMonth) / 7);
  const byDay = ctx.queries.occurrencesByDay(gridStart, addDays(gridStart, weeks * 7));
  const todayKey = ymd(today());

  // Cuántos chips caben en cada celda según el alto disponible
  const cellHeight = Math.max(64, ((byId('view').clientHeight || 600) - CELL_HEADER) / weeks);
  const maxChips = Math.max(1, Math.floor((cellHeight - CELL_HEADER) / CHIP_HEIGHT));

  const grid = h('div', { class: 'month-grid', style: `grid-template-rows:repeat(${weeks},minmax(0,1fr))` });
  for (let i = 0; i < weeks * 7; i++) {
    const d = addDays(gridStart, i), k = ymd(d);
    const nodes = [...selectors.tasksOn(state, k).map(t => taskChip(ctx, t)), ...(byDay[k] || []).map(e => eventChip(ctx, e))];
    const shown = nodes.length > maxChips ? nodes.slice(0, maxChips - 1) : nodes;
    const openDay = ev => { ev.stopPropagation(); actions.goToDay(d); };
    grid.append(h('div', {
      class: cx('mcell', d.getMonth() !== c.getMonth() && 'out', k === todayKey && 'today', i % 7 >= 5 && 'weekend'),
      onclick: () => actions.openEventEditor({ date: k }),
    },
    h('button', { class: 'dnum', 'aria-label': 'Ver día ' + fmt(d, { day: 'numeric', month: 'long' }), onclick: openDay }, d.getDate()),
    shown,
    nodes.length > shown.length ? h('button', { class: 'more', onclick: openDay }, `${nodes.length - shown.length} más`) : null));
  }
  return h('div', { class: 'month' }, h('div', { class: 'month-dow' }, DOW_LONG.map(x => h('div', {}, x))), grid);
}

export const monthView = {
  id: 'month',
  title: state => fmt(state.cursor, { month: 'long', year: 'numeric' }),
  step: (cursor, dir) => addMonths(cursor, dir),
  render,
};
