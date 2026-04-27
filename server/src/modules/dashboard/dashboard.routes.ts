import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '#shared/index.js';
import * as dashboardController from './dashboard.controller.js';

const router = Router();

// All dashboard routes require a valid session + matched org membership.
router.use(authMiddleware);

router.get('/', requirePermission(PERMISSIONS.DASHBOARD.READ), dashboardController.getDashboard);

router.post(
  '/refresh',
  requirePermission(PERMISSIONS.ORGANIZATION.SETTINGS), // Restrict refresh to admins
  dashboardController.refreshDashboard,
);

export default router;
