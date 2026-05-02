import { Request, Response } from 'express';
import { stripe } from '../../lib/stripe.js';
import { logger } from '../../utils/logger.js';
import { paymentsService } from './payments.service.js';

/**
 * Stripe Webhook Controller
 * Axiom: Signature verification is mandatory for clinical security.
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (!sig || !endpointSecret) {
      throw new Error('Missing stripe-signature or webhook secret');
    }

    // Stripe requires the raw body for signature verification
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error({ error: message }, 'Stripe Webhook Signature Verification Failed');
    return res.status(400).send(`Webhook Error: ${message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      logger.info({ sessionId: session.id }, 'Stripe Checkout Session Completed');

      try {
        await paymentsService.fulfillPaymentIntent(session.id);
      } catch (error) {
        logger.error(
          { error, sessionId: session.id },
          'Failed to fulfill payment intent from webhook',
        );
        return res.status(500).json({ error: 'Internal fulfillment error' });
      }
      break;
    }
    default:
      logger.debug({ eventType: event.type }, 'Unhandled Stripe Webhook Event');
  }

  res.json({ received: true });
}
