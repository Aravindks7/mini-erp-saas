import { app } from './app';
import { logger } from './utils/logger';

const port = process.env.PORT ?? 3000;

app.listen(port, () => {
  logger.info(`Server running at http://localhost:${port}`);
  logger.info(`Auth endpoints available at http://localhost:${port}/api/auth`);
});
