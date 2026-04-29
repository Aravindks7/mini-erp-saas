import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '#shared/contracts/rbac.contract.js';
import * as receiptsController from './receipts.controller.js';

const router = Router();

// All receipts routes require a valid session + a matched org membership.
router.use(authMiddleware);

/**
 * GET /api/receipts
 * List all receipts for the organization.
 */
router.get('/', requirePermission(PERMISSIONS.INVENTORY.READ), receiptsController.listReceipts);

/**
 * GET /api/receipts/:id
 * Get detail view of a specific receipt.
 */
router.get('/:id', requirePermission(PERMISSIONS.INVENTORY.READ), receiptsController.getReceipt);

/**
 * POST /api/receipts
 * Create a new inventory receipt.
 */
router.post(
  '/',
  requirePermission(PERMISSIONS.INVENTORY.RECEIVE),
  receiptsController.createReceipt,
);

export default router;
