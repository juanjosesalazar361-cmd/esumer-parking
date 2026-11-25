import app from '../backend/src/app.js';
import { initDb } from '../backend/src/data/init.js';

// Prepara la base de datos una vez por arranque y luego atiende cada petición con Express
let ready;
export default async function handler(req, res) {
  ready ??= initDb().catch(e => { ready = null; throw e; });
  await ready;
  return app(req, res);
}