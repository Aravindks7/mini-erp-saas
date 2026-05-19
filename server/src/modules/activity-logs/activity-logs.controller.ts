import { Request, Response } from 'express';
import { activityLogsService } from './activity-logs.service.js';
import { logger } from '../../utils/logger.js';

/**
 * Controller for Activity Logs.
 * Axiom: HTTP layer only — delegates all logic to the service.
 */

export async function getActivityLogs(req: Request, res: Response) {
  const organizationId = req.organizationId;

  try {
    // Organization-wide feed with optional filters
    const { entityType, entityId, cursor, limit, search, startDate, endDate } = req.query;

    // Entity-scoped query: both entityType and entityId are required
    if (entityType && entityId) {
      const logs = await activityLogsService.getByEntity(
        organizationId,
        entityType as string,
        entityId as string,
      );
      return res.json(logs);
    }

    const queryOptions: {
      entityType?: string;
      cursor?: string;
      limit?: number;
      search?: string;
      startDate?: string;
      endDate?: string;
    } = {};

    if (typeof entityType === 'string') queryOptions.entityType = entityType;
    if (typeof cursor === 'string') queryOptions.cursor = cursor;
    if (typeof limit === 'string') queryOptions.limit = parseInt(limit, 10);
    if (typeof search === 'string') queryOptions.search = search;
    if (typeof startDate === 'string') queryOptions.startDate = startDate;
    if (typeof endDate === 'string') queryOptions.endDate = endDate;

    const result = await activityLogsService.getByOrganization(organizationId, queryOptions);

    return res.json(result);
  } catch (error) {
    logger.error({ error, organizationId }, 'Failed to fetch activity logs');
    throw error;
  }
}
