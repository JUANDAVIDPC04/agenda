// Atajos de teclado. Cada contexto (agenda / objetivos) tiene su propio mapa de teclas.
import { byId, isTypingTarget } from '../utils/dom.js';

export function bindKeyboard(ctx) {
  const { state, modal, actions } = ctx;

  const goalsKeys = {
    escape: actions.closeGoals,
    o: actions.closeGoals,
    n: e => { e.preventDefault(); byId('g-new')?.focus(); },
    arrowleft: () => actions.shiftGoals(-1),
    arrowright: () => actions.shiftGoals(1),
  };

  const create = e => { e.preventDefault(); actions.createNew(); };
  const calendarKeys = {
    o: actions.openGoals,
    n: create,
    c: create,
    t: actions.goToToday,
    d: () => actions.setView('day'),
    s: () => actions.setView('week'),
    w: () => actions.setView('week'),
    m: () => actions.setView('month'),
    a: () => actions.setView('agenda'),
    l: () => actions.setView('tasks'),
    arrowleft: () => actions.shift(-1),
    arrowright: () => actions.shift(1),
  };

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.isOpen) { modal.close(); return; }
    if (modal.isOpen || e.ctrlKey || e.metaKey || e.altKey || isTypingTarget(e.target)) return;
    const keymap = state.view === 'goals' ? goalsKeys : calendarKeys;
    keymap[e.key.toLowerCase()]?.(e);
  });
}
