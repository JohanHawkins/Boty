import app from './app.js';
import config from './config/index.js';
import { initDb } from './db/index.js';

async function start(): Promise<void> {
  try {
    await initDb();
    console.log('Base de datos conectada y esquema listo');
  } catch (err) {
    console.warn('No se pudo conectar a la base de datos:', err instanceof Error ? err.message : err);
    console.warn('El modo demo sigue funcionando; revisa DATABASE_URL en backend/.env');
  }

  app.listen(config.port, () => {
    console.log(`Boty backend escuchando en http://localhost:${config.port} (${config.nodeEnv})`);
  });
}

start();
