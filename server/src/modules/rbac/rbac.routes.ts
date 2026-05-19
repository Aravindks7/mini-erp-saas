import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { rbacController } from './rbac.controller.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { PERMISSIONS } from '#shared/index.js';

const router = Router();

/**
 * GET /rbac/permissions
 * Returns all permissions for the currently authenticated user in the active tenant.
 */
router.get('/permissions', authMiddleware, asyncHandler(rbacController.getMyPermissions));

/**
 * Management Routes (Core Permissions List)
 */
router.get(
  '/all-permissions',
  authMiddleware,
  requirePermission(PERMISSIONS.ORGANIZATION.ROLES),
  asyncHandler(rbacController.listAllPermissions),
);

export default router;
