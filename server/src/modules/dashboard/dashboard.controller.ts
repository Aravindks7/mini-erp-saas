import { Request, Response } from 'express';
import { dashboardService } from './dashboard.service.js';
import { logger } from '../../utils/logger.js';

/**
 * Controller for Dashboard Analytics.
 * Axiom: Consolidate multiple service calls into a high-fidelity response.
 */

export async function getDashboard(req: Request, res: Response) {
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const [metrics, lowStockItems, recentActivity] = await Promise.all([
      dashboardService.getMetrics(organizationId),
      dashboardService.getLowStockItems(organizationId),
      dashboardService.getRecentActivity(organizationId),
    ]);

    res.json({
      metrics,
      lowStockItems,
      recentActivity,
    });
  } catch (error) {
    logger.error({ error, organizationId, userId }, 'Failed to fetch dashboard data');
    throw error;
  }
}

export async function refreshDashboard(req: Request, res: Response) {
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    await dashboardService.refreshMetrics();
    res.json({ status: 'ok', message: 'Dashboard refresh triggered' });
  } catch (error) {
    logger.error({ error, organizationId, userId }, 'Failed to refresh dashboard');
    throw error;
  }
}
