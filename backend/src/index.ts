import app from './app.js';
import config from './config/index.js';

app.listen(config.port, () => {
  console.log(`Boty backend escuchando en http://localhost:${config.port} (${config.nodeEnv})`);
});
