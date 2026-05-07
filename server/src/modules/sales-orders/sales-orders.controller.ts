import { Request, Response } from 'express';
import { salesOrdersService } from './sales-orders.service.js';
import { createSalesOrderSchema } from '#shared/contracts/sales-orders.contract.js';
import { logger } from '../../utils/logger.js';

export async function listSOs(req: Request, res: Response) {
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const results = await salesOrdersService.listSOs(organizationId);
    res.json(results);
  } catch (error) {
    logger.error({ error, organizationId, userId }, 'Failed to list sales orders');
    throw error;
  }
}

export async function getSO(req: Request, res: Response) {
  const { id } = req.params;
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const so = await salesOrdersService.getSOById(organizationId, id as string);
    if (!so) {
      return res.status(404).json({ error: 'Sales order not found' });
    }
    res.json(so);
  } catch (error) {
    logger.error({ error, organizationId, userId, id }, 'Failed to get sales order');
    throw error;
  }
}

export async function createSO(req: Request, res: Response) {
  const parseResult = createSalesOrderSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const newSO = await salesOrdersService.createSO(organizationId, userId, parseResult.data);
    res.status(201).json(newSO);
  } catch (error) {
    logger.error({ error, organizationId, userId }, 'Failed to create sales order');
    throw error;
  }
}

export async function updateSO(req: Request, res: Response) {
  const { id } = req.params;
  const parseResult = createSalesOrderSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const updatedSO = await salesOrdersService.updateSO(
      organizationId,
      userId,
      id as string,
      parseResult.data,
    );
    res.json(updatedSO);
  } catch (error: unknown) {
    logger.error({ error, organizationId, userId, id }, 'Failed to update sales order');
    res
      .status(400)
      .json({ error: error instanceof Error ? error.message : 'Failed to update sales order' });
  }
}

export async function deleteSO(req: Request, res: Response) {
  const { id } = req.params;
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    await salesOrdersService.deleteSO(organizationId, userId, id as string);
    res.status(204).end();
  } catch (error: unknown) {
    logger.error({ error, organizationId, userId, id }, 'Failed to delete sales order');
    res
      .status(400)
      .json({ error: error instanceof Error ? error.message : 'Failed to delete sales order' });
  }
}

export async function bulkDeleteSOs(req: Request, res: Response) {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'IDs array is required' });
  }

  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    await salesOrdersService.bulkDeleteSOs(organizationId, userId, ids);
    res.status(204).end();
  } catch (error: unknown) {
    logger.error({ error, organizationId, userId, ids }, 'Failed to bulk delete sales orders');
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to bulk delete sales orders',
    });
  }
}

export async function updateSOStatus(req: Request, res: Response) {
  const { id } = req.params;
  const { status, action, reason } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  if (!action || !reason) {
    return res.status(400).json({ error: 'Action and Reason are required for status updates' });
  }

  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const updatedSO = await salesOrdersService.updateSOStatus(
      organizationId,
      userId,
      id as string,
      status,
      action,
      reason,
    );
    res.json(updatedSO);
  } catch (error: unknown) {
    logger.error(
      { error, organizationId, userId, id, status, action, reason },
      'Failed to update sales order status',
    );
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to update sales order status',
    });
  }
}
