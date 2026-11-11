/** Id local único para registros guardados en el navegador. */
export const newId = () => 'l' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export const nowIso = () => new Date().toISOString();
