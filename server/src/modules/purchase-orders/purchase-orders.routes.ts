import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '#shared/index.js';
import * as purchaseOrdersController from './purchase-orders.controller.js';

const router = Router();

// All purchase order routes require a valid session + matched org membership.
router.use(authMiddleware);

router.get(
  '/',
  requirePermission(PERMISSIONS.PURCHASE_ORDERS.READ),
  purchaseOrdersController.listPOs,
);

router.get(
  '/:id',
  requirePermission(PERMISSIONS.PURCHASE_ORDERS.READ),
  purchaseOrdersController.getPO,
);

router.post(
  '/',
  requirePermission(PERMISSIONS.PURCHASE_ORDERS.CREATE),
  purchaseOrdersController.createPO,
);

router.patch(
  '/:id',
  requirePermission(PERMISSIONS.PURCHASE_ORDERS.UPDATE),
  purchaseOrdersController.updatePO,
);

router.post(
  '/:id/receive',
  requirePermission(PERMISSIONS.PURCHASE_ORDERS.UPDATE),
  purchaseOrdersController.receivePO,
);

export default router;
