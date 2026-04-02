import { pgEnum } from 'drizzle-orm/pg-core';

/**
 * RBAC Role Taxonomy
 */
export const memberRoleEnum = pgEnum('member_role', ['admin', 'employee']);

/**
 * Invitation Lifecycle States
 */
export const inviteStatusEnum = pgEnum('invite_status', ['pending', 'accepted', 'revoked']);
