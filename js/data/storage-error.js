// Error de persistencia con un `kind` independiente del proveedor, para que las capas
// superiores no dependan de los códigos concretos de cada backend.
export class StorageError extends Error {
  /** @param {'read_only'|'quota'|'network'} kind */
  constructor(kind, message) {
    super(message);
    this.name = 'StorageError';
    this.kind = kind;
  }
}

/** Traduce un error del backend remoto a StorageError. */
export function toStorageError(e) {
  if (e instanceof StorageError) return e;
  if (e?.code === 'invalid_argument') return new StorageError('read_only', 'No tienes permiso para guardar cambios en esta agenda.');
  if (e?.code === 'quota_exceeded') return new StorageError('quota', 'La agenda está llena. Borra elementos antiguos para crear nuevos.');
  return new StorageError('network', 'No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.');
}
