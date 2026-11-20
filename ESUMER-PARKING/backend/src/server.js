import app from './app.js';
import { PORT } from './config/env.js';
import { initDb } from './data/init.js';

try {
  await initDb();
  app.listen(PORT, () => console.log(`ESUMER PARKING API en http://localhost:${PORT} (PostgreSQL conectado)`));
} catch (e) {
  console.error('\nNo se pudo conectar a PostgreSQL:', e.message);
  console.error('Revisa DATABASE_URL en backend/.env (mira backend/.env.example) y que PostgreSQL esté encendido.\n');
  process.exit(1);
}
