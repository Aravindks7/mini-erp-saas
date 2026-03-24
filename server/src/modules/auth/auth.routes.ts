import { Router } from 'express';
import { register, login } from '../auth/auth.controller';
import { validate } from '../../middleware/validate.middleware';
import { loginSchema, registerSchema } from './auth.schema';

const router = Router();

router.post('/register', validate(registerSchema), register);

router.post('/login', validate(loginSchema), login);

export default router;
