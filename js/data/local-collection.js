// Implementación de Collection sobre localStorage (modo sin conexión / fuera de Claude).
import { toRecord } from './collection.js';
import { newId } from '../utils/id.js';

export class LocalCollection {
  #key;
  #items;
  #listeners = new Set();

  constructor(storageKey) {
    this.#key = storageKey;
    this.#items = this.#read();
  }

  subscribe(onData) {
    this.#listeners.add(onData);
    onData(this.#items, { fromCache: false });
    return () => this.#listeners.delete(onData);
  }

  async save(item) {
    const { id, data } = toRecord(item);
    this.#items = id
      ? this.#items.map(x => (x.id === id ? { id, ...data } : x))
      : [...this.#items, { id: newId(), ...data }];
    this.#commit();
  }

  async remove(id) {
    this.#items = this.#items.filter(x => x.id !== id);
    this.#commit();
  }

  #read() {
    try { return JSON.parse(localStorage.getItem(this.#key) || '[]'); } catch { return []; }
  }

  #commit() {
    try { localStorage.setItem(this.#key, JSON.stringify(this.#items)); } catch { /* almacenamiento no disponible */ }
    for (const fn of this.#listeners) fn(this.#items, { fromCache: false });
  }
}
