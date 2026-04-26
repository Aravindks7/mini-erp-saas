import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '#shared/contracts/rbac.contract.js';
import * as inventoryController from './inventory.controller.js';

const router = Router();

// All inventory routes require a valid session + a matched org membership.
router.use(authMiddleware);

/**
 * GET /inventory/levels
 * Real-time stock status.
 */
router.get(
  '/levels',
  requirePermission(PERMISSIONS.INVENTORY.READ),
  inventoryController.listInventoryLevels,
);

/**
 * GET /inventory/ledger
 * Movement history for audit trail.
 */
router.get(
  '/ledger',
  requirePermission(PERMISSIONS.INVENTORY.READ),
  inventoryController.listLedgerEntries,
);

/**
 * GET /inventory/adjustments
 * Audit trail of stock corrections.
 */
router.get(
  '/adjustments',
  requirePermission(PERMISSIONS.INVENTORY.READ),
  inventoryController.listAdjustments,
);

/**
 * GET /inventory/adjustments/:id
 * Detail view of a stock correction.
 */
router.get(
  '/adjustments/:id',
  requirePermission(PERMISSIONS.INVENTORY.READ),
  inventoryController.getAdjustment,
);

/**
 * POST /inventory/adjustments
 * Create a new stock correction document.
 */
router.post(
  '/adjustments',
  requirePermission(PERMISSIONS.INVENTORY.ADJUST),
  inventoryController.createAdjustment,
);

export default router;
