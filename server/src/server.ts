import 'dotenv/config';
import express from 'express';
import { logger } from './utils/logger';
import { httpLogger } from './utils/httpLogger';
import { errorMiddleware } from './middleware/error.middleware';

import authRoutes from './modules/auth/auth.routes';
import customersRoutes from './modules/customers/customers.routes';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(httpLogger);
app.use(errorMiddleware);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRoutes);
app.use('/customers', customersRoutes);

app.listen(port, () => {
  logger.info(`Server running at http://localhost:${port}`);
});
