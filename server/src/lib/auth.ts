import { betterAuth } from 'better-auth';
import { dash } from '@better-auth/infra';
import { organization } from 'better-auth/plugins';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '../db/index.js';
import * as schema from '../db/schema/index.js';

import { organizationsService } from '../modules/organizations/organizations.service.js';

/**
 * Central Better Auth instance.
 *
 * - Uses the Drizzle adapter so all auth tables are managed by Drizzle Kit migrations.
 * - emailAndPassword plugin provides sign-up / sign-in / sign-out + password hashing.
 * - trustedOrigins must list every frontend origin that sends credentials.
 */
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      // Explicitly map Better Auth's internal model names → our Drizzle table objects.
      // This is required when defining the tables manually (not via `generate`).
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await organizationsService.processPendingInvites(user.email, user.id);
        },
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true, // sign in immediately after sign-up
    minPasswordLength: 8,
  },
  trustedOrigins: [
    'http://localhost:5173', // Vite dev server
    ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
  ],
  advanced: {
    database: {
      generateId: false,
    },
    /**
     * Required for Render/Proxies to correctly detect HTTPS and Client IP.
     * Prevents "500 Internal Server Error" during cookie/session operations.
     */
    trustProxy: true,
    /**
     * Explicitly set cookie options for production (different subdomains on onrender.com).
     * Browsers require SameSite=None and Secure for cross-site cookies.
     */
    cookieOptions: {
      server: {
        sameSite: 'none',
        secure: true,
      },
    },
  },
  plugins: [dash(), organization()],
});

// Export the inferred type for use in middleware
export type Auth = typeof auth;
