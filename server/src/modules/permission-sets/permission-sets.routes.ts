import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { permissionSetsController } from './permission-sets.controller.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { PERMISSIONS } from '#shared/index.js';

const router = Router();

router.use(authMiddleware);
router.use(requirePermission(PERMISSIONS.ORGANIZATION.ROLES));

router.get('/', asyncHandler(permissionSetsController.list));
router.post('/', asyncHandler(permissionSetsController.create));
router.get('/:id', asyncHandler(permissionSetsController.get));
router.patch('/:id', asyncHandler(permissionSetsController.update));
router.delete('/:id', asyncHandler(permissionSetsController.delete));

export default router;
