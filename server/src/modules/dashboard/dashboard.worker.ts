import { dashboardService } from './dashboard.service.js';
import { logger } from '../../utils/logger.js';

/**
 * Dashboard Background Worker.
 * Axiom: Periodically refreshes the Materialized View to maintain analytical performance.
 */
export function startDashboardWorker() {
  // Refresh every 5 minutes
  const INTERVAL = 5 * 60 * 1000;

  logger.info('🚀 Dashboard Background Worker started (5m interval)');

  setInterval(async () => {
    try {
      logger.info('🔄 Refreshing analytical materialized views...');

      await Promise.all([
        dashboardService.refreshMetrics(),
        (await import('../finance/finance.service.js')).financeService.refreshReports(),
      ]);

      logger.info('✅ Analytical refresh complete.');
    } catch (error) {
      logger.error({ error }, '❌ Analytical background refresh failed');
    }
  }, INTERVAL);
}
