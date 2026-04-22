import { Session, User } from '../db/schema/auth.schema.js';
import { PermissionResolver } from '../middleware/rbac.middleware.js';

declare global {
  namespace Express {
    interface Request {
      /**
       * Populated by authMiddleware.
       */
      authSession: {
        user: User;
        session: Session;
      };

      /**
       * Current organization ID from header.
       */
      organizationId: string;

      /**
       * Active permission resolver for the current user/tenant scope.
       */
      permissions: PermissionResolver;
    }
  }
}

export {};
