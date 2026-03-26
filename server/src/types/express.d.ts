import 'express';

declare global {
  namespace Express {
    interface Request {
      /**
       * The verified Better Auth session object.
       * Populated by authMiddleware — guaranteed non-null on protected routes.
       */
      authSession: {
        session: {
          id: string;
          userId: string;
          expiresAt: Date;
          token: string;
          ipAddress?: string | null | undefined;
          userAgent?: string | null | undefined;
          createdAt: Date;
          updatedAt: Date;
        };
        user: {
          id: string;
          name: string;
          email: string;
          emailVerified: boolean;
          image?: string | null | undefined;
          createdAt: Date;
          updatedAt: Date;
        };
      };
      /** The validated organization UUID extracted from x-organization-id header. */
      organizationId: string;
      /** The caller's role within the active organization. */
      userRole: 'admin' | 'employee';
    }
  }
}

export {};
