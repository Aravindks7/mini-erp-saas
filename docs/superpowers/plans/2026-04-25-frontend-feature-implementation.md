# Frontend Module Implementation Plan (Bottom-Up)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the frontend for UoM, Taxes, Suppliers, and Products modules by mirroring the `Customers` module architectural patterns, while adopting industry-standard naming conventions.

**Architecture:** Vertical Feature-Sliced Design. API layer -> TanStack Query Hooks -> Components (DataTable + Form) -> Route-level Pages.

**Tech Stack:** React, TanStack Query, React Hook Form, Zod, shadcn/ui, TailwindCSS.

---

### Task 0: Standardization Refactoring

**Files:**

- Modify: `client/src/features/customers/pages/CustomersPage.tsx` (Rename)
- Modify: `client/src/app-router.tsx`

- [ ] **Step 1: Rename CustomersPage to CustomersListPage**
      Rename `client/src/features/customers/pages/CustomersPage.tsx` to `client/src/features/customers/pages/CustomersListPage.tsx`.

- [ ] **Step 2: Update App Router**
      Update imports and route definitions in `client/src/app-router.tsx` to reflect the name change.

---

### Task 1: Units of Measure (UoM) Feature

**Files:**

- Create: `client/src/features/uom/api/uoms.api.ts`
- Create: `client/src/features/uom/hooks/uoms.hooks.ts`
- Create: `client/src/features/uom/components/columns.tsx`
- Create: `client/src/features/uom/components/UomRowActions.tsx`
- Create: `client/src/features/uom/components/UomList.tsx`
- Create: `client/src/features/uom/components/UomFormSheet.tsx`
- Create: `client/src/features/uom/pages/UomsListPage.tsx`
- Create: `client/src/features/uom/routes.tsx`
- Modify: `client/src/app-router.tsx`

- [ ] **Step 1: API Layer**
      Create `client/src/features/uom/api/uoms.api.ts` mirroring `customers.api.ts`.

- [ ] **Step 2: Hooks Layer**
      Create `client/src/features/uom/hooks/uoms.hooks.ts` mirroring `customers.hooks.ts`.

- [ ] **Step 3: Table Columns**
      Create `client/src/features/uom/components/columns.tsx`.

- [ ] **Step 4: Row Actions**
      Create `client/src/features/uom/components/UomRowActions.tsx`.

- [ ] **Step 5: UoM List Component**
      Create `client/src/features/uom/components/UomList.tsx` using `EntityTable`.

- [ ] **Step 6: UoM Form (Sheet)**
      Create `client/src/features/uom/components/UomFormSheet.tsx`. Use the shadcn `Sheet` component for a side-out experience.

- [ ] **Step 7: List Page**
      Create `client/src/features/uom/pages/UomsListPage.tsx`.

- [ ] **Step 8: Register Routes**
      Create `client/src/features/uom/routes.tsx` and integrate into `app-router.tsx`.

---

### Task 2: Taxes Feature

**Files:**

- Create: `client/src/features/taxes/api/taxes.api.ts`
- Create: `client/src/features/taxes/hooks/taxes.hooks.ts`
- Create: `client/src/features/taxes/components/columns.tsx`
- Create: `client/src/features/taxes/components/TaxRowActions.tsx`
- Create: `client/src/features/taxes/components/TaxesList.tsx`
- Create: `client/src/features/taxes/components/TaxFormSheet.tsx`
- Create: `client/src/features/taxes/pages/TaxesListPage.tsx`
- Create: `client/src/features/taxes/routes.tsx`
- Modify: `client/src/app-router.tsx`

- [ ] **Step 1: API Layer**
- [ ] **Step 2: Hooks Layer**
- [ ] **Step 3: Table Columns**
- [ ] **Step 4: Row Actions**
- [ ] **Step 5: Taxes List Component**
- [ ] **Step 6: Tax Form (Sheet)**
- [ ] **Step 7: List Page**
- [ ] **Step 8: Register Routes**

---

### Task 3: Suppliers Feature

**Files:**

- Create: `client/src/features/suppliers/api/suppliers.api.ts`
- Create: `client/src/features/suppliers/hooks/suppliers.hooks.ts`
- Create: `client/src/features/suppliers/components/columns.tsx`
- Create: `client/src/features/suppliers/components/SupplierRowActions.tsx`
- Create: `client/src/features/suppliers/components/SupplierList.tsx`
- Create: `client/src/features/suppliers/components/SupplierForm.tsx`
- Create: `client/src/features/suppliers/pages/SuppliersListPage.tsx`
- Create: `client/src/features/suppliers/pages/SupplierFormPage.tsx`
- Create: `client/src/features/suppliers/routes.tsx`
- Modify: `client/src/app-router.tsx`

- [ ] **Step 1: API Layer**
- [ ] **Step 2: Hooks Layer**
- [ ] **Step 3: Table Columns**
- [ ] **Step 4: Row Actions**
- [ ] **Step 5: Supplier List Component**
- [ ] **Step 6: Supplier Form** (Use `AddressSection` and `ContactSection`)
- [ ] **Step 7: List Page**
- [ ] **Step 8: Form Page** (Create/Edit)
- [ ] **Step 9: Register Routes**

---

### Task 4: Products Feature

**Files:**

- Create: `client/src/features/products/api/products.api.ts`
- Create: `client/src/features/products/hooks/products.hooks.ts`
- Create: `client/src/features/products/components/columns.tsx`
- Create: `client/src/features/products/components/ProductRowActions.tsx`
- Create: `client/src/features/products/components/ProductList.tsx`
- Create: `client/src/features/products/components/ProductForm.tsx`
- Create: `client/src/features/products/pages/ProductsListPage.tsx`
- Create: `client/src/features/products/pages/ProductFormPage.tsx`
- Create: `client/src/features/products/routes.tsx`
- Modify: `client/src/app-router.tsx`

- [ ] **Step 1: API Layer**
- [ ] **Step 2: Hooks Layer**
- [ ] **Step 3: Table Columns**
- [ ] **Step 4: Row Actions**
- [ ] **Step 5: Product List Component**
- [ ] **Step 6: Product Form** (Populate UoM and Tax selects via hooks)
- [ ] **Step 7: List Page**
- [ ] **Step 8: Form Page** (Create/Edit)
- [ ] **Step 9: Register Routes**
