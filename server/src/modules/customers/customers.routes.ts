import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '#shared/index.js';
import * as customersController from './customers.controller.js';

const router = Router();

// All customers routes require a valid session + a matched org membership.
router.use(authMiddleware);

router.get('/', customersController.listCustomers);
router.get('/:id', customersController.getCustomer);

router.post(
  '/',
  requirePermission(PERMISSIONS.CUSTOMERS.CREATE),
  customersController.createCustomer,
);

router.patch(
  '/:id',
  requirePermission(PERMISSIONS.CUSTOMERS.UPDATE),
  customersController.updateCustomer,
);

router.delete(
  '/:id',
  requirePermission(PERMISSIONS.CUSTOMERS.DELETE),
  customersController.deleteCustomer,
);

export default router;
