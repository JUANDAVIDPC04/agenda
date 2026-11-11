import { CollectionService } from './collection-service.js';
import { withToggledSlip } from '../domain/goals.js';

export class GoalService extends CollectionService {
  #queues = {};

  /**
   * Actualización optimista: aplica el cambio en memoria al instante (`onLocalChange`)
   * y encola el guardado para que los clics rápidos (+/−) se persistan en orden.
   */
  update(goal, patch, { onLocalChange, onError }) {
    const current = this.find(goal.id);
    if (!current) return;
    Object.assign(current, patch);
    onLocalChange();
    const snapshot = { ...current };
    this.#queues[goal.id] = (this.#queues[goal.id] || Promise.resolve())
      .then(() => this.save(snapshot))
      .catch(onError);
  }

  toggleSlip(goal, dayKey, handlers) {
    const current = this.find(goal.id) || goal;
    this.update(goal, { slips: withToggledSlip(current, dayKey) }, handlers);
  }

  /** Copia objetivos pendientes a otro periodo. */
  async carryOver(goals, periodKey) {
    for (const g of goals) {
      const { id, updatedAt, example, ...rest } = g;
      await this.save({ ...rest, period: periodKey, createdAt: new Date().toISOString() });
    }
  }
}
