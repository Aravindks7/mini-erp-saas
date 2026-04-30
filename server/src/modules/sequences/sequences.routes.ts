import { Router } from 'express';
import { listSequences, updateSequence } from './sequences.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', listSequences);
router.patch('/:id', updateSequence);

export default router;
