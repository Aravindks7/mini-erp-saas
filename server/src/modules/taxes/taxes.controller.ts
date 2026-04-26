import { Request, Response } from 'express';
import { taxesService } from './taxes.service.js';
import {
  createTaxSchema,
  updateTaxSchema,
  bulkDeleteTaxesSchema,
} from '#shared/contracts/taxes.contract.js';
import { logger } from '../../utils/logger.js';
import type { DbError } from '../../types/db.js';

export async function listTaxes(req: Request, res: Response) {
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const results = await taxesService.listTaxes(organizationId);
    res.json(results);
  } catch (error) {
    logger.error({ error, organizationId, userId }, 'Failed to list taxes');
    throw error;
  }
}

export async function getTax(req: Request, res: Response) {
  const { id } = req.params;
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const tax = await taxesService.getTaxById(organizationId, id as string);
    if (!tax) {
      return res.status(404).json({ error: 'Tax not found' });
    }
    res.json(tax);
  } catch (error) {
    logger.error({ error, organizationId, userId, id }, 'Failed to get tax');
    throw error;
  }
}

export async function createTax(req: Request, res: Response) {
  const parseResult = createTaxSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const newTax = await taxesService.createTax(organizationId, userId, parseResult.data);

    res.status(201).json(newTax);
  } catch (error: unknown) {
    const dbError = error as DbError;
    logger.error({ error, organizationId, userId }, 'Failed to create tax');
    if (
      dbError.code === '23505' ||
      dbError.cause?.code === '23505' ||
      (error as Error).message.includes('already exists')
    ) {
      return res
        .status(409)
        .json({ error: (error as Error).message || 'Tax with this name already exists' });
    }
    throw error;
  }
}

export async function updateTax(req: Request, res: Response) {
  const { id } = req.params;
  const parseResult = updateTaxSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const updatedTax = await taxesService.updateTax(
      organizationId,
      userId,
      id as string,
      parseResult.data,
    );

    if (!updatedTax) {
      return res.status(404).json({ error: 'Tax not found' });
    }

    res.json(updatedTax);
  } catch (error: unknown) {
    const dbError = error as DbError;
    logger.error({ error, organizationId, userId, id }, 'Failed to update tax');
    if (
      dbError.code === '23505' ||
      dbError.cause?.code === '23505' ||
      (error as Error).message.includes('already exists')
    ) {
      return res.status(409).json({ error: (error as Error).message || 'Update conflict' });
    }
    throw error;
  }
}

export async function deleteTax(req: Request, res: Response) {
  const { id } = req.params;
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const deletedTax = await taxesService.deleteTax(organizationId, userId, id as string);
    if (!deletedTax) {
      return res.status(404).json({ error: 'Tax not found' });
    }
    res.json({ message: 'Tax deleted successfully' });
  } catch (error) {
    logger.error({ error, organizationId, userId, id }, 'Failed to delete tax');
    throw error;
  }
}

export async function bulkDeleteTaxes(req: Request, res: Response) {
  const parseResult = bulkDeleteTaxesSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const deletedTaxes = await taxesService.bulkDeleteTaxes(
      organizationId,
      userId,
      parseResult.data.ids,
    );

    res.json({
      message: `Successfully deleted ${deletedTaxes.length} taxes`,
      deletedCount: deletedTaxes.length,
      deletedIds: deletedTaxes.map((t) => t.id),
    });
  } catch (error) {
    logger.error({ error, organizationId, userId }, 'Failed to bulk delete taxes');
    throw error;
  }
}
