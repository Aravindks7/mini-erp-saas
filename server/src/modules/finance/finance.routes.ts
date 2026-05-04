import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '#shared/index.js';
import * as financeController from './finance.controller.js';

const router = Router();

router.use(authMiddleware);

// Accounts
router.get(
  '/accounts',
  requirePermission(PERMISSIONS.FINANCE.READ),
  financeController.listAccounts,
);

router.post(
  '/accounts',
  requirePermission(PERMISSIONS.FINANCE.CREATE),
  financeController.createAccount,
);

router.patch(
  '/accounts/:id',
  requirePermission(PERMISSIONS.FINANCE.UPDATE),
  financeController.updateAccount,
);

// Journal Entries
router.get(
  '/journal-entries',
  requirePermission(PERMISSIONS.FINANCE.READ),
  financeController.listJournalEntries,
);

router.get(
  '/journal-entries/:id',
  requirePermission(PERMISSIONS.FINANCE.READ),
  financeController.getJournalEntry,
);

router.post(
  '/journal-entries',
  requirePermission(PERMISSIONS.FINANCE.CREATE),
  financeController.createJournalEntry,
);

router.post(
  '/journal-entries/:id/void',
  requirePermission(PERMISSIONS.FINANCE.DELETE),
  financeController.voidJournalEntry,
);

// Reports
router.get(
  '/reports/profit-and-loss',
  requirePermission(PERMISSIONS.FINANCE.READ),
  financeController.getProfitAndLoss,
);

router.get(
  '/reports/balance-sheet',
  requirePermission(PERMISSIONS.FINANCE.READ),
  financeController.getBalanceSheet,
);

export default router;
