import { Request, Response } from 'express';
import { customersService } from './customers.service.js';
import {
  createCustomerSchema,
  updateCustomerSchema,
} from '@shared/contracts/customers.contract.js';
import { logger } from '../../utils/logger.js';

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
  } catch (error: any) {
    logger.error({ error, organizationId, userId }, 'Failed to create customer');
    if (error.code === '23505' || (error as any).cause?.code === '23505') {
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
  } catch (error: any) {
    console.error('DEBUG updateCustomer Error:', error);
    logger.error({ error, organizationId, userId, id }, 'Failed to update customer');
    if (error.code === '23505' || (error as any).cause?.code === '23505') {
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
