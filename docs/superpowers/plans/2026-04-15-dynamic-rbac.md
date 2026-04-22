# Dynamic RBAC Implementation Plan - COMPLETED

**Goal:** Implement a production-grade, multi-tenant RBAC system with dynamic roles, hierarchical permission sets, and SaaS-wide base templates.

**Architecture:** Database-Driven Dynamic RBAC (PBAC) using a nested hierarchy for permissions, a centralized `RBACService` for resolution, and additive permission logic.

**Tech Stack:** Node.js (Express), Drizzle ORM, PostgreSQL (RLS), React (TypeScript).

---

## Phase 1: Shared Contract & Data Model

### Task 1: Define Shared Permission Contract [DONE]

**Files:**

- Create: `shared/contracts/rbac.contract.ts`
- Modify: `shared/index.ts`

- [x] **Step 1: Create the nested permissions object**
- [x] **Step 2: Export from shared index**

### Task 2: Implement RBAC Database Schema [DONE]

**Files:**

- Create: `server/src/db/schema/permissions.schema.ts`
- Create: `server/src/db/schema/roles.schema.ts`
- Modify: `server/src/db/schema/index.ts`

- [x] **Step 1: Define Permissions and Roles tables**
- [x] **Step 2: Update memberships and invites to use roleId**

---

## Phase 2: Backend Logic & Middleware

### Task 3: Implement RBACService [DONE]

**Files:**

- Create: `server/src/modules/rbac/rbac.service.ts`

- [x] **Step 1: Implement permission resolution logic**
- [x] **Step 2: Add safety guardrails**

### Task 4: Implement RBAC Middleware [DONE]

**Files:**

- Create: `server/src/middleware/rbac.middleware.ts`
- Modify: `server/src/middleware/auth.middleware.ts`
- Create: `server/src/modules/rbac/rbac.routes.ts`
- Create: `server/src/modules/rbac/rbac.controller.ts`
- Modify: `server/src/app.ts`

- [x] **Step 1: Update authMiddleware to resolve permissions**
- [x] **Step 2: Implement requirePermission middleware**
- [x] **Step 3: Added RBAC routes for frontend permission fetching**

---

## Phase 3: Migration & Verification [DONE]

### Task 5: Reset Migrations and Apply RLS [DONE]

**Files:**

- Modify: `server/drizzle/` (reset)
- Execute: `pnpm drizzle-kit generate`
- Execute: `pnpm drizzle-kit push`
- Execute: `psql ... -f server/drizzle/0001_security_policies.sql`

- [x] **Step 1: Clear existing migrations (except 0001)**
- [x] **Step 2: Generate fresh init migration**
- [x] **Step 3: Apply migrations and verify RLS RAISE NOTICE output**

---

## Phase 4: Frontend Integration [DONE]

### Task 6: Add Permission Guards [DONE]

**Files:**

- Create: `client/src/features/auth/api/rbac.api.ts`
- Create: `client/src/features/auth/hooks/rbac.hooks.ts`
- Create: `client/src/hooks/usePermission.ts`
- Create: `client/src/components/shared/Can.tsx`
- Modify: `client/src/features/customers/pages/CustomersPage.tsx`

- [x] **Step 1: Implement usePermission hook**
- [x] **Step 2: Implement <Can /> wrapper component**
- [x] **Step 3: Update a sample page (e.g., Customers) to use <Can />**
