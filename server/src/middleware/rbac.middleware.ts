import { Request, Response, NextFunction } from 'express';
import type { Permission } from '#shared/index.js';
import { logger } from '../utils/logger.js';

/**
 * Middleware to enforce permission-based access control.
 * Must be used AFTER authMiddleware as it relies on req.permissions.
 */
export function requirePermission(requiredPermission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.permissions) {
      logger.error('requirePermission middleware used without authMiddleware');
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (!req.permissions.can(requiredPermission)) {
      logger.warn(
        {
          userId: req.authSession.user.id,
          organizationId: req.organizationId,
          requiredPermission,
        },
        'Access denied: missing required permission',
      );
      return res.status(403).json({ error: 'Forbidden: missing required permission' });
    }

    next();
  };
}

/**
 * Permission Resolver class attached to req.permissions
 */
export class PermissionResolver {
  constructor(private permissions: Permission[]) {}

  can(permission: Permission): boolean {
    return this.permissions.includes(permission);
  }

  all(): Permission[] {
    return this.permissions;
  }
}
