import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '#shared/index.js';
import * as customersController from './customers.controller.js';

const router = Router();
const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// All customers routes require a valid session + a matched org membership.
router.use(authMiddleware);

router.get('/', customersController.listCustomers);

// Export/Import routes (Higher specificity than /:id)
router.get(
  '/export',
  requirePermission(PERMISSIONS.CUSTOMERS.READ),
  customersController.exportCustomers,
);

router.get(
  '/import/template',
  requirePermission(PERMISSIONS.CUSTOMERS.CREATE),
  customersController.getImportTemplate,
);

router.post(
  '/import',
  requirePermission(PERMISSIONS.CUSTOMERS.CREATE),
  upload.single('file'),
  customersController.importCustomers,
);

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
  '/',
  requirePermission(PERMISSIONS.CUSTOMERS.DELETE),
  customersController.bulkDeleteCustomers,
);

router.delete(
  '/:id',
  requirePermission(PERMISSIONS.CUSTOMERS.DELETE),
  customersController.deleteCustomer,
);

export default router;
