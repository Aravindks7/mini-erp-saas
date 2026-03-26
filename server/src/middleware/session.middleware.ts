import { Request, Response, NextFunction } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../lib/auth.js';

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
  const sessionData = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!sessionData) {
    res.status(401).json({ error: 'Unauthorized — No valid session found' });
    return;
  }

  req.authSession = sessionData;
  next();
}
