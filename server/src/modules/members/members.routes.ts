import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { membersController } from './members.controller.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { PERMISSIONS } from '#shared/index.js';

const router = Router();

router.use(authMiddleware);
router.use(requirePermission(PERMISSIONS.ORGANIZATION.MEMBERS));

router.get('/', asyncHandler(membersController.list));
router.patch('/:id/role', asyncHandler(membersController.updateRole));
router.delete('/:id', asyncHandler(membersController.remove));

export default router;
