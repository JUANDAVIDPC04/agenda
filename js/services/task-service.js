import { CollectionService } from './collection-service.js';
import { toggledTask } from '../domain/tasks.js';

export class TaskService extends CollectionService {
  /** Alterna completada/pendiente usando siempre la versión más reciente de la tarea. */
  toggle(task) {
    const current = this.find(task.id) || task;
    return this.save(toggledTask(current));
  }
}
