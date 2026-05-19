import { db } from '../index.js';
import { organizations, user, account, organizationMemberships, roles } from '../schema/index.js';
import { SEED_DATA } from './constants.js';
import { hashPassword } from 'better-auth/crypto';
import { eq, and, sql, or } from 'drizzle-orm';

export async function seedAuth() {
  console.log('🌱 Seeding Auth (Organization & Multi-Role Users)...');

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

  // 2. Define specialized users for a rich developer experience
  const specializedUsers = [
    {
      id: SEED_DATA.USERS.SUPER_ADMIN,
      name: 'Super Admin',
      email: 'admin@example.com',
      roleName: 'Admin',
    },
    {
      id: SEED_DATA.USERS.SALES_MANAGER,
      name: 'Sales Manager',
      email: 'sales.mgr@example.com',
      roleName: 'Sales Manager',
    },
    {
      id: SEED_DATA.USERS.PURCHASE_MANAGER,
      name: 'Purchase Lead',
      email: 'purchase.mgr@example.com',
      roleName: 'Purchase Manager',
    },
    {
      id: SEED_DATA.USERS.INVENTORY_MANAGER,
      name: 'Logistics Head',
      email: 'inventory.mgr@example.com',
      roleName: 'Inventory Manager',
    },
    {
      id: SEED_DATA.USERS.ACCOUNTANT,
      name: 'Corporate Accountant',
      email: 'accountant@example.com',
      roleName: 'Accountant',
    },
    {
      id: SEED_DATA.USERS.STAFF,
      name: 'Operations Staff',
      email: 'staff@example.com',
      roleName: 'Employee',
    },
  ];

  const hashedPassword = await hashPassword('password123');

  for (const userData of specializedUsers) {
    const existingUser = await db.query.user.findFirst({
      where: or(eq(user.id, userData.id), eq(user.email, userData.email)),
    });

    let userId = userData.id;

    if (!existingUser) {
      await db.insert(user).values({
        id: userData.id,
        name: userData.name,
        email: userData.email,
        emailVerified: true,
      });

      await db.insert(account).values({
        userId: userData.id,
        accountId: userData.email,
        providerId: 'credential',
        password: hashedPassword,
      });
      console.log(`   - User created: ${userData.name} (${userData.email})`);
    } else {
      userId = existingUser.id;
    }

    // 3. Link User to Org with specific Role
    const targetRole = await db.query.roles.findFirst({
      where: and(eq(roles.name, userData.roleName), sql`${roles.organizationId} IS NULL`),
    });

    if (!targetRole) {
      console.warn(
        `   ⚠️ Role "${userData.roleName}" not found for user ${userData.email}. Skipping link.`,
      );
      continue;
    }

    const existingMembership = await db.query.organizationMemberships.findFirst({
      where: and(
        eq(organizationMemberships.userId, userId),
        eq(organizationMemberships.organizationId, SEED_DATA.ORGANIZATION_ID),
      ),
    });

    if (!existingMembership) {
      await db.insert(organizationMemberships).values({
        userId: userId,
        organizationId: SEED_DATA.ORGANIZATION_ID,
        roleId: targetRole.id,
      });
      console.log(`   - Linked ${userData.name} to Organization as ${userData.roleName}.`);
    }
  }
}
