// Barra superior: título del periodo, botones de vista y modo objetivos.
import { today } from '../utils/date.js';
import { selectors } from '../state/app-state.js';

export function renderHeader(ctx, dom) {
  const { state } = ctx;
  const view = ctx.views.get(state.view);
  const goalsMode = state.view === 'goals';

  dom.brandDay.textContent = today().getDate();
  dom.period.textContent = view.title(state);
  dom.viewSwitcher.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.view === state.view));
  dom.prevBtn.hidden = dom.nextBtn.hidden = !view.step;
  dom.app.classList.toggle('goals-mode', goalsMode);
  dom.backBtn.hidden = !goalsMode;
  dom.examplesNote.hidden = !selectors.hasExamples(state);
}
