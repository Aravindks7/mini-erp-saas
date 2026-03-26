import { Router } from 'express';
import { sessionMiddleware } from '../../middleware/session.middleware';
import {
  createOrganization,
  listMyOrganizations,
  addMember,
  inviteMember,
} from './organizations.controller';

const router = Router();

// These routes only require a valid session, not a tenant ID.
router.use(sessionMiddleware);

router.post('/', createOrganization);
router.get('/', listMyOrganizations);
router.post('/:organizationId/members', addMember);
router.post('/:organizationId/invites', inviteMember);

export default router;
