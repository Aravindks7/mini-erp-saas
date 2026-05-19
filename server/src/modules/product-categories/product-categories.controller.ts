import { Request, Response } from 'express';
import { productCategoriesService } from './product-categories.service.js';
import {
  createProductCategorySchema,
  updateProductCategorySchema,
} from '#shared/contracts/product-categories.contract.js';
import { logger } from '../../utils/logger.js';
import type { DbError } from '../../types/db.js';

export async function listCategories(req: Request, res: Response) {
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const results = await productCategoriesService.listCategories(organizationId);
    res.json(results);
  } catch (error) {
    logger.error({ error, organizationId, userId }, 'Failed to list product categories');
    throw error;
  }
}

export async function getCategory(req: Request, res: Response) {
  const { id } = req.params;
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const category = await productCategoriesService.getCategoryById(organizationId, id as string);
    if (!category) {
      return res.status(404).json({ error: 'Product category not found' });
    }
    res.json(category);
  } catch (error) {
    logger.error({ error, organizationId, userId, id }, 'Failed to get product category');
    throw error;
  }
}

export async function createCategory(req: Request, res: Response) {
  const parseResult = createProductCategorySchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const newCategory = await productCategoriesService.createCategory(
      organizationId,
      userId,
      parseResult.data,
    );
    res.status(201).json(newCategory);
  } catch (error: unknown) {
    const dbError = error as DbError;
    const message = (error as Error).message;

    logger.error({ error, organizationId, userId }, 'Failed to create product category');

    if (message.includes('already exists')) {
      return res.status(409).json({ error: message });
    }

    if (message.includes('Circular dependency') || message.includes('cannot be its own parent')) {
      return res.status(400).json({ error: message });
    }

    if (dbError.code === '23505' || dbError.cause?.code === '23505') {
      return res.status(409).json({ error: 'Product category or linked entity already exists' });
    }

    throw error;
  }
}

export async function updateCategory(req: Request, res: Response) {
  const { id } = req.params;
  const parseResult = updateProductCategorySchema.safeParse({ ...req.body, id });
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const updatedCategory = await productCategoriesService.updateCategory(
      organizationId,
      userId,
      id as string,
      parseResult.data,
    );

    if (!updatedCategory) {
      return res.status(404).json({ error: 'Product category not found or update failed' });
    }

    res.json(updatedCategory);
  } catch (error: unknown) {
    const dbError = error as DbError;
    const message = (error as Error).message;

    logger.error({ error, organizationId, userId, id }, 'Failed to update product category');

    if (message.includes('already exists')) {
      return res.status(409).json({ error: message });
    }

    if (message.includes('Circular dependency') || message.includes('cannot be its own parent')) {
      return res.status(400).json({ error: message });
    }

    if (dbError.code === '23505' || dbError.cause?.code === '23505') {
      return res.status(409).json({ error: 'Product category or linked entity update conflict' });
    }

    throw error;
  }
}

export async function deleteCategory(req: Request, res: Response) {
  const { id } = req.params;
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const deletedCategory = await productCategoriesService.deleteCategory(
      organizationId,
      userId,
      id as string,
    );
    if (!deletedCategory) {
      return res.status(404).json({ error: 'Product category not found' });
    }
    res.json({ message: 'Product category deleted successfully' });
  } catch (error) {
    const message = (error as Error).message;
    logger.error({ error, organizationId, userId, id }, 'Failed to delete product category');

    if (message.includes('Cannot delete category that has sub-categories')) {
      return res.status(400).json({ error: message });
    }

    throw error;
  }
}
