import { Router } from 'express';
import { sessionMiddleware } from '../../middleware/session.middleware.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '#shared/index.js';
import {
  createOrganization,
  listMyOrganizations,
  addMember,
  updateOrganization,
  deleteOrganization,
  listMembers,
  updateMemberRole,
  removeMember,
  listInvites,
  inviteMember,
  resendInvite,
  cancelInvite,
} from './organizations.controller.js';

const router = Router();

/**
 * Root routes - Session only (no tenant context yet)
 */
router.post('/', sessionMiddleware, createOrganization);
router.get('/', sessionMiddleware, listMyOrganizations);

/**
 * Tenant-scoped management routes
 * REQUIRE authMiddleware to resolve organization context and permissions.
 * REQUIRE granular permissions for destructive or management actions.
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

// Members
router.get('/:organizationId/members', authMiddleware, listMembers);

router.post(
  '/:organizationId/members',
  authMiddleware,
  requirePermission(PERMISSIONS.ORGANIZATION.MEMBERS),
  addMember,
);

router.patch(
  '/:organizationId/members/:userId',
  authMiddleware,
  requirePermission(PERMISSIONS.ORGANIZATION.MEMBERS),
  updateMemberRole,
);

router.delete(
  '/:organizationId/members/:userId',
  authMiddleware,
  requirePermission(PERMISSIONS.ORGANIZATION.MEMBERS),
  removeMember,
);

// Invites
router.get(
  '/:organizationId/invites',
  authMiddleware,
  requirePermission(PERMISSIONS.ORGANIZATION.MEMBERS),
  listInvites,
);

router.post(
  '/:organizationId/invites',
  authMiddleware,
  requirePermission(PERMISSIONS.ORGANIZATION.MEMBERS),
  inviteMember,
);

router.post(
  '/:organizationId/invites/:inviteId/resend',
  authMiddleware,
  requirePermission(PERMISSIONS.ORGANIZATION.MEMBERS),
  resendInvite,
);

router.delete(
  '/:organizationId/invites/:inviteId',
  authMiddleware,
  requirePermission(PERMISSIONS.ORGANIZATION.MEMBERS),
  cancelInvite,
);

export default router;
