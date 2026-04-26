import { Router } from 'express';
import * as productsController from './products.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '#shared/contracts/rbac.contract.js';

const router = Router();

router.use(authMiddleware);

router.get('/', requirePermission(PERMISSIONS.PRODUCTS.READ), productsController.listProducts);

router.get('/:id', requirePermission(PERMISSIONS.PRODUCTS.READ), productsController.getProduct);

router.post('/', requirePermission(PERMISSIONS.PRODUCTS.CREATE), productsController.createProduct);

router.patch(
  '/:id',
  requirePermission(PERMISSIONS.PRODUCTS.UPDATE),
  productsController.updateProduct,
);

router.delete(
  '/bulk',
  requirePermission(PERMISSIONS.PRODUCTS.DELETE),
  productsController.bulkDeleteProducts,
);

router.delete(
  '/:id',
  requirePermission(PERMISSIONS.PRODUCTS.DELETE),
  productsController.deleteProduct,
);

export default router;
