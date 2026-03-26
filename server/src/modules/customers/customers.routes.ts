import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import * as customersController from './customers.controller.js';

import { requireRole } from '../../middleware/role.middleware.js';

const router = Router();

// All customers routes require a valid session + a matched org membership.
router.use(authMiddleware);

router.get('/', customersController.listCustomers);
router.get('/:id', customersController.getCustomer);
router.post('/', customersController.createCustomer);
router.patch('/:id', customersController.updateCustomer);
router.delete('/:id', requireRole(['admin']), customersController.deleteCustomer);

export default router;
