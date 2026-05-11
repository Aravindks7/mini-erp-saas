import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '#shared/index.js';
import { currenciesController } from './currencies.controller.js';

const router = Router();

// All currencies routes require a valid session + a matched org membership.
router.use(authMiddleware);

router.get(
  '/',
  requirePermission(PERMISSIONS.CURRENCIES.READ),
  currenciesController.listCurrencies,
);
router.get(
  '/:id',
  requirePermission(PERMISSIONS.CURRENCIES.READ),
  currenciesController.getCurrency,
);
router.post(
  '/',
  requirePermission(PERMISSIONS.CURRENCIES.CREATE),
  currenciesController.createCurrency,
);
router.patch(
  '/:id',
  requirePermission(PERMISSIONS.CURRENCIES.UPDATE),
  currenciesController.updateCurrency,
);
router.delete(
  '/:id',
  requirePermission(PERMISSIONS.CURRENCIES.DELETE),
  currenciesController.deleteCurrency,
);
router.post(
  '/bulk-delete',
  requirePermission(PERMISSIONS.CURRENCIES.DELETE),
  currenciesController.bulkDeleteCurrencies,
);

export default router;
