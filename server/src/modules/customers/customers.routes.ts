import { Router, Request } from 'express';
import { eq } from 'drizzle-orm';
import { authMiddleware } from '../../middleware/auth.middleware';
import { db } from '../../db';
import { customers } from '../../db/schema';

interface AuthRequest extends Request {
  user?: { organizationId: string; userId: string; role: string };
}

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const result = await db
    .select()
    .from(customers)
    .where(eq(customers.organizationId, req.user.organizationId));

  res.json(result);
});

export default router;
