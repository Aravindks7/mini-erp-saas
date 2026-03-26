import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

/**
 * Middleware to enforce role-based access control.
 * Must be used AFTER authMiddleware as it relies on req.userRole.
 *
 * @param allowedRoles Array of roles that are allowed to access the route.
 */
export function requireRole(allowedRoles: ('admin' | 'employee')[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.userRole;

    if (!userRole) {
      logger.error('requireRole middleware used without authMiddleware');
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (!allowedRoles.includes(userRole)) {
      logger.warn(
        {
          userId: req.authSession.user.id,
          organizationId: req.organizationId,
          userRole,
          allowedRoles,
        },
        'Access denied: insufficient permissions',
      );
      return res.status(403).json({ error: 'Forbidden: insufficient permissions' });
    }

    next();
  };
}
