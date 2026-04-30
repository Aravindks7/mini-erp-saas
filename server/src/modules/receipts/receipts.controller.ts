import { Request, Response } from 'express';
import { receiptsService } from './receipts.service.js';
import { createReceiptSchema } from '#shared/contracts/receipts.contract.js';
import { logger } from '../../utils/logger.js';

export async function listReceipts(req: Request, res: Response) {
  const organizationId = req.organizationId!;
  const userId = req.authSession!.user.id;

  try {
    const results = await receiptsService.listReceipts(organizationId);
    res.json(results);
  } catch (error) {
    logger.error({ error, organizationId, userId }, 'Failed to list receipts');
    throw error;
  }
}

export async function getReceipt(req: Request, res: Response) {
  const { id } = req.params;
  const organizationId = req.organizationId!;
  const userId = req.authSession!.user.id;

  try {
    const receipt = await receiptsService.getReceiptById(organizationId, id as string);
    if (!receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }
    res.json(receipt);
  } catch (error) {
    logger.error({ error, organizationId, userId, id }, 'Failed to get receipt');
    throw error;
  }
}

export async function createReceipt(req: Request, res: Response) {
  const parseResult = createReceiptSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const organizationId = req.organizationId!;
  const userId = req.authSession!.user.id;

  try {
    const result = await receiptsService.createReceipt(organizationId, userId, parseResult.data);
    res.status(201).json(result);
  } catch (error) {
    logger.error({ error, organizationId, userId, body: req.body }, 'Failed to create receipt');
    throw error;
  }
}

export async function deleteReceipt(req: Request, res: Response) {
  const { id } = req.params;
  const organizationId = req.organizationId!;
  const userId = req.authSession!.user.id;

  try {
    await receiptsService.deleteReceipt(organizationId, userId, id as string);
    res.status(204).end();
  } catch (error) {
    logger.error({ error, organizationId, userId, id }, 'Failed to delete receipt');
    res
      .status(400)
      .json({ error: error instanceof Error ? error.message : 'Failed to delete receipt' });
  }
}

export async function bulkDeleteReceipts(req: Request, res: Response) {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'IDs array is required' });
  }

  const organizationId = req.organizationId!;
  const userId = req.authSession!.user.id;

  try {
    await receiptsService.bulkDeleteReceipts(organizationId, userId, ids);
    res.status(204).end();
  } catch (error) {
    logger.error({ error, organizationId, userId, ids }, 'Failed to bulk delete receipts');
    res
      .status(400)
      .json({ error: error instanceof Error ? error.message : 'Failed to bulk delete receipts' });
  }
}
