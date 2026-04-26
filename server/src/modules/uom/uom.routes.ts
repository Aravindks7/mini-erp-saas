import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '#shared/index.js';
import * as uomController from './uom.controller.js';

const router = Router();

// All UoM routes require a valid session + a matched org membership.
router.use(authMiddleware);

router.get('/', requirePermission(PERMISSIONS.UOM.READ), uomController.listUoms);

router.get('/:id', requirePermission(PERMISSIONS.UOM.READ), uomController.getUom);

router.post('/', requirePermission(PERMISSIONS.UOM.CREATE), uomController.createUom);

router.patch('/:id', requirePermission(PERMISSIONS.UOM.UPDATE), uomController.updateUom);

router.delete('/', requirePermission(PERMISSIONS.UOM.DELETE), uomController.bulkDeleteUoms);

router.delete('/:id', requirePermission(PERMISSIONS.UOM.DELETE), uomController.deleteUom);

export default router;
