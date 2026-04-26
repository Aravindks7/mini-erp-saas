import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '#shared/index.js';
import * as warehousesController from './warehouses.controller.js';

const router = Router();
const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

router.use(authMiddleware);

router.get('/', warehousesController.listWarehouses);

router.get(
  '/export',
  requirePermission(PERMISSIONS.WAREHOUSES.READ),
  warehousesController.exportWarehouses,
);

router.get(
  '/import/template',
  requirePermission(PERMISSIONS.WAREHOUSES.CREATE),
  warehousesController.getImportTemplate,
);

router.post(
  '/import',
  requirePermission(PERMISSIONS.WAREHOUSES.CREATE),
  upload.single('file'),
  warehousesController.importWarehouses,
);

router.get('/:id', warehousesController.getWarehouse);

router.post(
  '/',
  requirePermission(PERMISSIONS.WAREHOUSES.CREATE),
  warehousesController.createWarehouse,
);

router.patch(
  '/:id',
  requirePermission(PERMISSIONS.WAREHOUSES.UPDATE),
  warehousesController.updateWarehouse,
);

router.delete(
  '/',
  requirePermission(PERMISSIONS.WAREHOUSES.DELETE),
  warehousesController.bulkDeleteWarehouses,
);

router.delete(
  '/:id',
  requirePermission(PERMISSIONS.WAREHOUSES.DELETE),
  warehousesController.deleteWarehouse,
);

export default router;
