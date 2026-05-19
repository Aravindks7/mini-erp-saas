import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import * as activityLogsController from './activity-logs.controller.js';

const router = Router();

// All activity log routes require a valid session + matched org membership.
router.use(authMiddleware);

/**
 * GET /activity-logs
 * Query params:
 *  - entityType + entityId: Entity-scoped timeline (e.g., sales_order + uuid)
 *  - entityType (optional): Filter by entity type for org-wide feed
 *  - cursor (optional): ISO date string for cursor-based pagination
 *  - limit (optional): Number of items per page (default 50, max 100)
 */
router.get('/', activityLogsController.getActivityLogs);

export default router;
