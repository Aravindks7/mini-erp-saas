import { Request, Response } from 'express';
import { shipmentsService } from './shipments.service.js';
import { createShipmentSchema } from '#shared/contracts/shipments.contract.js';
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
