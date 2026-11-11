/**
 * Contrato común de una colección persistente (Interface Segregation + Dependency Inversion):
 * los servicios dependen de esta forma, nunca de localStorage ni del SDK remoto.
 *
 * @typedef {Object} Collection
 * @property {(onData:(items:Array, meta:{fromCache:boolean})=>void, onError?:(e:any)=>void)=>()=>void} subscribe
 * @property {(item:Object)=>Promise<void>} save    Crea (sin id) o reemplaza (con id).
 * @property {(id:string)=>Promise<void>} remove
 */

/** Separa el id del resto de datos y añade la marca de actualización. */
export function toRecord(item) {
  const { id, ...data } = item;
  data.updatedAt = new Date().toISOString();
  return { id, data };
}
