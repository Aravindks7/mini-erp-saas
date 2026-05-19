import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { rolesController } from './roles.controller.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { PERMISSIONS } from '#shared/index.js';

const router = Router();

router.use(authMiddleware);
router.use(requirePermission(PERMISSIONS.ORGANIZATION.ROLES));

router.get('/', asyncHandler(rolesController.list));
router.post('/', asyncHandler(rolesController.create));
router.get('/:id', asyncHandler(rolesController.get));
router.patch('/:id', asyncHandler(rolesController.update));
router.delete('/:id', asyncHandler(rolesController.delete));

export default router;
