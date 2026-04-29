import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '#shared/index.js';
import * as shipmentsController from './shipments.controller.js';

const router = Router();

// All shipments routes require a valid session + a matched org membership.
router.use(authMiddleware);

router.get('/', requirePermission(PERMISSIONS.SHIPMENTS.READ), shipmentsController.listShipments);

router.get('/:id', requirePermission(PERMISSIONS.SHIPMENTS.READ), shipmentsController.getShipment);

router.post(
  '/',
  requirePermission(PERMISSIONS.SHIPMENTS.CREATE),
  shipmentsController.createShipment,
);

export default router;
