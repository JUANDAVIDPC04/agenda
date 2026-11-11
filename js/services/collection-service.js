// Servicio base CRUD sobre una Collection. Las subclases añaden casos de uso específicos.
// Depende de la abstracción Collection (DIP), no de un backend concreto.

export class CollectionService {
  /**
   * @param {import('../data/collection.js').Collection} collection
   * @param {{ getAll: () => Array, onReadOnly: () => void }} deps
   */
  constructor(collection, { getAll, onReadOnly }) {
    this.collection = collection;
    this.getAll = getAll;
    this.onReadOnly = onReadOnly;
  }

  find(id) {
    return this.getAll().find(x => x.id === id);
  }

  subscribe(onData, onError) {
    return this.collection.subscribe(onData, onError);
  }

  async save(item) {
    try {
      await this.collection.save(item);
    } catch (e) {
      if (e?.kind === 'read_only') this.onReadOnly();
      throw e;
    }
  }

  remove(id) {
    return this.collection.remove(id);
  }

  async removeMany(items) {
    for (const it of items) await this.remove(it.id);
  }

  examples() {
    return this.getAll().filter(x => x.example);
  }
}
