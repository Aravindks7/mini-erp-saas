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

    // Upsert all defined permissions in a single batch
    if (allPermissions.length > 0) {
      await db
        .insert(permissions)
        .values(allPermissions.map((p) => ({ id: p, description: `Permission for ${p}` })))
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
          isBaseSet: true,
        })
        .returning();
      fullAccessSet = newSet;
    }

    // Link all permissions to the "Full Access" set in a single batch
    if (allPermissions.length > 0 && fullAccessSet) {
      await db
        .insert(permissionSetItems)
        .values(
          allPermissions.map((p) => ({
            permissionSetId: fullAccessSet!.id,
            permissionId: p,
          })),
        )
        .onConflictDoNothing();
    }

    // 3. Create "Employee Access" Permission Set (Global)
    // Sane defaults for a standard employee: Read everything, but no manage/delete/create on core org/RBAC
    const employeePermissions: string[] = [
      PERMISSIONS.CUSTOMERS.READ,
      PERMISSIONS.PRODUCTS.READ,
      PERMISSIONS.PRODUCT_CATEGORIES.READ,
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
      PERMISSIONS.PAYMENTS.CREATE,
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
          isBaseSet: true,
        })
        .returning();
      employeeAccessSet = newSet;
    }

    // Link defined employee permissions to the "Employee Access" set in a single batch
    if (employeePermissions.length > 0 && employeeAccessSet) {
      await db
        .insert(permissionSetItems)
        .values(
          employeePermissions.map((p) => ({
            permissionSetId: employeeAccessSet!.id,
            permissionId: p,
          })),
        )
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

    // --- Functional Role Extensions ---

    // 5. SALES MANAGER
    const salesPermissions: string[] = [
      ...Object.values(PERMISSIONS.CUSTOMERS),
      ...Object.values(PERMISSIONS.SALES_ORDERS),
      ...Object.values(PERMISSIONS.INVOICES),
      PERMISSIONS.PAYMENTS.READ,
      PERMISSIONS.PAYMENTS.CREATE,
      PERMISSIONS.PRODUCTS.READ,
      PERMISSIONS.DASHBOARD.READ,
    ];

    let salesAccessSet = await db.query.permissionSets.findFirst({
      where: and(
        eq(permissionSets.name, 'Sales Operations'),
        sql`${permissionSets.organizationId} IS NULL`,
      ),
    });

    if (!salesAccessSet) {
      const [newSet] = await db
        .insert(permissionSets)
        .values({ name: 'Sales Operations', organizationId: null, isBaseSet: true })
        .returning();
      salesAccessSet = newSet;
    }

    if (salesPermissions.length > 0 && salesAccessSet) {
      await db
        .insert(permissionSetItems)
        .values(
          salesPermissions.map((p) => ({
            permissionSetId: salesAccessSet!.id,
            permissionId: p,
          })),
        )
        .onConflictDoNothing();
    }

    let salesRole = await db.query.roles.findFirst({
      where: and(eq(roles.name, 'Sales Manager'), sql`${roles.organizationId} IS NULL`),
    });

    if (!salesRole) {
      const [newRole] = await db
        .insert(roles)
        .values({ name: 'Sales Manager', isBaseRole: true, organizationId: null })
        .returning();
      salesRole = newRole;
    }
    await db
      .insert(rolePermissionSets)
      .values({ roleId: salesRole!.id, permissionSetId: salesAccessSet!.id })
      .onConflictDoNothing();

    // 6. PURCHASE MANAGER
    const purchasePermissions: string[] = [
      ...Object.values(PERMISSIONS.SUPPLIERS),
      ...Object.values(PERMISSIONS.PURCHASE_ORDERS),
      ...Object.values(PERMISSIONS.BILLS),
      PERMISSIONS.PAYMENTS.READ,
      PERMISSIONS.PAYMENTS.CREATE,
      PERMISSIONS.PRODUCTS.READ,
      PERMISSIONS.DASHBOARD.READ,
    ];

    let purchaseAccessSet = await db.query.permissionSets.findFirst({
      where: and(
        eq(permissionSets.name, 'Purchase Operations'),
        sql`${permissionSets.organizationId} IS NULL`,
      ),
    });

    if (!purchaseAccessSet) {
      const [newSet] = await db
        .insert(permissionSets)
        .values({ name: 'Purchase Operations', organizationId: null, isBaseSet: true })
        .returning();
      purchaseAccessSet = newSet;
    }

    if (purchasePermissions.length > 0 && purchaseAccessSet) {
      await db
        .insert(permissionSetItems)
        .values(
          purchasePermissions.map((p) => ({
            permissionSetId: purchaseAccessSet!.id,
            permissionId: p,
          })),
        )
        .onConflictDoNothing();
    }

    let purchaseRole = await db.query.roles.findFirst({
      where: and(eq(roles.name, 'Purchase Manager'), sql`${roles.organizationId} IS NULL`),
    });

    if (!purchaseRole) {
      const [newRole] = await db
        .insert(roles)
        .values({ name: 'Purchase Manager', isBaseRole: true, organizationId: null })
        .returning();
      purchaseRole = newRole;
    }
    await db
      .insert(rolePermissionSets)
      .values({ roleId: purchaseRole!.id, permissionSetId: purchaseAccessSet!.id })
      .onConflictDoNothing();

    // 7. INVENTORY MANAGER
    const inventoryPermissions: string[] = [
      ...Object.values(PERMISSIONS.PRODUCTS),
      ...Object.values(PERMISSIONS.PRODUCT_CATEGORIES),
      ...Object.values(PERMISSIONS.WAREHOUSES),
      ...Object.values(PERMISSIONS.INVENTORY),
      ...Object.values(PERMISSIONS.RECEIPTS),
      ...Object.values(PERMISSIONS.SHIPMENTS),
      PERMISSIONS.UOM.READ,
      PERMISSIONS.DASHBOARD.READ,
    ];

    let inventoryAccessSet = await db.query.permissionSets.findFirst({
      where: and(
        eq(permissionSets.name, 'Inventory Operations'),
        sql`${permissionSets.organizationId} IS NULL`,
      ),
    });

    if (!inventoryAccessSet) {
      const [newSet] = await db
        .insert(permissionSets)
        .values({ name: 'Inventory Operations', organizationId: null, isBaseSet: true })
        .returning();
      inventoryAccessSet = newSet;
    }

    if (inventoryPermissions.length > 0 && inventoryAccessSet) {
      await db
        .insert(permissionSetItems)
        .values(
          inventoryPermissions.map((p) => ({
            permissionSetId: inventoryAccessSet!.id,
            permissionId: p,
          })),
        )
        .onConflictDoNothing();
    }

    let inventoryRole = await db.query.roles.findFirst({
      where: and(eq(roles.name, 'Inventory Manager'), sql`${roles.organizationId} IS NULL`),
    });

    if (!inventoryRole) {
      const [newRole] = await db
        .insert(roles)
        .values({ name: 'Inventory Manager', isBaseRole: true, organizationId: null })
        .returning();
      inventoryRole = newRole;
    }
    await db
      .insert(rolePermissionSets)
      .values({ roleId: inventoryRole!.id, permissionSetId: inventoryAccessSet!.id })
      .onConflictDoNothing();

    // 8. ACCOUNTANT
    const financePermissions: string[] = [
      ...Object.values(PERMISSIONS.FINANCE),
      ...Object.values(PERMISSIONS.TAXES),
      ...Object.values(PERMISSIONS.CURRENCIES),
      PERMISSIONS.INVOICES.READ,
      PERMISSIONS.BILLS.READ,
      ...Object.values(PERMISSIONS.PAYMENTS),
      PERMISSIONS.DASHBOARD.READ,
    ];

    let financeAccessSet = await db.query.permissionSets.findFirst({
      where: and(
        eq(permissionSets.name, 'Finance Operations'),
        sql`${permissionSets.organizationId} IS NULL`,
      ),
    });

    if (!financeAccessSet) {
      const [newSet] = await db
        .insert(permissionSets)
        .values({ name: 'Finance Operations', organizationId: null, isBaseSet: true })
        .returning();
      financeAccessSet = newSet;
    }

    if (financePermissions.length > 0 && financeAccessSet) {
      await db
        .insert(permissionSetItems)
        .values(
          financePermissions.map((p) => ({
            permissionSetId: financeAccessSet!.id,
            permissionId: p,
          })),
        )
        .onConflictDoNothing();
    }

    let accountantRole = await db.query.roles.findFirst({
      where: and(eq(roles.name, 'Accountant'), sql`${roles.organizationId} IS NULL`),
    });

    if (!accountantRole) {
      const [newRole] = await db
        .insert(roles)
        .values({ name: 'Accountant', isBaseRole: true, organizationId: null })
        .returning();
      accountantRole = newRole;
    }
    await db
      .insert(rolePermissionSets)
      .values({ roleId: accountantRole!.id, permissionSetId: financeAccessSet!.id })
      .onConflictDoNothing();

    console.log('✅ RBAC System defaults verified.');
  } catch (err) {
    console.error('❌ RBAC Seeding failed:', err);
    throw err;
  }
}
