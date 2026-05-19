import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '#shared/index.js';
import * as productCategoriesController from './product-categories.controller.js';

const router = Router();

// All product categories routes require a valid session + a matched org membership.
router.use(authMiddleware);

router.get(
  '/',
  requirePermission(PERMISSIONS.PRODUCT_CATEGORIES.READ),
  productCategoriesController.listCategories,
);

router.get(
  '/:id',
  requirePermission(PERMISSIONS.PRODUCT_CATEGORIES.READ),
  productCategoriesController.getCategory,
);

router.post(
  '/',
  requirePermission(PERMISSIONS.PRODUCT_CATEGORIES.CREATE),
  productCategoriesController.createCategory,
);

router.patch(
  '/:id',
  requirePermission(PERMISSIONS.PRODUCT_CATEGORIES.UPDATE),
  productCategoriesController.updateCategory,
);

router.delete(
  '/:id',
  requirePermission(PERMISSIONS.PRODUCT_CATEGORIES.DELETE),
  productCategoriesController.deleteCategory,
);

export default router;
