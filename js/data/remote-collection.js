// Implementación de Collection sobre la base de datos compartida del artifact (window.claude 'db').
import { toRecord } from './collection.js';
import { toStorageError } from './storage-error.js';

export class RemoteCollection {
  #col;

  constructor(dbCollection) {
    this.#col = dbCollection;
  }

  subscribe(onData, onError = () => {}) {
    return this.#col.onSnapshot(
      snap => onData(snap.docs.map(d => ({ id: d.id, ...d.data() })), { fromCache: !!snap.metadata?.fromCache }),
      onError,
    );
  }

  async save(item) {
    const { id, data } = toRecord(item);
    try {
      if (id) await this.#col.doc(id).set(data);
      else await this.#col.add(data);
    } catch (e) {
      throw toStorageError(e);
    }
  }

  async remove(id) {
    await this.#col.doc(id).delete();
  }
}
