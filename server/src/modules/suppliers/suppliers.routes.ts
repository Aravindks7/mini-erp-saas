import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '#shared/index.js';
import * as suppliersController from './suppliers.controller.js';

const router = Router();
const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// All suppliers routes require a valid session + a matched org membership.
router.use(authMiddleware);

router.get('/', suppliersController.listSuppliers);

// Export/Import routes (Higher specificity than /:id)
router.get(
  '/export',
  requirePermission(PERMISSIONS.SUPPLIERS.READ),
  suppliersController.exportSuppliers,
);

router.get(
  '/import/template',
  requirePermission(PERMISSIONS.SUPPLIERS.CREATE),
  suppliersController.getImportTemplate,
);

router.post(
  '/import',
  requirePermission(PERMISSIONS.SUPPLIERS.CREATE),
  upload.single('file'),
  suppliersController.importSuppliers,
);

router.get('/:id', suppliersController.getSupplier);

router.post(
  '/',
  requirePermission(PERMISSIONS.SUPPLIERS.CREATE),
  suppliersController.createSupplier,
);

router.patch(
  '/:id',
  requirePermission(PERMISSIONS.SUPPLIERS.UPDATE),
  suppliersController.updateSupplier,
);

router.delete(
  '/',
  requirePermission(PERMISSIONS.SUPPLIERS.DELETE),
  suppliersController.bulkDeleteSuppliers,
);

router.delete(
  '/:id',
  requirePermission(PERMISSIONS.SUPPLIERS.DELETE),
  suppliersController.deleteSupplier,
);

export default router;
