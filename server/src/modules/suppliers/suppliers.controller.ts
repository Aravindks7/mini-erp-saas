import { Request, Response } from 'express';
import { suppliersService } from './suppliers.service.js';
import {
  createSupplierSchema,
  updateSupplierSchema,
  bulkDeleteSuppliersSchema,
} from '#shared/contracts/suppliers.contract.js';
import { logger } from '../../utils/logger.js';
import { generateCsv } from '../../utils/csv.js';
import type { DbError } from '../../types/db.js';

export async function listSuppliers(req: Request, res: Response) {
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const results = await suppliersService.listSuppliers(organizationId);
    res.json(results);
  } catch (error) {
    logger.error({ error, organizationId, userId }, 'Failed to list suppliers');
    throw error;
  }
}

export async function getSupplier(req: Request, res: Response) {
  const { id } = req.params;
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const supplier = await suppliersService.getSupplierById(organizationId, id as string);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    res.json(supplier);
  } catch (error) {
    logger.error({ error, organizationId, userId, id }, 'Failed to get supplier');
    throw error;
  }
}

export async function createSupplier(req: Request, res: Response) {
  const parseResult = createSupplierSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    // Check for duplicates
    const existing = await suppliersService.listSuppliers(organizationId);
    if (existing.some((s) => s.name === parseResult.data.name)) {
      return res
        .status(409)
        .json({ error: `Supplier with name '${parseResult.data.name}' already exists` });
    }

    const newSupplier = await suppliersService.createSupplier(
      organizationId,
      userId,
      parseResult.data,
    );

    if (!newSupplier) {
      logger.error(
        { organizationId, userId, data: parseResult.data },
        'Service failed to return new supplier after creation',
      );
      return res.status(500).json({ error: 'Failed to retrieve created supplier record' });
    }

    res.status(201).json(newSupplier);
  } catch (error: unknown) {
    const dbError = error as DbError;
    logger.error({ error, organizationId, userId }, 'Failed to create supplier');
    if (dbError.code === '23505' || dbError.cause?.code === '23505') {
      return res.status(409).json({ error: 'Supplier or linked entity already exists' });
    }
    throw error;
  }
}

export async function updateSupplier(req: Request, res: Response) {
  const { id } = req.params;
  const parseResult = updateSupplierSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const updatedSupplier = await suppliersService.updateSupplier(
      organizationId,
      userId,
      id as string,
      parseResult.data,
    );

    if (!updatedSupplier) {
      return res.status(404).json({ error: 'Supplier not found or update failed' });
    }

    res.json(updatedSupplier);
  } catch (error: unknown) {
    const dbError = error as DbError;
    logger.error({ error, organizationId, userId, id }, 'Failed to update supplier');
    if (dbError.code === '23505' || dbError.cause?.code === '23505') {
      return res.status(409).json({ error: 'Supplier or linked entity update conflict' });
    }
    throw error;
  }
}

export async function deleteSupplier(req: Request, res: Response) {
  const { id } = req.params;
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const deletedSupplier = await suppliersService.deleteSupplier(
      organizationId,
      userId,
      id as string,
    );
    if (!deletedSupplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    logger.error({ error, organizationId, userId, id }, 'Failed to delete supplier');
    throw error;
  }
}

export async function bulkDeleteSuppliers(req: Request, res: Response) {
  const parseResult = bulkDeleteSuppliersSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const deletedSuppliers = await suppliersService.bulkDeleteSuppliers(
      organizationId,
      userId,
      parseResult.data.ids,
    );

    res.json({
      message: `Successfully deleted ${deletedSuppliers.length} suppliers`,
      deletedCount: deletedSuppliers.length,
      deletedIds: deletedSuppliers.map((s) => s.id),
    });
  } catch (error) {
    logger.error({ error, organizationId, userId }, 'Failed to bulk delete suppliers');
    throw error;
  }
}

export async function exportSuppliers(req: Request, res: Response) {
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const csvData = await suppliersService.exportSuppliers(organizationId);
    const csv = generateCsv(csvData);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=suppliers-export-${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    logger.error({ error, organizationId, userId }, 'Failed to export suppliers');
    throw error;
  }
}

export async function getImportTemplate(req: Request, res: Response) {
  try {
    const templateData = [
      {
        name: 'Acme Supplier',
        taxNumber: '123456789',
        status: 'active',
        contactFirstName: 'John',
        contactLastName: 'Doe',
        contactEmail: 'john@acme.com',
        addressLine1: '123 Main St',
        city: 'Metropolis',
        country: 'USA',
      },
    ];
    const csv = generateCsv(templateData);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=suppliers-import-template.csv');
    res.send(csv);
  } catch (error) {
    logger.error({ error }, 'Failed to get import template');
    throw error;
  }
}

export async function importSuppliers(req: Request, res: Response) {
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const summary = await suppliersService.importSuppliers(organizationId, userId, file.buffer);
    res.json(summary);
  } catch (error: unknown) {
    logger.error({ error, organizationId, userId }, 'Failed to import suppliers');
    res.status(400).json({ error: (error as Error).message || 'Failed to parse CSV' });
  }
}
