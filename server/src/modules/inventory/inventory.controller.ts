import { Request, Response } from 'express';
import { inventoryService } from './inventory.service.js';
import {
  createInventoryAdjustmentSchema,
  updateAdjustmentStatusSchema,
} from '#shared/contracts/inventory-adjustments.contract.js';
import {
  createInventoryTransferSchema,
  updateTransferStatusSchema,
} from '#shared/contracts/inventory-transfers.contract.js';
import { logger } from '../../utils/logger.js';
import type { DbError } from '../../types/db.js';

/**
 * InventoryController: HTTP layer for stock management.
 * Axiom: Handle request validation and error mapping, delegate logic to service.
 */

export async function createAdjustment(req: Request, res: Response) {
  const parseResult = createInventoryAdjustmentSchema.safeParse(req.body);
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

export async function updateAdjustmentStatus(req: Request, res: Response) {
  const { id } = req.params;
  const parseResult = updateAdjustmentStatusSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    if (parseResult.data.status === 'approved') {
      const result = await inventoryService.approveAdjustment(organizationId, userId, id as string);
      return res.json(result);
    }
    // Handle cancel if needed
    res.status(400).json({ error: 'Unsupported status update' });
  } catch (error) {
    logger.error({ error, organizationId, userId, id }, 'Failed to update adjustment status');
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

/**
 * Transfers
 */

export async function createTransfer(req: Request, res: Response) {
  const parseResult = createInventoryTransferSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const result = await inventoryService.createTransfer(organizationId, userId, parseResult.data);
    res.status(201).json(result);
  } catch (error) {
    logger.error({ error, organizationId, userId }, 'Failed to create inventory transfer');
    throw error;
  }
}

export async function updateTransferStatus(req: Request, res: Response) {
  const { id } = req.params;
  const parseResult = updateTransferStatusSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    let result;
    if (parseResult.data.status === 'shipped') {
      result = await inventoryService.shipTransfer(organizationId, userId, id as string);
    } else if (parseResult.data.status === 'received') {
      result = await inventoryService.receiveTransfer(organizationId, userId, id as string);
    } else {
      return res.status(400).json({ error: 'Unsupported status' });
    }
    res.json(result);
  } catch (error) {
    logger.error({ error, organizationId, userId, id }, 'Failed to update transfer status');
    throw error;
  }
}

export async function listTransfers(req: Request, res: Response) {
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const results = await inventoryService.listTransfers(organizationId);
    res.json(results);
  } catch (error) {
    logger.error({ error, organizationId, userId }, 'Failed to list inventory transfers');
    throw error;
  }
}

export async function getTransfer(req: Request, res: Response) {
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'Missing transfer ID' });
  }

  try {
    const result = await inventoryService.getTransferById(organizationId, id as string);
    if (!result) {
      return res.status(404).json({ error: 'Inventory transfer not found' });
    }
    res.json(result);
  } catch (error) {
    logger.error({ error, organizationId, userId, id }, 'Failed to get inventory transfer');
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

export async function getInventoryLevel(req: Request, res: Response) {
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;
  const { id } = req.params;

  try {
    const result = await inventoryService.getInventoryLevel(organizationId, id as string);
    if (!result) return res.status(404).json({ error: 'Inventory level not found' });
    res.json(result);
  } catch (error) {
    logger.error({ error, organizationId, userId, id }, 'Failed to get inventory level');
    throw error;
  }
}

export async function listLevelLedgerEntries(req: Request, res: Response) {
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;
  const { id } = req.params;

  try {
    const results = await inventoryService.listLevelLedgerEntries(organizationId, id as string);
    res.json(results);
  } catch (error) {
    logger.error({ error, organizationId, userId, id }, 'Failed to list level ledger entries');
    throw error;
  }
}

export async function listLedgerEntries(req: Request, res: Response) {
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const results = await inventoryService.listLedgerEntries(organizationId);
    res.json(results);
  } catch (error) {
    logger.error({ error, organizationId, userId }, 'Failed to list ledger entries');
    throw error;
  }
}
