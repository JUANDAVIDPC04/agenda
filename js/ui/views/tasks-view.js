// Vista Tareas: alta rápida, grupos por vencimiento y completadas.
import { h, cx } from '../../utils/dom.js';
import { nowIso } from '../../utils/id.js';
import { MESSAGES } from '../../config/constants.js';
import { dueLabel, dueStatus, groupTasks } from '../../domain/tasks.js';
import { scrollRoot } from './view-registry.js';

function taskRow(ctx, t) {
  const { services, toast, actions } = ctx;
  const toggle = () => services.tasks.toggle(t).catch(x => { toast(x.message); ctx.render(); });
  return h('div', { class: cx('task', t.done && 'done') },
    h('input', {
      type: 'checkbox', class: 'tcheck', id: 'tc-' + t.id, checked: !!t.done,
      'aria-label': (t.done ? 'Marcar como pendiente: ' : 'Completar: ') + (t.title || ''),
      onchange: toggle,
    }),
    h('button', { class: 'tbody', onclick: () => actions.openTaskEditor(t) },
      h('span', { class: 'tt' }, t.title || MESSAGES.untitled),
      t.notes ? h('small', {}, t.notes) : null),
    t.due ? h('span', { class: cx('due', dueStatus(t)) }, dueLabel(t.due)) : h('span'));
}

function quickAddForm(ctx) {
  const { state, services, toast } = ctx;
  const draft = state.drafts.task;
  const title = h('input', { class: 'in', id: 't-new', placeholder: 'Añade una tarea y pulsa Enter', value: draft.title, maxlength: '200', 'aria-label': 'Nueva tarea', oninput: e => { draft.title = e.target.value; } });
  const due = h('input', { class: 'in', type: 'date', id: 't-new-due', 'aria-label': 'Fecha límite (opcional)', title: 'Fecha límite (opcional)', value: draft.due, onchange: e => { draft.due = e.target.value; } });

  const form = h('form', {
    class: 'task-add',
    onsubmit: async e => {
      e.preventDefault();
      const value = title.value.trim();
      if (!value || !ctx.guardWritable()) return;
      const dueValue = due.value;
      Object.assign(draft, { title: '', due: '', focus: true });
      try {
        await services.tasks.save({ title: value, due: dueValue, notes: '', done: false, createdAt: nowIso() });
        toast('Tarea añadida');
      } catch (x) {
        Object.assign(draft, { title: value, due: dueValue });
        toast(x.message);
      }
      ctx.render();
    },
  }, title, due, h('button', { class: 'btn primary', type: 'submit' }, 'Añadir'));

  if (draft.focus) { draft.focus = false; setTimeout(() => title.focus(), 0); }
  return form;
}

function completedSection(ctx, done) {
  const { state, services, toast } = ctx;
  const clearBtn = h('button', {
    class: 'btn danger', type: 'button',
    onclick: async () => {
      // Doble clic de confirmación
      if (!clearBtn.dataset.armed) { clearBtn.dataset.armed = '1'; clearBtn.textContent = `Confirmar: borrar ${done.length}`; return; }
      try { await services.tasks.removeMany(done); toast('Tareas completadas borradas'); }
      catch { toast('No se pudieron borrar todas.'); }
    },
  }, 'Borrar completadas');

  return h('details', { class: 't-done', open: state.drafts.task.showDone || null, ontoggle: e => { state.drafts.task.showDone = e.target.open; } },
    h('summary', {}, `Completadas (${done.length})`),
    done.map(t => taskRow(ctx, t)),
    state.readOnly ? null : clearBtn);
}

function render(ctx, { keepScroll }) {
  const { state } = ctx;
  const g = groupTasks(state.tasks);
  const group = (name, list, cls) => (list.length ? h('div', { class: cx('t-group', cls) }, h('h3', {}, name), list.map(t => taskRow(ctx, t))) : null);
  const n = g.pending.length, over = g.overdue.length;

  const wrap = h('div', { class: 'tasks' },
    h('div', { class: 't-summary' },
      h('b', {}, n),
      h('span', {}, n === 1 ? 'tarea pendiente' : 'tareas pendientes'),
      over ? h('span', { class: 'over' }, `· ${over} vencida${over > 1 ? 's' : ''}`) : null),
    quickAddForm(ctx),
    n ? null : h('div', { class: 'empty compact' },
      h('strong', {}, state.tasks.length ? 'Todo hecho' : 'Sin tareas'),
      h('span', {}, state.tasks.length ? 'No te quedan tareas pendientes.' : 'Escribe arriba tu primera tarea. Puedes ponerle fecha para verla en el calendario.')),
    group('Vencidas', g.overdue, 'overdue'),
    group('Hoy', g.today),
    group('Próximas', g.upcoming),
    group('Sin fecha', g.undated),
    g.done.length ? completedSection(ctx, g.done) : null);

  return scrollRoot(wrap, keepScroll);
}

export const tasksView = {
  id: 'tasks',
  title: () => 'Mis tareas',
  step: null,
  render,
  refreshEachMinute: true,
};
