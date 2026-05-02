import { Request, Response } from 'express';
import { paymentsService } from './payments.service.js';
import { createPaymentSchema } from '#shared/contracts/payments.contract.js';
import { logger } from '../../utils/logger.js';
import { db } from '../../db/index.js';
import { and, eq, desc } from 'drizzle-orm';
import { paymentIntents } from '../../db/schema/index.js';

export async function listPayments(req: Request, res: Response) {
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const results = await paymentsService.listPayments(organizationId);
    res.json(results);
  } catch (error) {
    logger.error({ error, organizationId, userId }, 'Failed to list payments');
    throw error;
  }
}

export async function getPayment(req: Request, res: Response) {
  const { id } = req.params;
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const payment = await paymentsService.getPaymentById(organizationId, id as string);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.json(payment);
  } catch (error) {
    logger.error({ error, organizationId, userId, id }, 'Failed to get payment');
    throw error;
  }
}

export async function createPayment(req: Request, res: Response) {
  const parseResult = createPaymentSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const newPayment = await paymentsService.createPayment(
      organizationId,
      userId,
      parseResult.data,
    );

    res.status(201).json(newPayment);
  } catch (error) {
    logger.error({ error, organizationId, userId, data: req.body }, 'Failed to create payment');
    throw error;
  }
}

export async function deletePayment(req: Request, res: Response) {
  const { id } = req.params;
  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    await paymentsService.deletePayment(organizationId, userId, id as string);
    res.status(204).end();
  } catch (error) {
    logger.error({ error, organizationId, userId, id }, 'Failed to delete payment');
    throw error;
  }
}

export async function bulkDeletePayments(req: Request, res: Response) {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'IDs array is required' });
  }

  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    await paymentsService.bulkDeletePayments(organizationId, userId, ids);
    res.status(204).end();
  } catch (error) {
    logger.error({ error, organizationId, userId, ids }, 'Failed to bulk delete payments');
    throw error;
  }
}

export async function createStripeSession(req: Request, res: Response) {
  const { invoiceId, amount, successUrl, cancelUrl } = req.body;

  if (!invoiceId || !amount || !successUrl || !cancelUrl) {
    return res.status(400).json({
      error: 'invoiceId, amount, successUrl, and cancelUrl are required',
    });
  }

  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const session = await paymentsService.createStripeSession(
      organizationId,
      userId,
      invoiceId,
      amount,
      successUrl,
      cancelUrl,
    );
    res.json(session);
  } catch (error) {
    logger.error({ error, organizationId, userId, invoiceId }, 'Failed to create Stripe session');
    res.status(500).json({ error: (error as Error).message });
  }
}

export async function listPaymentIntents(req: Request, res: Response) {
  const { invoiceId, billId } = req.query;
  const organizationId = req.organizationId;

  try {
    const results = await db.query.paymentIntents.findMany({
      where: and(
        eq(paymentIntents.organizationId, organizationId),
        invoiceId ? eq(paymentIntents.invoiceId, invoiceId as string) : undefined,
        billId ? eq(paymentIntents.billId, billId as string) : undefined,
      ),
      orderBy: [desc(paymentIntents.createdAt)],
    });
    res.json(results);
  } catch (error) {
    logger.error({ error, organizationId }, 'Failed to list payment intents');
    throw error;
  }
}
