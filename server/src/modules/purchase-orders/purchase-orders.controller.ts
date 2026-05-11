import { Request, Response } from 'express';
import { purchaseOrdersService } from './purchase-orders.service.js';
import {
  createPurchaseOrderSchema,
  updatePurchaseOrderStatusSchema,
} from '#shared/contracts/purchase-orders.contract.js';
import { logger } from '../../utils/logger.js';

/**
 * Controller for Purchase Orders.
 * Axiom: Map HTTP intents to the PurchaseOrdersService while enforcing clinical error handling.
 */

export async function listPOs(req: Request, res: Response) {
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const results = await purchaseOrdersService.listPOs(organizationId);
    res.json(results);
  } catch (error) {
    logger.error({ error, organizationId, userId }, 'Failed to list purchase orders');
    throw error;
  }
}

export async function getPO(req: Request, res: Response) {
  const { id } = req.params;
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const po = await purchaseOrdersService.getPOById(organizationId, id as string);
    if (!po) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }
    res.json(po);
  } catch (error) {
    logger.error({ error, organizationId, userId, id }, 'Failed to get purchase order');
    throw error;
  }
}

export async function createPO(req: Request, res: Response) {
  const parseResult = createPurchaseOrderSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const newPO = await purchaseOrdersService.createPO(organizationId, userId, parseResult.data);
    res.status(201).json(newPO);
  } catch (error) {
    logger.error({ error, organizationId, userId }, 'Failed to create purchase order');
    throw error;
  }
}

export async function updatePO(req: Request, res: Response) {
  const { id } = req.params;
  const parseResult = createPurchaseOrderSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const updatedPO = await purchaseOrdersService.updatePO(
      organizationId,
      userId,
      id as string,
      parseResult.data,
    );
    res.json(updatedPO);
  } catch (error: unknown) {
    logger.error({ error, organizationId, userId, id }, 'Failed to update purchase order');
    res
      .status(400)
      .json({ error: error instanceof Error ? error.message : 'Failed to update purchase order' });
  }
}

export async function deletePO(req: Request, res: Response) {
  const { id } = req.params;
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    await purchaseOrdersService.deletePO(organizationId, userId, id as string);
    res.status(204).end();
  } catch (error: unknown) {
    logger.error({ error, organizationId, userId, id }, 'Failed to delete purchase order');
    res
      .status(400)
      .json({ error: error instanceof Error ? error.message : 'Failed to delete purchase order' });
  }
}

export async function bulkDeletePOs(req: Request, res: Response) {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'IDs array is required' });
  }

  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    await purchaseOrdersService.bulkDeletePOs(organizationId, userId, ids);
    res.status(204).end();
  } catch (error: unknown) {
    logger.error({ error, organizationId, userId, ids }, 'Failed to bulk delete purchase orders');
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to bulk delete purchase orders',
    });
  }
}

export async function updatePOStatus(req: Request, res: Response) {
  const { id } = req.params;
  const parseResult = updatePurchaseOrderStatusSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const updatedPO = await purchaseOrdersService.updatePOStatus(
      organizationId,
      userId,
      id as string,
      parseResult.data.status,
      parseResult.data.action as any,
      parseResult.data.reason,
    );
    res.json(updatedPO);
  } catch (error: unknown) {
    logger.error({ error, organizationId, userId, id }, 'Failed to update purchase order status');
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to update purchase order status',
    });
  }
}
