import { Request, Response } from 'express';
import { inventoryService } from './inventory.service.js';
import { createAdjustmentSchema } from '#shared/contracts/inventory.contract.js';
import { logger } from '../../utils/logger.js';
import type { DbError } from '../../types/db.js';

/**
 * InventoryController: HTTP layer for stock management.
 * Axiom: Handle request validation and error mapping, delegate logic to service.
 */

export async function createAdjustment(req: Request, res: Response) {
  const parseResult = createAdjustmentSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const newAdjustment = await inventoryService.createAdjustment(
      organizationId,
      userId,
      parseResult.data,
    );
    res.status(201).json(newAdjustment);
  } catch (error: unknown) {
    const dbError = error as DbError;
    logger.error({ error, organizationId, userId }, 'Failed to create inventory adjustment');

    // Handle check constraint violation (23514: CHECK VIOLATION)
    // Axiom: We interpret negative stock violation as a business validation error.
    if (dbError.code === '23514' || dbError.cause?.code === '23514') {
      return res.status(400).json({
        error: 'Inventory levels cannot be negative. Please check your quantities.',
      });
    }

    throw error;
  }
}

export async function listAdjustments(req: Request, res: Response) {
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const results = await inventoryService.listAdjustments(organizationId);
    res.json(results);
  } catch (error) {
    logger.error({ error, organizationId, userId }, 'Failed to list inventory adjustments');
    throw error;
  }
}

export async function getAdjustment(req: Request, res: Response) {
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'Missing adjustment ID' });
  }

  try {
    const result = await inventoryService.getAdjustmentById(organizationId, id as string);
    if (!result) {
      return res.status(404).json({ error: 'Inventory adjustment not found' });
    }
    res.json(result);
  } catch (error) {
    logger.error({ error, organizationId, userId, id }, 'Failed to get inventory adjustment');
    throw error;
  }
}

export async function listInventoryLevels(req: Request, res: Response) {
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const results = await inventoryService.listInventoryLevels(organizationId);
    res.json(results);
  } catch (error) {
    logger.error({ error, organizationId, userId }, 'Failed to list inventory levels');
    throw error;
  }
}

export async function listLedgerEntries(req: Request, res: Response) {
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;
  const { productId, warehouseId, binId } = req.query;

  try {
    const results = await inventoryService.listLedgerEntries(organizationId, {
      productId: productId as string,
      warehouseId: warehouseId as string,
      binId: binId as string,
    });
    res.json(results);
  } catch (error) {
    logger.error({ error, organizationId, userId }, 'Failed to list ledger entries');
    throw error;
  }
}
