import { Request, Response } from 'express';
import { productsService } from './products.service.js';
import {
  createProductSchema,
  updateProductSchema,
  bulkDeleteProductsSchema,
} from '#shared/contracts/products.contract.js';
import { logger } from '../../utils/logger.js';
import { AppError } from '../../utils/AppError.js';
import type { DbError } from '../../types/db.js';

export async function listProducts(req: Request, res: Response) {
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const results = await productsService.listProducts(organizationId);
    res.json(results);
  } catch (error) {
    logger.error({ error, organizationId, userId }, 'Failed to list products');
    throw error;
  }
}

export async function getProduct(req: Request, res: Response) {
  const { id } = req.params;
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const product = await productsService.getProductById(organizationId, id as string);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    logger.error({ error, organizationId, userId, id }, 'Failed to get product');
    throw error;
  }
}

export async function createProduct(req: Request, res: Response) {
  const parseResult = createProductSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const newProduct = await productsService.createProduct(
      organizationId,
      userId,
      parseResult.data,
    );

    res.status(201).json(newProduct);
  } catch (error) {
    logger.error({ error, organizationId, userId }, 'Failed to create product');

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    const dbError = error as DbError;
    if (dbError.code === '23505' || dbError.cause?.code === '23505') {
      return res.status(409).json({ error: 'Product SKU already exists' });
    }
    throw error;
  }
}

export async function updateProduct(req: Request, res: Response) {
  const { id } = req.params;
  const parseResult = updateProductSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const updatedProduct = await productsService.updateProduct(
      organizationId,
      userId,
      id as string,
      parseResult.data,
    );
    res.json(updatedProduct);
  } catch (error) {
    logger.error({ error, organizationId, userId, id }, 'Failed to update product');

    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    const dbError = error as DbError;
    if (dbError.code === '23505' || dbError.cause?.code === '23505') {
      return res.status(409).json({ error: 'Product SKU already exists' });
    }
    throw error;
  }
}

export async function deleteProduct(req: Request, res: Response) {
  const { id } = req.params;
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    await productsService.deleteProduct(organizationId, userId, id as string);
    res.status(204).end();
  } catch (error) {
    logger.error({ error, organizationId, userId, id }, 'Failed to delete product');
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    throw error;
  }
}

export async function bulkDeleteProducts(req: Request, res: Response) {
  const parseResult = bulkDeleteProductsSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    await productsService.bulkDeleteProducts(organizationId, userId, parseResult.data.ids);
    res.status(204).end();
  } catch (error) {
    logger.error({ error, organizationId, userId }, 'Failed to bulk delete products');
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    throw error;
  }
}
