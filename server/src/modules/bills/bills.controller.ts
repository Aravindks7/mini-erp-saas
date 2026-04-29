import { Request, Response } from 'express';
import { billsService } from './bills.service.js';
import { createBillSchema, updateBillStatusSchema } from '#shared/contracts/bills.contract.js';
import { logger } from '../../utils/logger.js';

export async function listBills(req: Request, res: Response) {
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const results = await billsService.listBills(organizationId);
    res.json(results);
  } catch (error) {
    logger.error({ error, organizationId, userId }, 'Failed to list bills');
    throw error;
  }
}

export async function getBill(req: Request, res: Response) {
  const { id } = req.params;
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const bill = await billsService.getBillById(organizationId, id as string);
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    res.json(bill);
  } catch (error) {
    logger.error({ error, organizationId, userId, id }, 'Failed to get bill');
    throw error;
  }
}

export async function createBill(req: Request, res: Response) {
  const parseResult = createBillSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const newBill = await billsService.createBill(organizationId, userId, parseResult.data);
    res.status(201).json(newBill);
  } catch (error) {
    logger.error({ error, organizationId, userId }, 'Failed to create bill');
    throw error;
  }
}

export async function createFromReceipt(req: Request, res: Response) {
  const { receiptId } = req.params;
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const newBill = await billsService.createFromReceipt(
      organizationId,
      userId,
      receiptId as string,
    );
    res.status(201).json(newBill);
  } catch (error) {
    logger.error(
      { error, organizationId, userId, receiptId },
      'Failed to create bill from receipt',
    );
    throw error;
  }
}

export async function updateBillStatus(req: Request, res: Response) {
  const { id } = req.params;
  const parseResult = updateBillStatusSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const updated = await billsService.updateBillStatus(
      organizationId,
      userId,
      id as string,
      parseResult.data,
    );
    if (!updated) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    res.json(updated);
  } catch (error) {
    logger.error({ error, organizationId, userId, id }, 'Failed to update bill status');
    throw error;
  }
}
