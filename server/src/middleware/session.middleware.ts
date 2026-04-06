import { Request, Response, NextFunction } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../modules/auth/auth.js';

/**
 * Session Middleware
 *
 * Verifies that the user is signed in with a valid Better Auth session.
 * Does NOT check for organization membership.
 *
 * Use this for:
 * - Creating a new organization
 * - Listing the user's organizations
 * - Managing the user's own profile
 */
export async function sessionMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  let sessionData = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  // DEV-ONLY BYPASS: Allows httpie smoke tests to function without a real session
  if (!sessionData && process.env.NODE_ENV === 'development' && req.headers['x-dev-bypass']) {
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
    res.status(401).json({ error: 'Unauthorized — No valid session found' });
    return;
  }

  req.authSession = sessionData;
  next();
}
