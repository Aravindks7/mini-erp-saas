import { Request, Response } from 'express';
import { uomService } from './uom.service.js';
import {
  createUomSchema,
  updateUomSchema,
  bulkDeleteUomSchema,
} from '#shared/contracts/uom.contract.js';
import { logger } from '../../utils/logger.js';
import type { DbError } from '../../types/db.js';

export async function listUoms(req: Request, res: Response) {
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const results = await uomService.listUoms(organizationId);
    res.json(results);
  } catch (error) {
    logger.error({ error, organizationId, userId }, 'Failed to list UoMs');
    throw error;
  }
}

export async function getUom(req: Request, res: Response) {
  const { id } = req.params;
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const uom = await uomService.getUomById(organizationId, id as string);
    if (!uom) {
      return res.status(404).json({ error: 'UoM not found' });
    }
    res.json(uom);
  } catch (error) {
    logger.error({ error, organizationId, userId, id }, 'Failed to get UoM');
    throw error;
  }
}

export async function createUom(req: Request, res: Response) {
  const parseResult = createUomSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const newUom = await uomService.createUom(organizationId, userId, parseResult.data);

    res.status(201).json(newUom);
  } catch (error: unknown) {
    const dbError = error as DbError;
    logger.error({ error, organizationId, userId }, 'Failed to create UoM');
    if (
      dbError.code === '23505' ||
      dbError.cause?.code === '23505' ||
      (error as Error).message.includes('already exists')
    ) {
      return res
        .status(409)
        .json({ error: (error as Error).message || 'UoM with this code already exists' });
    }
    throw error;
  }
}

export async function updateUom(req: Request, res: Response) {
  const { id } = req.params;
  const parseResult = updateUomSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const updatedUom = await uomService.updateUom(
      organizationId,
      userId,
      id as string,
      parseResult.data,
    );

    if (!updatedUom) {
      return res.status(404).json({ error: 'UoM not found' });
    }

    res.json(updatedUom);
  } catch (error: unknown) {
    const dbError = error as DbError;
    logger.error({ error, organizationId, userId, id }, 'Failed to update UoM');
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

export async function deleteUom(req: Request, res: Response) {
  const { id } = req.params;
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const deletedUom = await uomService.deleteUom(organizationId, userId, id as string);
    if (!deletedUom) {
      return res.status(404).json({ error: 'UoM not found' });
    }
    res.json({ message: 'UoM deleted successfully' });
  } catch (error) {
    logger.error({ error, organizationId, userId, id }, 'Failed to delete UoM');
    throw error;
  }
}

export async function bulkDeleteUoms(req: Request, res: Response) {
  const parseResult = bulkDeleteUomSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const deletedUoms = await uomService.bulkDeleteUoms(
      organizationId,
      userId,
      parseResult.data.ids,
    );

    res.json({
      message: `Successfully deleted ${deletedUoms.length} UoMs`,
      deletedCount: deletedUoms.length,
      deletedIds: deletedUoms.map((u) => u.id),
    });
  } catch (error) {
    logger.error({ error, organizationId, userId }, 'Failed to bulk delete UoMs');
    throw error;
  }
}
