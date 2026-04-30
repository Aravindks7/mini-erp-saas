# Roadmap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Priorities 1-4 of the Roadmap: Structural Alignment, Detail-View Parity, CSV Workflow for Products, and Deep Integration for Invoices/Payments.

**Architecture:** Vertical slicing for features, BaseService patterns for backend logic, and standard React primitives (DetailView, RouteTabs) for frontend parity. Includes a database migration reset to maintain a clean history.

**Tech Stack:** React, TypeScript, Drizzle ORM, Express, Vitest.

---

### Task 1: Priority 1 - Inventory Structural Alignment

**Files:**

- Modify: `server/src/modules/inventory/inventory.controller.ts`
- Modify: `server/src/modules/inventory/inventory.routes.ts`
- Modify: `server/src/modules/inventory/inventory.service.ts`

- [ ] **Step 1: Audit and Update Imports**
      Ensure all imports from `shared` use the `#shared/` alias consistently. Check for any deep relative paths like `../../../shared`.

- [ ] **Step 2: Verify Vertical Slicing Exports**
      Ensure the module follows the pattern of exporting a router from `inventory.routes.ts` and a service instance from `inventory.service.ts`.

- [ ] **Step 3: Run Type Check**
      Run: `pnpm --filter server type-check`
      Expected: PASS

---

### Task 2: Priority 2 - Detail-View Parity (Taxes & UoM)

**Files:**

- Create: `client/src/features/taxes/pages/TaxDetailsPage.tsx`
- Create: `client/src/features/uom/pages/UomDetailsPage.tsx`
- Modify: `client/src/features/taxes/routes.tsx`
- Modify: `client/src/features/uom/routes.tsx`

- [ ] **Step 1: Implement TaxDetailsPage**
      Use `DetailView` with "Overview" and "Audit Trail" tabs.

- [ ] **Step 2: Implement UomDetailsPage**
      Use `DetailView` with "Overview" and "Audit Trail" tabs.

- [ ] **Step 3: Update Routes**
      Add the `:id` routes to the respective `routes.tsx` files.

- [ ] **Step 4: Verify Navigation**
      Manual check: Navigate to `/taxes` and `/uom`, click on an item, and ensure the DetailView loads.

---

### Task 3: Priority 3 - CSV Workflow Expansion (Products)

**Files:**

- Modify: `server/src/modules/products/products.service.ts`
- Modify: `server/src/modules/products/products.controller.ts`
- Modify: `server/src/modules/products/products.routes.ts`
- Modify: `client/src/features/products/pages/ProductsListPage.tsx`

- [ ] **Step 1: Implement exportProducts in ProductsService**
      Flatten product data including UoM and Tax names.

- [ ] **Step 2: Implement importProducts in ProductsService**
      Handle parsing and validation of UoM/Tax references.

- [ ] **Step 3: Add Controller Methods & Routes**
      Implement `exportProducts` and `importProducts` handlers.

- [ ] **Step 4: Add UI Buttons**
      Add Import/Export buttons to `ProductsListPage.tsx` using the `DataTable` toolbar pattern.

---

### Task 4: Priority 4 - Deep Integration (Invoice/Payment Logic)

**Files:**

- Modify: `shared/contracts/invoices.contract.ts`
- Modify: `server/src/db/schema/invoices.schema.ts` (Check exact name in `server/src/db/schema/`)
- Modify: `server/src/modules/payments/payments.service.ts`

- [ ] **Step 1: Update Zod Contract**
      Add `partially_paid` to `invoiceStatusEnumSchema`.

- [ ] **Step 2: Update Database Schema**
      Add `balanceDue` to `invoices` table and update the status enum.

- [ ] **Step 3: Implement Enhanced Reconciliation**
      Update `reconcileInvoiceStatus` in `PaymentsService` to handle partial payments and `balanceDue` calculation.

---

### Task 5: Database Migration Reset Protocol

- [ ] **Step 1: Backup Custom SQLs**
      Ensure `0001_security_policies.sql` and `0002_dashboard_mvs.sql` content is captured.

- [ ] **Step 2: Purge Drizzle Directory**
      Run: `rm -rf server/drizzle/*`

- [ ] **Step 3: Re-generate Base Migration**
      Run: `pnpm --filter server db:generate`

- [ ] **Step 4: Re-integrate Custom SQLs**
      Manually re-create `server/drizzle/0001_security_policies.sql` and `server/drizzle/0002_dashboard_mvs.sql`.

- [ ] **Step 5: Sync Journal**
      Update `server/drizzle/meta/_journal.json` to include 0000, 0001, and 0002.

- [ ] **Step 6: Run Migration**
      Run: `pnpm --filter server db:migrate`

---

### Task 6: Final Verification

- [ ] **Step 1: Run All Tests**
      Run: `pnpm test`

- [ ] **Step 2: Manual Smoke Test**
      Verify functionality via CLI or UI.

- [ ] **Step 3: Final Type Check**
      Run: `pnpm type-check`
