import { db } from '../index.js';
import { organizations, user, account, organizationMemberships, roles } from '../schema/index.js';
import { SEED_DATA } from './constants.js';
import { hashPassword } from 'better-auth/crypto';
import { eq, and, sql, or } from 'drizzle-orm';

export async function seedAuth() {
  console.log('🌱 Seeding Auth (Organization & Super Admin)...');

  // 1. Seed Organization
  const existingOrg = await db.query.organizations.findFirst({
    where: eq(organizations.id, SEED_DATA.ORGANIZATION_ID),
  });

  if (!existingOrg) {
    await db.insert(organizations).values({
      id: SEED_DATA.ORGANIZATION_ID,
      name: 'Seed Test Organization',
      slug: 'seed-test-org',
      defaultCountry: 'US',
    });
    console.log('   - Organization created.');
  }

  // 2. Seed User
  const existingUser = await db.query.user.findFirst({
    where: or(eq(user.id, SEED_DATA.USER_ID), eq(user.email, 'admin@example.com')),
  });

  if (!existingUser) {
    await db.insert(user).values({
      id: SEED_DATA.USER_ID,
      name: 'Super Admin',
      email: 'admin@example.com',
      emailVerified: true,
    });

    // Use Better Auth's internal hashing utility for compatibility
    const hashedPassword = await hashPassword('password123');

    await db.insert(account).values({
      userId: SEED_DATA.USER_ID,
      accountId: 'admin@example.com',
      providerId: 'credential',
      password: hashedPassword,
    });
    console.log('   - Super Admin user and account created.');
  }

  const finalUserId = existingUser ? existingUser.id : SEED_DATA.USER_ID;

  // 3. Link User to Org with Admin Role
  const adminRole = await db.query.roles.findFirst({
    where: and(eq(roles.name, 'Admin'), sql`${roles.organizationId} IS NULL`),
  });

  if (!adminRole) {
    throw new Error('Admin role not found. Ensure seedRBAC runs before seedAuth.');
  }

  const existingMembership = await db.query.organizationMemberships.findFirst({
    where: and(
      eq(organizationMemberships.userId, finalUserId),
      eq(organizationMemberships.organizationId, SEED_DATA.ORGANIZATION_ID),
    ),
  });

  if (!existingMembership) {
    await db.insert(organizationMemberships).values({
      userId: finalUserId,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      roleId: adminRole.id,
    });
    console.log('   - Super Admin linked to Organization.');
  }
}
