import { db } from './index.js';
import {
  permissions,
  permissionSets,
  permissionSetItems,
  roles,
  rolePermissionSets,
} from './schema/index.js';
import { PERMISSIONS } from '#shared/index.js';
import { and, eq, sql, notInArray } from 'drizzle-orm';

/**
 * Idempotent seed function for the Dynamic RBAC system.
 * Designed to be run automatically during migrations or on system startup.
 */
export async function seedRBAC() {
  console.log('🌱 Ensuring RBAC system defaults...');

  try {
    // 1. Seed Granular Permissions from TypeScript Constants
    const allPermissions = Object.values(PERMISSIONS).flatMap((group) => Object.values(group));

    // Upsert all defined permissions
    for (const p of allPermissions) {
      await db
        .insert(permissions)
        .values({ id: p, description: `Permission for ${p}` })
        .onConflictDoNothing();
    }

    // Optional: Clean up orphaned permissions that are no longer in our PERMISSIONS constant
    if (allPermissions.length > 0) {
      await db
        .delete(permissions)
        .where(notInArray(permissions.id, allPermissions as [string, ...string[]]));
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

    // 3. Create "Employee Access" Permission Set (Global)
    // Sane defaults for a standard employee: Read everything, but no manage/delete/create on core org/RBAC
    const employeePermissions: string[] = [
      PERMISSIONS.CUSTOMERS.READ,
      PERMISSIONS.PRODUCTS.READ,
      PERMISSIONS.INVENTORY.READ,
      PERMISSIONS.INVENTORY.ADJUST,
      PERMISSIONS.INVENTORY.RECEIVE,
      PERMISSIONS.SUPPLIERS.READ,
      PERMISSIONS.TAXES.READ,
      PERMISSIONS.UOM.READ,
      PERMISSIONS.WAREHOUSES.READ,
      PERMISSIONS.DASHBOARD.READ,
      PERMISSIONS.SALES_ORDERS.READ,
      PERMISSIONS.SALES_ORDERS.CREATE,
      PERMISSIONS.SALES_ORDERS.UPDATE,
      PERMISSIONS.PURCHASE_ORDERS.READ,
      PERMISSIONS.PURCHASE_ORDERS.CREATE,
      PERMISSIONS.PURCHASE_ORDERS.UPDATE,
      PERMISSIONS.RECEIPTS.READ,
      PERMISSIONS.RECEIPTS.CREATE,
      PERMISSIONS.SHIPMENTS.READ,
      PERMISSIONS.SHIPMENTS.CREATE,
      PERMISSIONS.INVOICES.READ,
      PERMISSIONS.INVOICES.CREATE,
      PERMISSIONS.INVOICES.UPDATE,
      PERMISSIONS.BILLS.READ,
      PERMISSIONS.BILLS.CREATE,
      PERMISSIONS.BILLS.UPDATE,
      PERMISSIONS.PAYMENTS.READ,
      PERMISSIONS.BOM.READ,
      PERMISSIONS.WORK_ORDERS.READ,
    ];

    let employeeAccessSet = await db.query.permissionSets.findFirst({
      where: and(
        eq(permissionSets.name, 'Employee Access'),
        sql`${permissionSets.organizationId} IS NULL`,
      ),
    });

    if (!employeeAccessSet) {
      const [newSet] = await db
        .insert(permissionSets)
        .values({
          name: 'Employee Access',
          organizationId: null,
        })
        .returning();
      employeeAccessSet = newSet;
    }

    // Link defined employee permissions to the "Employee Access" set
    for (const p of employeePermissions) {
      await db
        .insert(permissionSetItems)
        .values({
          permissionSetId: employeeAccessSet!.id,
          permissionId: p,
        })
        .onConflictDoNothing();
    }

    // 4. Create Base Roles (Admin, Employee)

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
    let employeeRole = await db.query.roles.findFirst({
      where: and(eq(roles.name, 'Employee'), sql`${roles.organizationId} IS NULL`),
    });

    if (!employeeRole) {
      const [newRole] = await db
        .insert(roles)
        .values({
          name: 'Employee',
          isBaseRole: true,
          organizationId: null,
        })
        .returning();
      employeeRole = newRole;
    }

    if (employeeRole && employeeAccessSet) {
      // Link Employee role to Employee Access set
      await db
        .insert(rolePermissionSets)
        .values({
          roleId: employeeRole.id,
          permissionSetId: employeeAccessSet.id,
        })
        .onConflictDoNothing();
    }

    console.log('✅ RBAC System defaults verified.');
  } catch (err) {
    console.error('❌ RBAC Seeding failed:', err);
    throw err;
  }
}
