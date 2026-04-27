import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '#shared/index.js';
import * as salesOrdersController from './sales-orders.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/', requirePermission(PERMISSIONS.SALES_ORDERS.READ), salesOrdersController.listSOs);

router.get('/:id', requirePermission(PERMISSIONS.SALES_ORDERS.READ), salesOrdersController.getSO);

router.post(
  '/',
  requirePermission(PERMISSIONS.SALES_ORDERS.CREATE),
  salesOrdersController.createSO,
);

router.patch(
  '/:id',
  requirePermission(PERMISSIONS.SALES_ORDERS.UPDATE),
  salesOrdersController.updateSO,
);

router.post(
  '/:id/fulfill',
  requirePermission(PERMISSIONS.SALES_ORDERS.UPDATE),
  salesOrdersController.fulfillSO,
);

export default router;
