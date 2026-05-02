import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  // We don't throw here to avoid breaking the app if Stripe is not used,
  // but we should warn in production.
  if (process.env.NODE_ENV === 'production') {
    console.warn('STRIPE_SECRET_KEY is missing in production environment');
  }
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2025-01-27',
  typescript: true,
});
