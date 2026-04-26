import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '#shared/index.js';
import * as taxesController from './taxes.controller.js';

const router = Router();

// All taxes routes require a valid session + a matched org membership.
router.use(authMiddleware);

router.get('/', requirePermission(PERMISSIONS.TAXES.READ), taxesController.listTaxes);

router.get('/:id', requirePermission(PERMISSIONS.TAXES.READ), taxesController.getTax);

router.post('/', requirePermission(PERMISSIONS.TAXES.CREATE), taxesController.createTax);

router.patch('/:id', requirePermission(PERMISSIONS.TAXES.UPDATE), taxesController.updateTax);

router.delete('/', requirePermission(PERMISSIONS.TAXES.DELETE), taxesController.bulkDeleteTaxes);

router.delete('/:id', requirePermission(PERMISSIONS.TAXES.DELETE), taxesController.deleteTax);

export default router;
