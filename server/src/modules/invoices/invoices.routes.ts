import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '#shared/index.js';
import * as invoicesController from './invoices.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/', requirePermission(PERMISSIONS.INVOICES.READ), invoicesController.listInvoices);

router.get('/:id', requirePermission(PERMISSIONS.INVOICES.READ), invoicesController.getInvoice);

router.post('/', requirePermission(PERMISSIONS.INVOICES.CREATE), invoicesController.createInvoice);

router.post(
  '/from-so/:soId',
  requirePermission(PERMISSIONS.INVOICES.CREATE),
  invoicesController.createFromSalesOrder,
);

router.patch(
  '/:id/status',
  requirePermission(PERMISSIONS.INVOICES.UPDATE),
  invoicesController.updateInvoiceStatus,
);

export default router;
