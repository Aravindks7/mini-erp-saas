import { Router } from 'express';
import { sessionMiddleware } from '../../middleware/session.middleware.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '#shared/index.js';
import {
  createOrganization,
  listMyOrganizations,
  updateOrganization,
  deleteOrganization,
} from './organizations.controller.js';

const router = Router();

/**
 * Root routes - Session only (no tenant context yet)
 */
router.post('/', sessionMiddleware, createOrganization);
router.get('/', sessionMiddleware, listMyOrganizations);

/**
 * Tenant-scoped management routes
 */
router.patch(
  '/:organizationId',
  authMiddleware,
  requirePermission(PERMISSIONS.ORGANIZATION.SETTINGS),
  updateOrganization,
);

router.delete(
  '/:organizationId',
  authMiddleware,
  requirePermission(PERMISSIONS.ORGANIZATION.SETTINGS),
  deleteOrganization,
);

export default router;
