import { app } from './app.js';
import { logger } from './utils/logger.js';
import { bootstrapSystem } from './db/bootstrap.js';

const port = process.env.PORT ?? 3000;

/**
 * Modern Application Entry Point
 * 1. Initialize core system state (Bootstrap)
 * 2. Start HTTP listener
 */
async function startServer() {
  // Run critical initializations before accepting traffic
  await bootstrapSystem();

  app.listen(port, () => {
    logger.info(`Server running at http://localhost:${port}`);
    logger.info(`Auth endpoints available at http://localhost:${port}/api/auth`);
  });
}

startServer().catch((error) => {
  logger.error({ error }, 'Fatal error during server startup');
  process.exit(1);
});
