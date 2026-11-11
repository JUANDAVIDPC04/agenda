// Fábrica: decide qué backend usar y devuelve las tres colecciones con la misma interfaz.
import { STORAGE_KEYS } from '../config/constants.js';
import { LocalCollection } from './local-collection.js';
import { RemoteCollection } from './remote-collection.js';

async function connectDb() {
  try { return window.claude ? await window.claude.use('db') : null; } catch { return null; }
}

/** @returns {Promise<{mode:'db'|'local', events:Collection, tasks:Collection, goals:Collection}>} */
export async function createStorage() {
  const db = await connectDb();
  if (!db) {
    return {
      mode: 'local',
      events: new LocalCollection(STORAGE_KEYS.events),
      tasks: new LocalCollection(STORAGE_KEYS.tasks),
      goals: new LocalCollection(STORAGE_KEYS.goals),
    };
  }
  return {
    mode: 'db',
    events: new RemoteCollection(db.collection('events')),
    tasks: new RemoteCollection(db.collection('tasks')),
    goals: new RemoteCollection(db.collection('goals')),
  };
}
