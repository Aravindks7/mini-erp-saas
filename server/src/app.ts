import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import { httpLogger } from './utils/httpLogger.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { auth } from './modules/auth/auth.js';

import customersRoutes from './modules/customers/customers.routes.js';
import suppliersRoutes from './modules/suppliers/suppliers.routes.js';
import organizationsRoutes from './modules/organizations/organizations.routes.js';
import rbacRoutes from './modules/rbac/rbac.routes.js';
import uomRoutes from './modules/uom/uom.routes.js';
import taxesRoutes from './modules/taxes/taxes.routes.js';
import productsRoutes from './modules/products/products.routes.js';
import warehousesRoutes from './modules/warehouses/warehouses.routes.js';
import inventoryRoutes from './modules/inventory/inventory.routes.js';
import purchaseOrdersRoutes from './modules/purchase-orders/purchase-orders.routes.js';
import salesOrdersRoutes from './modules/sales-orders/sales-orders.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';

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
app.use('/suppliers', suppliersRoutes);
app.use('/organizations', organizationsRoutes);
app.use('/rbac', rbacRoutes);
app.use('/uom', uomRoutes);
app.use('/taxes', taxesRoutes);
app.use('/products', productsRoutes);
app.use('/warehouses', warehousesRoutes);
app.use('/inventory', inventoryRoutes);
app.use('/purchase-orders', purchaseOrdersRoutes);
app.use('/sales-orders', salesOrdersRoutes);
app.use('/dashboard', dashboardRoutes);

// Global error handler — must be last
app.use(errorMiddleware);

export { app };
