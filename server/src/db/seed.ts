import { db } from './index.js';
import {
  permissions,
  permissionSets,
  permissionSetItems,
  roles,
  rolePermissionSets,
} from './schema/index.js';
import { PERMISSIONS } from '#shared/index.js';
import { and, eq, sql } from 'drizzle-orm';

/**
 * Idempotent seed function for the Dynamic RBAC system.
 * Designed to be run automatically during migrations or on system startup.
 */
export async function seedRBAC() {
  console.log('🌱 Ensuring RBAC system defaults...');

  try {
    // 1. Seed Granular Permissions from TypeScript Constants
    const allPermissions = Object.values(PERMISSIONS).flatMap((group) => Object.values(group));

    for (const p of allPermissions) {
      await db
        .insert(permissions)
        .values({ id: p, description: `Permission for ${p}` })
        .onConflictDoNothing();
    }

    // 2. Create "Full Access" Permission Set (Global)
    let fullAccessSet = await db.query.permissionSets.findFirst({
      where: and(
        eq(permissionSets.name, 'Full Access'),
        sql`${permissionSets.organizationId} IS NULL`,
      ),
    });

    if (!fullAccessSet) {
      const [newSet] = await db
        .insert(permissionSets)
        .values({
          name: 'Full Access',
          organizationId: null,
        })
        .returning();
      fullAccessSet = newSet;
    }

    // Link all permissions to the "Full Access" set
    for (const p of allPermissions) {
      await db
        .insert(permissionSetItems)
        .values({
          permissionSetId: fullAccessSet!.id,
          permissionId: p,
        })
        .onConflictDoNothing();
    }

    // 3. Create Base Roles (Admin, Employee)

    // ADMIN
    let adminRole = await db.query.roles.findFirst({
      where: and(eq(roles.name, 'Admin'), sql`${roles.organizationId} IS NULL`),
    });

    if (!adminRole) {
      const [newRole] = await db
        .insert(roles)
        .values({
          name: 'Admin',
          isBaseRole: true,
          organizationId: null,
        })
        .returning();
      adminRole = newRole;
    }

    if (adminRole) {
      // Link Admin role to Full Access set
      await db
        .insert(rolePermissionSets)
        .values({
          roleId: adminRole.id,
          permissionSetId: fullAccessSet!.id,
        })
        .onConflictDoNothing();
    }

    // EMPLOYEE
    const employeeRole = await db.query.roles.findFirst({
      where: and(eq(roles.name, 'Employee'), sql`${roles.organizationId} IS NULL`),
    });

    if (!employeeRole) {
      await db
        .insert(roles)
        .values({
          name: 'Employee',
          isBaseRole: true,
          organizationId: null,
        })
        .returning();
    }

    console.log('✅ RBAC System defaults verified.');
  } catch (err) {
    console.error('❌ RBAC Seeding failed:', err);
    throw err;
  }
}
