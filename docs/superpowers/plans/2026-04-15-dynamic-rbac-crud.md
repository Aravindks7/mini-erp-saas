# Dynamic RBAC CRUD Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement full lifecycle management (Create, Read, Update, Delete) for Roles and Permission Sets with an enterprise-grade UI and Copy-on-Write safety.

**Architecture:**

- **Backend:** Intelligent `RBACService` that forks global templates (Copy-on-Write) when edited by a tenant.
- **Frontend:** Dedicated management pages using hierarchical `PermissionTree` and searchable `TransferList` components.
- **Safety:** Automatic usage checks before deletion to prevent system instability.

**Tech Stack:** Node.js (Express), Drizzle ORM, React (TypeScript), TanStack Query, shadcn/ui.

---

## Phase 1: Shared Contracts & Backend Logic

### Task 1: Update Shared Contracts

**Files:**

- Modify: `shared/contracts/rbac.contract.ts`

- [ ] **Step 1: Add update schemas**

```typescript
export const updatePermissionSetSchema = createPermissionSetSchema.partial();
export const updateRoleSchema = createRoleSchema.partial();

export type UpdatePermissionSetInput = z.infer<typeof updatePermissionSetSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
```

### Task 2: Extend RBACService with CRUD & CoW

**Files:**

- Modify: `server/src/modules/rbac/rbac.service.ts`

- [ ] **Step 1: Implement Fetch, Update (with CoW), and Delete for Permission Sets**
- [ ] **Step 2: Implement Fetch, Update (with CoW), and Delete for Roles**
- [ ] **Step 3: Implement Usage Guards**
  - `isPermissionSetInUse(setId)`
  - `isRoleInUse(roleId)`

### Task 3: Implement RBAC CRUD Endpoints

**Files:**

- Modify: `server/src/modules/rbac/rbac.controller.ts`
- Modify: `server/src/modules/rbac/rbac.routes.ts`

- [ ] **Step 1: Add GET, PATCH, DELETE controllers for Sets**
- [ ] **Step 2: Add GET, PATCH, DELETE controllers for Roles**
- [ ] **Step 3: Register routes with appropriate permissions**

---

## Phase 2: Core UI Components

### Task 4: Implement PermissionTree Component

**Files:**

- Create: `client/src/components/shared/rbac/PermissionTree.tsx`

- [ ] **Step 1: Create recursive triple-state checkbox tree**
      Must handle Indeterminate state (e.g., when some but not all "Customers" permissions are selected).

### Task 5: Implement TransferList Component

**Files:**

- Create: `client/src/components/shared/rbac/TransferList.tsx`

- [ ] **Step 1: Create dual-column selection interface**
      Features: Searchable columns, "Move All", and visual highlighting of assigned sets.

---

## Phase 3: Management Pages

### Task 6: Implement PermissionSetFormPage

**Files:**

- Create: `client/src/features/organizations/pages/PermissionSetFormPage.tsx`

- [ ] **Step 1: Implement form with Name input and PermissionTree**
- [ ] **Step 2: Handle Create vs. Update (Forking) logic**

### Task 7: Implement RoleFormPage

**Files:**

- Create: `client/src/features/organizations/pages/RoleFormPage.tsx`

- [ ] **Step 1: Implement form with Name input and TransferList (for Permission Sets)**
- [ ] **Step 2: Handle Create vs. Update (Forking) logic**

---

## Phase 4: Integration & UX

### Task 8: Update Settings Routing

**Files:**

- Modify: `client/src/features/settings/routes.tsx`

- [ ] **Step 1: Register new pages in the settings route hierarchy**

### Task 9: Add Action Menus to List Views

**Files:**

- Modify: `client/src/features/organizations/components/RolesTab.tsx`
- Modify: `client/src/features/organizations/components/PermissionSetsTab.tsx`

- [ ] **Step 1: Add "Create" buttons to headers**
- [ ] **Step 2: Add "Edit" and "Delete" actions to row dropdowns**
- [ ] **Step 3: Implement Delete confirmation logic**
