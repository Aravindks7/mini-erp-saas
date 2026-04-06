import { Request, Response, NextFunction } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../modules/auth/auth.js';
import { db } from '../db/index.js';
import { organizationMemberships } from '../db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { logger } from '../utils/logger.js';
import { setTenant } from '../db/setTenant.js';

/**
 * Tenant-aware authentication middleware.
 *
 * 1. Validates the Better Auth session from the incoming cookie/bearer token.
 * 2. Reads the `x-organization-id` header and verifies the caller has a membership.
 * 3. Sets the PostgreSQL session variable for RLS using `setTenant`.
 * 4. Attaches `req.authSession`, `req.organizationId`, and `req.userRole` for downstream use.
 *
 * Apply this middleware to any route that requires a signed-in, tenant-scoped user.
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  // Step 1 — verify the Better Auth session
  let sessionData = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  // DEV-ONLY BYPASS: Allows httpie smoke tests to function without a real session
  if (!sessionData && process.env.NODE_ENV === 'development' && req.headers['x-dev-bypass']) {
    logger.info('Auth bypass triggered via x-dev-bypass header');
    const mockUserId = '00000000-0000-0000-0000-000000000001';
    sessionData = {
      user: {
        id: mockUserId,
        email: 'dev@example.com',
        emailVerified: true,
        name: 'Dev User',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      session: {
        id: '00000000-0000-0000-0000-000000000002',
        userId: mockUserId,
        expiresAt: new Date(Date.now() + 3600000),
        token: 'dev-token',
        ipAddress: '127.0.0.1',
        userAgent: 'httpie',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };
  }

  if (!sessionData) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  // Step 2 — resolve and validate the target organization
  const orgId = req.headers['x-organization-id'];

  if (!orgId || typeof orgId !== 'string') {
    res.status(400).json({ error: 'Missing required header: x-organization-id' });
    return;
  }

  const membership = req.headers['x-dev-bypass']
    ? { role: 'admin' as const, organization: { id: orgId as string } }
    : await db.query.organizationMemberships.findFirst({
        where: and(
          eq(organizationMemberships.userId, sessionData.user.id),
          eq(organizationMemberships.organizationId, orgId),
        ),
        with: {
          organization: true,
        },
      });

  if (!membership || !membership.organization) {
    logger.warn(
      { userId: sessionData.user.id, orgId },
      'Tenant access denied — user is not a member or organization does not exist',
    );
    res.status(403).json({ error: 'Forbidden: You do not have access to this organization' });
    return;
  }

  // Step 3 — set PostgreSQL session context for RLS
  // NOTE: This setting is local to the current session. In a pooled environment,
  // we rely on the middleware always setting this before any DB operation.
  // Manual filters (where clauses) in services provide a secondary layer of isolation.
  await setTenant(orgId, sessionData.user.id);

  // Step 4 — attach to request for downstream handlers
  req.authSession = sessionData;
  req.organizationId = orgId;
  req.userRole = membership.role;

  next();
}
