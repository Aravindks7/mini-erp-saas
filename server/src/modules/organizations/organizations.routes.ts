import { Router } from 'express';
import { sessionMiddleware } from '../../middleware/session.middleware.js';
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

// These routes only require a valid session, not a tenant ID.
router.use(sessionMiddleware);

router.post('/', createOrganization);
router.get('/', listMyOrganizations);

router.patch('/:organizationId', updateOrganization);
router.delete('/:organizationId', deleteOrganization);
router.get('/:organizationId/members', listMembers);
router.post('/:organizationId/members', addMember);
router.patch('/:organizationId/members/:userId', updateMemberRole);
router.delete('/:organizationId/members/:userId', removeMember);

router.get('/:organizationId/invites', listInvites);
router.post('/:organizationId/invites', inviteMember);
router.post('/:organizationId/invites/:inviteId/resend', resendInvite);
router.delete('/:organizationId/invites/:inviteId', cancelInvite);

export default router;
