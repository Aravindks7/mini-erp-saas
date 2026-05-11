import express, { Router } from 'express';
import * as paymentsController from './payments.controller.js';
import * as webhooksController from './webhooks.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { PERMISSIONS } from '#shared/index.js';

const router = Router();

/**
 * Stripe Webhook
 * Bypass authMiddleware; security is handled via signature verification.
 */
router.post(
  '/webhook/stripe',
  express.raw({ type: 'application/json' }),
  webhooksController.handleStripeWebhook,
);

router.use(authMiddleware);

router.get('/', requirePermission(PERMISSIONS.PAYMENTS.READ), paymentsController.listPayments);

router.get(
  '/intents',
  requirePermission(PERMISSIONS.PAYMENTS.READ),
  paymentsController.listPaymentIntents,
);

router.get('/:id', requirePermission(PERMISSIONS.PAYMENTS.READ), paymentsController.getPayment);

router.post('/', requirePermission(PERMISSIONS.PAYMENTS.CREATE), paymentsController.createPayment);

router.post(
  '/create-stripe-session',
  requirePermission(PERMISSIONS.PAYMENTS.CREATE),
  paymentsController.createStripeSession,
);

router.delete(
  '/',
  requirePermission(PERMISSIONS.PAYMENTS.DELETE),
  paymentsController.bulkDeletePayments,
);

router.delete(
  '/:id',
  requirePermission(PERMISSIONS.PAYMENTS.DELETE),
  paymentsController.deletePayment,
);

router.patch(
  '/:id',
  requirePermission(PERMISSIONS.PAYMENTS.UPDATE),
  paymentsController.updatePayment,
);

export default router;
