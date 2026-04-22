import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import { httpLogger } from './utils/httpLogger.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { auth } from './modules/auth/auth.js';

import customersRoutes from './modules/customers/customers.routes.js';
import organizationsRoutes from './modules/organizations/organizations.routes.js';
import rbacRoutes from './modules/rbac/rbac.routes.js';

const app = express();

app.set('trust proxy', true);

app.use(
  cors({
    origin: ['http://localhost:5173', ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : [])],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-organization-id'],
  }),
);

/**
 * IMPORTANT: The Better Auth handler MUST be mounted BEFORE express.json().
 * It reads the raw request body internally; parsing it first would break it.
 */
app.use((req, res, next) => {
  if (req.url.startsWith('/api/auth')) {
    return toNodeHandler(auth)(req, res);
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
app.use('/rbac', rbacRoutes);

// Global error handler — must be last
app.use(errorMiddleware);

export { app };
