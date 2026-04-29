import { Request, Response } from 'express';
import { invoicesService } from './invoices.service.js';
import {
  createInvoiceSchema,
  updateInvoiceStatusSchema,
} from '#shared/contracts/invoices.contract.js';
import { logger } from '../../utils/logger.js';

export async function listInvoices(req: Request, res: Response) {
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const results = await invoicesService.listInvoices(organizationId);
    res.json(results);
  } catch (error) {
    logger.error({ error, organizationId, userId }, 'Failed to list invoices');
    throw error;
  }
}

export async function getInvoice(req: Request, res: Response) {
  const { id } = req.params;
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const invoice = await invoicesService.getInvoiceById(organizationId, id as string);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.json(invoice);
  } catch (error) {
    logger.error({ error, organizationId, userId, id }, 'Failed to get invoice');
    throw error;
  }
}

export async function createInvoice(req: Request, res: Response) {
  const parseResult = createInvoiceSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const newInvoice = await invoicesService.createInvoice(
      organizationId,
      userId,
      parseResult.data,
    );
    res.status(201).json(newInvoice);
  } catch (error) {
    logger.error({ error, organizationId, userId }, 'Failed to create invoice');
    throw error;
  }
}

export async function createFromSalesOrder(req: Request, res: Response) {
  const { soId } = req.params;
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const newInvoice = await invoicesService.createFromSalesOrder(
      organizationId,
      userId,
      soId as string,
    );
    res.status(201).json(newInvoice);
  } catch (error) {
    logger.error({ error, organizationId, userId, soId }, 'Failed to create invoice from SO');
    throw error;
  }
}

export async function updateInvoiceStatus(req: Request, res: Response) {
  const { id } = req.params;
  const parseResult = updateInvoiceStatusSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const updated = await invoicesService.updateInvoiceStatus(
      organizationId,
      userId,
      id as string,
      parseResult.data,
    );
    if (!updated) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.json(updated);
  } catch (error) {
    logger.error({ error, organizationId, userId, id }, 'Failed to update invoice status');
    throw error;
  }
}
