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
 * Management Routes (Require PERMISSIONS.ORGANIZATION.ROLES)
 */

router.get(
  '/all-permissions',
  authMiddleware,
  requirePermission(PERMISSIONS.ORGANIZATION.ROLES),
  asyncHandler(rbacController.listAllPermissions),
);

router.get(
  '/sets',
  authMiddleware,
  requirePermission(PERMISSIONS.ORGANIZATION.ROLES),
  asyncHandler(rbacController.listPermissionSets),
);

router.post(
  '/sets',
  authMiddleware,
  requirePermission(PERMISSIONS.ORGANIZATION.ROLES),
  asyncHandler(rbacController.createPermissionSet),
);

router.get(
  '/sets/:id',
  authMiddleware,
  requirePermission(PERMISSIONS.ORGANIZATION.ROLES),
  asyncHandler(rbacController.getPermissionSet),
);

router.patch(
  '/sets/:id',
  authMiddleware,
  requirePermission(PERMISSIONS.ORGANIZATION.ROLES),
  asyncHandler(rbacController.updatePermissionSet),
);

router.delete(
  '/sets/:id',
  authMiddleware,
  requirePermission(PERMISSIONS.ORGANIZATION.ROLES),
  asyncHandler(rbacController.deletePermissionSet),
);

router.get(
  '/roles',
  authMiddleware,
  requirePermission(PERMISSIONS.ORGANIZATION.ROLES),
  asyncHandler(rbacController.listRoles),
);

router.post(
  '/roles',
  authMiddleware,
  requirePermission(PERMISSIONS.ORGANIZATION.ROLES),
  asyncHandler(rbacController.createRole),
);

router.get(
  '/roles/:id',
  authMiddleware,
  requirePermission(PERMISSIONS.ORGANIZATION.ROLES),
  asyncHandler(rbacController.getRole),
);

router.patch(
  '/roles/:id',
  authMiddleware,
  requirePermission(PERMISSIONS.ORGANIZATION.ROLES),
  asyncHandler(rbacController.updateRole),
);

router.delete(
  '/roles/:id',
  authMiddleware,
  requirePermission(PERMISSIONS.ORGANIZATION.ROLES),
  asyncHandler(rbacController.deleteRole),
);

export default router;
