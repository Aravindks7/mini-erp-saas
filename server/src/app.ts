import 'dotenv/config';
import express from 'express';
import { toNodeHandler } from 'better-auth/node';
import { httpLogger } from './utils/httpLogger';
import { errorMiddleware } from './middleware/error.middleware';
import { auth } from './lib/auth';

import customersRoutes from './modules/customers/customers.routes';
import organizationsRoutes from './modules/organizations/organizations.routes';

const app = express();

/**
 * IMPORTANT: The Better Auth handler MUST be mounted BEFORE express.json().
 * It reads the raw request body internally; parsing it first would break it.
 *
 * All auth routes are available at /api/auth/*
 * e.g. POST /api/auth/sign-up/email, POST /api/auth/sign-in/email
 */
app.use((req, res, next) => {
  if (req.url.startsWith('/api/auth')) {
    return toNodeHandler(auth.handler)(req, res);
  }
  next();
});

// Standard middleware (applied after the Better Auth catch-all)
app.use(express.json());
app.use(httpLogger);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (_req, res) => {
  res.send('Welcome to the API');
});

// Business routes
app.use('/customers', customersRoutes);
app.use('/organizations', organizationsRoutes);

// Global error handler — must be last
app.use(errorMiddleware);

export { app };
