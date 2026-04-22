# Design Spec: Dynamic RBAC CRUD Management

**Date:** 2026-04-15
**Status:** Approved
**Goal:** Implement full lifecycle management (Create, Read, Update, Delete) for Roles and Permission Sets with an enterprise-grade UI and Copy-on-Write safety.

## 1. Architectural Overview

This spec extends the existing Dynamic RBAC system to allow tenant administrators to fully manage their own access controls. It introduces the "Copy-on-Write" (CoW) pattern to allow tenants to safely customize system-level templates without affecting other tenants.

### Core Principles

- **Self-Healing Templates:** System roles are immutable. Editing them creates a tenant-specific fork.
- **Hierarchical Configuration:** Permissions are managed via a triple-state tree mirroring the TypeScript contract.
- **Declarative Deletion Guards:** Records cannot be deleted if they are actively in use by users (Roles) or other Roles (Permission Sets).

---

## 2. UI / UX Design

### 2.1 Management Pages

Instead of simple modals, we will implement dedicated management pages under `/settings/roles/*` and `/settings/permission-sets/*`.

- **List Views:** Enhanced versions of the existing `RolesTab` and `PermissionSetsTab` with action menus.
- **Editor View:**
  - Breadcrumb navigation for context.
  - Two-column layout: Form details (Left) and Permission Tree / Transfer List (Right).

### 2.2 Key Components

- **`PermissionTree`**:
  - Recursively renders the `PERMISSIONS` object.
  - Supports Indeterminate states for module-level checkboxes.
- **`TransferList`**:
  - Dual-column interface (Available vs. Assigned).
  - Searchable to handle large lists of permission sets.

---

## 3. Backend Implementation

### 3.1 Extended API

- `GET /rbac/sets/:id`: Fetch specific set details.
- `PATCH /rbac/sets/:id`: Update set. (Triggers CoW if global).
- `DELETE /rbac/sets/:id`: Delete set. (Guard: Check `role_permission_sets` usage).
- `GET /rbac/roles/:id`: Fetch specific role details.
- `PATCH /rbac/roles/:id`: Update role. (Triggers CoW if global).
- `DELETE /rbac/roles/:id`: Delete role. (Guard: Check `organization_memberships` usage).

### 3.2 Copy-on-Write (CoW) Logic

When a `PATCH` request targets a record where `organization_id IS NULL`:

1.  Verify the requester has `org:roles:manage`.
2.  Create a **New Record** with the same name (or updated name) and the current tenant's `organization_id`.
3.  Duplicate the relationships (Items or Sets) to the new record.
4.  Return the new record's ID to the frontend for redirection.

---

## 4. Frontend Routing (`client/src/features/settings/routes.tsx`)

| Path                            | Component               | Purpose             |
| :------------------------------ | :---------------------- | :------------------ |
| `/settings/roles/new`           | `RoleFormPage`          | Create custom role  |
| `/settings/roles/:id`           | `RoleFormPage`          | Edit (or Fork) role |
| `/settings/permission-sets/new` | `PermissionSetFormPage` | Create custom set   |
| `/settings/permission-sets/:id` | `PermissionSetFormPage` | Edit (or Fork) set  |

---

## 5. Testing & Validation

### 5.1 Deletion Guardrails

- **Test Case:** Attempt to delete the "Admin" role (system role). **Expected:** `403 Forbidden` (System roles are immutable).
- **Test Case:** Attempt to delete a custom role assigned to 1 user. **Expected:** `400 Bad Request` (Role in use).

### 5.2 Inheritance Verification

- **Test Case:** Fork a system role, remove `customers:delete`. **Expected:** The user assigned to the forked role loses the permission immediately.
