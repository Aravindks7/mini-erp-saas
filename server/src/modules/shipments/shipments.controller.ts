import { Request, Response } from 'express';
import { shipmentsService } from './shipments.service.js';
import {
  createShipmentSchema,
  updateShipmentSchema,
} from '#shared/contracts/shipments.contract.js';
import { logger } from '../../utils/logger.js';

export async function listShipments(req: Request, res: Response) {
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const results = await shipmentsService.listShipments(organizationId);
    res.json(results);
  } catch (error) {
    logger.error({ error, organizationId, userId }, 'Failed to list shipments');
    throw error;
  }
}

export async function getShipment(req: Request, res: Response) {
  const { id } = req.params;
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const shipment = await shipmentsService.getShipmentById(organizationId, id as string);
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }
    res.json(shipment);
  } catch (error) {
    logger.error({ error, organizationId, userId, id }, 'Failed to get shipment');
    throw error;
  }
}

export async function createShipment(req: Request, res: Response) {
  const parseResult = createShipmentSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const newShipment = await shipmentsService.createShipment(
      organizationId,
      userId,
      parseResult.data,
    );

    if (!newShipment) {
      return res.status(500).json({ error: 'Failed to create shipment' });
    }

    res.status(201).json(newShipment);
  } catch (error: unknown) {
    logger.error({ error, organizationId, userId }, 'Failed to create shipment');
    res.status(400).json({ error: (error as Error).message || 'Failed to create shipment' });
  }
}

export async function updateShipment(req: Request, res: Response) {
  const { id } = req.params;
  const parseResult = updateShipmentSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const organizationId = req.organizationId!;
  const userId = req.authSession!.user.id;

  try {
    const result = await shipmentsService.updateShipment(
      organizationId,
      userId,
      id as string,
      parseResult.data,
    );
    res.json(result);
  } catch (error) {
    logger.error(
      { error, organizationId, userId, id, body: req.body },
      'Failed to update shipment',
    );
    res.status(400).json({ error: error instanceof Error ? error.message : 'Update failed' });
  }
}

export async function deleteShipment(req: Request, res: Response) {
  const { id } = req.params;
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    await shipmentsService.deleteShipment(organizationId, userId, id as string);
    res.status(204).end();
  } catch (error: unknown) {
    logger.error({ error, organizationId, userId, id }, 'Failed to delete shipment');
    res.status(400).json({ error: (error as Error).message || 'Failed to delete shipment' });
  }
}

export async function bulkDeleteShipments(req: Request, res: Response) {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'IDs array is required' });
  }

  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    await shipmentsService.bulkDeleteShipments(organizationId, userId, ids);
    res.status(204).end();
  } catch (error: unknown) {
    logger.error({ error, organizationId, userId, ids }, 'Failed to bulk delete shipments');
    res.status(400).json({ error: (error as Error).message || 'Failed to bulk delete shipments' });
  }
}
