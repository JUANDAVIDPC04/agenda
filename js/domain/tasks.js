// Reglas de negocio de las tareas: vencimientos, orden y agrupación.
import { ymd, parseYmd, addDays, today, fmt } from '../utils/date.js';

export function dueLabel(due) {
  const td = today();
  if (due === ymd(td)) return 'Hoy';
  if (due === ymd(addDays(td, 1))) return 'Mañana';
  if (due === ymd(addDays(td, -1))) return 'Ayer';
  const d = parseYmd(due);
  return fmt(d, d.getFullYear() === td.getFullYear()
    ? { weekday: 'short', day: 'numeric', month: 'short' }
    : { day: 'numeric', month: 'short', year: 'numeric' });
}

/** 'over' | 'today' | '' */
export function dueStatus(t) {
  if (!t.due || t.done) return '';
  const td = ymd(today());
  return t.due < td ? 'over' : t.due === td ? 'today' : '';
}

const byDue = (a, b) =>
  (a.due || '9999').localeCompare(b.due || '9999') || (a.createdAt || '').localeCompare(b.createdAt || '');
const byDoneAtDesc = (a, b) => (b.doneAt || '').localeCompare(a.doneAt || '');

/** Clasifica las tareas en los grupos que muestra la vista. */
export function groupTasks(tasks) {
  const td = ymd(today());
  const pending = tasks.filter(t => !t.done).sort(byDue);
  return {
    pending,
    done: tasks.filter(t => t.done).sort(byDoneAtDesc),
    overdue: pending.filter(t => t.due && t.due < td),
    today: pending.filter(t => t.due === td),
    upcoming: pending.filter(t => t.due && t.due > td),
    undated: pending.filter(t => !t.due),
  };
}

export const toggledTask = t => ({ ...t, done: !t.done, doneAt: !t.done ? new Date().toISOString() : '' });
