import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { invitationsController } from './invitations.controller.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { PERMISSIONS } from '#shared/index.js';

const router = Router();

router.use(authMiddleware);
router.use(requirePermission(PERMISSIONS.ORGANIZATION.MEMBERS));

router.get('/', asyncHandler(invitationsController.list));
router.post('/', asyncHandler(invitationsController.invite));
router.post('/:id/resend', asyncHandler(invitationsController.resend));
router.post('/:id/cancel', asyncHandler(invitationsController.cancel));

export default router;
