import { Request, Response } from 'express';
import { purchaseOrdersService } from './purchase-orders.service.js';
import {
  createPurchaseOrderSchema,
  receivePurchaseOrderSchema,
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

export async function receivePO(req: Request, res: Response) {
  const { id } = req.params;
  const parseResult = receivePurchaseOrderSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const result = await purchaseOrdersService.receivePO(
      organizationId,
      userId,
      id as string,
      parseResult.data,
    );
    res.json(result);
  } catch (error: unknown) {
    logger.error({ error, organizationId, userId, id }, 'Failed to receive purchase order');
    // Return 400 for business logic violations (e.g. PO already received)
    res
      .status(400)
      .json({ error: error instanceof Error ? error.message : 'Failed to receive purchase order' });
  }
}
