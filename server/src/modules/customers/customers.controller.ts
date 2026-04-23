import { Request, Response } from 'express';
import { customersService } from './customers.service.js';
import {
  createCustomerSchema,
  updateCustomerSchema,
  bulkDeleteCustomersSchema,
} from '#shared/contracts/customers.contract.js';
import { logger } from '../../utils/logger.js';
import { generateCsv } from '../../utils/csv.js';
import type { DbError } from '../../types/db.js';

export async function listCustomers(req: Request, res: Response) {
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const results = await customersService.listCustomers(organizationId);
    res.json(results);
  } catch (error) {
    logger.error({ error, organizationId, userId }, 'Failed to list customers');
    throw error;
  }
}

export async function getCustomer(req: Request, res: Response) {
  const { id } = req.params;
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const customer = await customersService.getCustomerById(organizationId, id as string);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    logger.error({ error, organizationId, userId, id }, 'Failed to get customer');
    throw error;
  }
}

export async function createCustomer(req: Request, res: Response) {
  const parseResult = createCustomerSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    // Check for duplicates
    const existing = await customersService.listCustomers(organizationId);
    if (existing.some((c) => c.companyName === parseResult.data.companyName)) {
      return res
        .status(409)
        .json({ error: `Customer with name '${parseResult.data.companyName}' already exists` });
    }

    const newCustomer = await customersService.createCustomer(
      organizationId,
      userId,
      parseResult.data,
    );

    if (!newCustomer) {
      logger.error(
        { organizationId, userId, data: parseResult.data },
        'Service failed to return new customer after creation',
      );
      return res.status(500).json({ error: 'Failed to retrieve created customer record' });
    }

    res.status(201).json(newCustomer);
  } catch (error: unknown) {
    const dbError = error as DbError;
    logger.error({ error, organizationId, userId }, 'Failed to create customer');
    if (dbError.code === '23505' || dbError.cause?.code === '23505') {
      return res.status(409).json({ error: 'Customer or linked entity already exists' });
    }
    throw error;
  }
}

export async function updateCustomer(req: Request, res: Response) {
  const { id } = req.params;
  const parseResult = updateCustomerSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const updatedCustomer = await customersService.updateCustomer(
      organizationId,
      userId,
      id as string,
      parseResult.data,
    );

    if (!updatedCustomer) {
      // 404 is technically handled by Service returning null if record not found,
      // but double check here for clinical precision.
      return res.status(404).json({ error: 'Customer not found or update failed' });
    }

    res.json(updatedCustomer);
  } catch (error: unknown) {
    const dbError = error as DbError;
    console.error('DEBUG updateCustomer Error:', error);
    logger.error({ error, organizationId, userId, id }, 'Failed to update customer');
    if (dbError.code === '23505' || dbError.cause?.code === '23505') {
      return res.status(409).json({ error: 'Customer or linked entity update conflict' });
    }
    throw error;
  }
}

export async function deleteCustomer(req: Request, res: Response) {
  const { id } = req.params;
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const deletedCustomer = await customersService.deleteCustomer(
      organizationId,
      userId,
      id as string,
    );
    if (!deletedCustomer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    logger.error({ error, organizationId, userId, id }, 'Failed to delete customer');
    throw error;
  }
}

export async function bulkDeleteCustomers(req: Request, res: Response) {
  const parseResult = bulkDeleteCustomersSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const deletedCustomers = await customersService.bulkDeleteCustomers(
      organizationId,
      userId,
      parseResult.data.ids,
    );

    res.json({
      message: `Successfully deleted ${deletedCustomers.length} customers`,
      deletedCount: deletedCustomers.length,
      deletedIds: deletedCustomers.map((c) => c.id),
    });
  } catch (error) {
    logger.error({ error, organizationId, userId }, 'Failed to bulk delete customers');
    throw error;
  }
}

export async function exportCustomers(req: Request, res: Response) {
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const csvData = await customersService.exportCustomers(organizationId);
    const csv = generateCsv(csvData);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=customers-export-${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    logger.error({ error, organizationId, userId }, 'Failed to export customers');
    throw error;
  }
}

export async function getImportTemplate(req: Request, res: Response) {
  try {
    const templateData = [
      {
        companyName: 'Acme Corp',
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
    res.setHeader('Content-Disposition', 'attachment; filename=customers-import-template.csv');
    res.send(csv);
  } catch (error) {
    logger.error({ error }, 'Failed to get import template');
    throw error;
  }
}

export async function importCustomers(req: Request, res: Response) {
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const summary = await customersService.importCustomers(organizationId, userId, file.buffer);
    res.json(summary);
  } catch (error: unknown) {
    logger.error({ error, organizationId, userId }, 'Failed to import customers');
    res.status(400).json({ error: (error as Error).message || 'Failed to parse CSV' });
  }
}
