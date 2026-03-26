import { app } from './app.js';
import { logger } from './utils/logger.js';

const port = process.env.PORT ?? 3000;

app.listen(port, () => {
  logger.info(`Server running at http://localhost:${port}`);
  logger.info(`Auth endpoints available at http://localhost:${port}/api/auth`);
});
