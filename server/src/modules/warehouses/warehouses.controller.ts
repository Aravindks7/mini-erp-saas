import { Request, Response } from 'express';
import { warehousesService } from './warehouses.service.js';
import {
  createWarehouseSchema,
  updateWarehouseSchema,
  bulkDeleteWarehousesSchema,
} from '#shared/contracts/warehouses.contract.js';
import { logger } from '../../utils/logger.js';
import { generateCsv } from '../../utils/csv.js';
import type { DbError } from '../../types/db.js';

export async function listWarehouses(req: Request, res: Response) {
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const results = await warehousesService.listWarehouses(organizationId);
    res.json(results);
  } catch (error) {
    logger.error({ error, organizationId, userId }, 'Failed to list warehouses');
    throw error;
  }
}

export async function getWarehouse(req: Request, res: Response) {
  const { id } = req.params;
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const warehouse = await warehousesService.getWarehouseById(organizationId, id as string);
    if (!warehouse) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }
    res.json(warehouse);
  } catch (error) {
    logger.error({ error, organizationId, userId, id }, 'Failed to get warehouse');
    throw error;
  }
}

export async function createWarehouse(req: Request, res: Response) {
  const parseResult = createWarehouseSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const newWarehouse = await warehousesService.createWarehouse(
      organizationId,
      userId,
      parseResult.data,
    );

    if (!newWarehouse) {
      return res.status(500).json({ error: 'Failed to retrieve created warehouse record' });
    }

    res.status(201).json(newWarehouse);
  } catch (error: unknown) {
    const dbError = error as DbError;
    logger.error({ error, organizationId, userId }, 'Failed to create warehouse');
    if (dbError.code === '23505' || dbError.cause?.code === '23505') {
      return res.status(409).json({ error: 'Warehouse or linked entity already exists' });
    }
    throw error;
  }
}

export async function updateWarehouse(req: Request, res: Response) {
  const { id } = req.params;
  const parseResult = updateWarehouseSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const updatedWarehouse = await warehousesService.updateWarehouse(
      organizationId,
      userId,
      id as string,
      parseResult.data,
    );

    if (!updatedWarehouse) {
      return res.status(404).json({ error: 'Warehouse not found or update failed' });
    }

    res.json(updatedWarehouse);
  } catch (error: unknown) {
    const dbError = error as DbError;
    logger.error({ error, organizationId, userId, id }, 'Failed to update warehouse');
    if (dbError.code === '23505' || dbError.cause?.code === '23505') {
      return res.status(409).json({ error: 'Warehouse or linked entity update conflict' });
    }
    throw error;
  }
}

export async function deleteWarehouse(req: Request, res: Response) {
  const { id } = req.params;
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const deletedWarehouse = await warehousesService.deleteWarehouse(
      organizationId,
      userId,
      id as string,
    );
    if (!deletedWarehouse) {
      return res.status(404).json({ error: 'Warehouse not found' });
    }
    res.json({ message: 'Warehouse deleted successfully' });
  } catch (error) {
    logger.error({ error, organizationId, userId, id }, 'Failed to delete warehouse');
    throw error;
  }
}

export async function bulkDeleteWarehouses(req: Request, res: Response) {
  const parseResult = bulkDeleteWarehousesSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const deletedWarehouses = await warehousesService.bulkDeleteWarehouses(
      organizationId,
      userId,
      parseResult.data.ids,
    );

    res.json({
      message: `Successfully deleted ${deletedWarehouses.length} warehouses`,
      deletedCount: deletedWarehouses.length,
      deletedIds: deletedWarehouses.map((w) => w.id),
    });
  } catch (error) {
    logger.error({ error, organizationId, userId }, 'Failed to bulk delete warehouses');
    throw error;
  }
}

export async function exportWarehouses(req: Request, res: Response) {
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const csvData = await warehousesService.exportWarehouses(organizationId);
    const csv = generateCsv(csvData);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=warehouses-export-${Date.now()}.csv`,
    );
    res.send(csv);
  } catch (error) {
    logger.error({ error, organizationId, userId }, 'Failed to export warehouses');
    throw error;
  }
}

export async function getImportTemplate(req: Request, res: Response) {
  try {
    const templateData = [
      {
        code: 'WH-001',
        name: 'Central Warehouse',
        addressLine1: '123 Logistics Way',
        city: 'Distribution City',
        country: 'USA',
      },
    ];
    const csv = generateCsv(templateData);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=warehouses-import-template.csv');
    res.send(csv);
  } catch (error) {
    logger.error({ error }, 'Failed to get import template');
    throw error;
  }
}

export async function importWarehouses(req: Request, res: Response) {
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const summary = await warehousesService.importWarehouses(organizationId, userId, file.buffer);
    res.json(summary);
  } catch (error: unknown) {
    logger.error({ error, organizationId, userId }, 'Failed to import warehouses');
    res.status(400).json({ error: (error as Error).message || 'Failed to parse CSV' });
  }
}
