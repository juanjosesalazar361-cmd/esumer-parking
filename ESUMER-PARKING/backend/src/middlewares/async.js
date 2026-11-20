// Envuelve handlers async para que los errores lleguen al manejador de errores de Express
export const h = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
