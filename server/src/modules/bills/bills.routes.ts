import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '#shared/index.js';
import * as billsController from './bills.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/', requirePermission(PERMISSIONS.BILLS.READ), billsController.listBills);

router.get('/:id', requirePermission(PERMISSIONS.BILLS.READ), billsController.getBill);

router.post('/', requirePermission(PERMISSIONS.BILLS.CREATE), billsController.createBill);

router.post(
  '/from-receipt/:receiptId',
  requirePermission(PERMISSIONS.BILLS.CREATE),
  billsController.createFromReceipt,
);

router.patch(
  '/:id/status',
  requirePermission(PERMISSIONS.BILLS.UPDATE),
  billsController.updateBillStatus,
);

export default router;
