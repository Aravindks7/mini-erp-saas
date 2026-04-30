import { Router } from 'express';
import * as paymentsController from './payments.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '#shared/index.js';

const router = Router();

router.use(authMiddleware);

router.get('/', requirePermission(PERMISSIONS.PAYMENTS.READ), paymentsController.listPayments);

router.get('/:id', requirePermission(PERMISSIONS.PAYMENTS.READ), paymentsController.getPayment);

router.post('/', requirePermission(PERMISSIONS.PAYMENTS.CREATE), paymentsController.createPayment);

router.delete(
  '/',
  requirePermission(PERMISSIONS.PAYMENTS.DELETE),
  paymentsController.bulkDeletePayments,
);

router.delete(
  '/:id',
  requirePermission(PERMISSIONS.PAYMENTS.DELETE),
  paymentsController.deletePayment,
);

export default router;
