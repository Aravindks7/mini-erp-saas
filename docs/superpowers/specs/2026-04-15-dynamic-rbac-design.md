# Design Spec: Database-Driven Dynamic RBAC System

**Date:** 2026-04-15
**Status:** Validated (Audit Complete)
**Goal:** Implement a production-grade, multi-tenant RBAC system with dynamic roles, hierarchical permission sets, and SaaS-wide base templates.

## 1. Architectural Overview

The system transitions from a static `pgEnum` role-based model to a normalized, database-driven **Permission-Based Access Control (PBAC)** system. It is designed to provide maximum flexibility for tenants while maintaining strict type safety and clinical isolation.

### Core Principles

- **Domain-Driven Namespacing:** Permissions are organized by business module (e.g., `CUSTOMERS.READ`).
- **Standard Additive Logic:** Permissions are purely additive; access is granted if _any_ assigned role or base template provides the required permission.
- **Tenant Autonomy:** Organizations can create custom roles while inheriting SaaS-wide base role definitions.
- **Zero-Compromise Type Safety:** 100% TypeScript coverage from the shared contract down to the database schema.

---

## 2. Data Model (Schema)

### 2.1 Fixed Tables (Seeded from Code)

- **`permissions`**:
  - `id` (text, Primary Key): The unique permission string (e.g., `customers:create`).
  - `description` (text): Human-readable explanation.
- **`permission_sets`**:
  - `id` (uuid, Primary Key)
  - `name` (text): e.g., "Sales Professional", "Accountant View-Only".
  - `organization_id` (uuid, Optional): `null` for global sets, or specific to a tenant.
- **`permission_set_items`**:
  - `permission_set_id` (uuid)
  - `permission_id` (text)

### 2.2 Dynamic Tables (ERP Engine)

- **`roles`**:
  - `id` (uuid, Primary Key)
  - `name` (text): e.g., "Junior Sales Rep".
  - `organization_id` (uuid, Optional): `null` for SaaS-wide base roles.
  - `is_base_role` (boolean): Flag indicating it's a SaaS-wide template.
- **`role_permission_sets`**:
  - `role_id` (uuid)
  - `permission_set_id` (uuid)
- **`organization_memberships` (Updated)**:
  - `role_id` (uuid): References `roles.id`. (Replaces legacy `role` enum).
- **`organization_invites` (Updated)**:
  - `role_id` (uuid): References `roles.id`. (Replaces legacy `role` enum).

---

## 3. Shared Contract (`shared/contracts/rbac.contract.ts`)

The source of truth for all permissions.

```typescript
export const PERMISSIONS = {
  CUSTOMERS: {
    READ: 'customers:read',
    CREATE: 'customers:create',
    UPDATE: 'customers:update',
    DELETE: 'customers:delete',
  },
  INVENTORY: {
    READ: 'inventory:read',
    ADJUST: 'inventory:adjust',
  },
  ORGANIZATION: {
    SETTINGS: 'org:settings:manage',
    MEMBERS: 'org:members:manage',
    ROLES: 'org:roles:manage', // New permission for RBAC management
  },
} as const;

// Clinical Type Inference
type ValuesOf<T> = T extends object ? ValuesOf<T[keyof T]> : T;
export type Permission = ValuesOf<typeof PERMISSIONS>;
```

---

## 4. Implementation Strategy

### 4.1 RBACService (Centralized Logic)

A new `RBACService` will be the authoritative source for permission resolution.

- **Resolution Query:** Fetches all permissions for a user by joining `memberships` → `roles` → `permission_sets` → `permissions`.
- **Global Inheritance:** The query automatically includes permissions from `roles` where `is_base_role = true` and `organization_id IS NULL`.

### 4.2 Middleware Integration

- **`authMiddleware`**: Fetches the `role_id` and attaches a `PermissionResolver` object to `req`.
- **`requirePermission(permission)`**: Calls `req.permissions.can(permission)` to verify access.

### 4.3 System Bootstrapping

When a new Organization is created:

1.  **Seed Base Roles:** The system creates/links the "Admin" and "Employee" base roles.
2.  **Initial Assignment:** The organization creator is assigned the `role_id` of the "Admin" base role.

---

## 5. Safety & Guardrails (The "Last Admin" Lockout)

To prevent clinical failure states, the system enforces a **Protected Permission** logic.

- **Rule:** A role containing the `ORGANIZATION.MEMBERS` permission cannot be deleted or downgraded if it is the last such role assigned to an active user in the tenant.
- **Implementation:** The `RBACService` will provide a `canDowngrade(userId, orgId)` check used by the `OrganizationsService`.

---

## 6. Multi-Tenant Isolation (RLS)

To maintain the project's **Clinical RLS Isolation**, the new tables must integrate with the automated security policies defined in `@server/drizzle/0001_security_policies.sql`.

### 6.1 Global vs. Tenant Access

Because `roles` and `permission_sets` support **Global/Base** records (where `organization_id` is NULL), the existing RLS policy must be updated.

- **Proposed RLS Logic:**
  - `USING (organization_id IS NULL OR organization_id = current_setting('app.current_organization_id')::uuid)`
- **Axiom:** This ensures users can always "see" the SaaS-wide templates but can only "edit" them if they are the SaaS super-admin (verified via a system-level role).

---

## 7. Migration & Reset Strategy

As requested, the migration history can be reset to achieve a "clean" schema state.

1. **Reset Flow:**
   - Clear the `server/drizzle` directory (excluding `0001_security_policies.sql`).
   - Generate a fresh `0000_init.sql` containing the new RBAC tables.
   - Ensure `0001_security_policies.sql` is executed _after_ the base schema to apply the RLS loop to the new tables.
2. **Clinical Verification:**
   - Verify that `RAISE NOTICE` in the SQL script confirms RLS application to `roles`, `permission_sets`, and `permissions`.

---

## 8. Testing & Validation

- **Integration Tests:** Verify that a user with "Sales" set cannot access "Inventory" endpoints.
- **Tenant Isolation Tests:** Confirm `organization_id` NULL roles are accessible to all, but tenant-specific roles are isolated.
- **Performance Benchmarks:** Measure the impact of the multi-join permission resolution query.
