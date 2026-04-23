# Unified Entity Header Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate 'Add' functionality into the EntityTable, unify page identity with data actions, and eliminate header redundancy in the Customer module.

**Architecture:** Create a reusable `AddButton` "smart component" and update `EntityTable` with a `headerVariant` prop to match `PageHeader` typography and spacing.

**Tech Stack:** React (Vite), TailwindCSS, Lucide React, TanStack Table.

---

### Task 1: Create Shared AddButton Component

**Files:**

- Create: `client/src/components/shared/data-table/AddButton.tsx`

- [ ] **Step 1: Write the implementation**

```tsx
import * as React from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, type ButtonProps } from '@/components/ui/button';
import { useTenantPath } from '@/hooks/useTenantPath';
import { Can } from '@/components/shared/Can';
import type { Permission } from '@shared/index';
import { cn } from '@/lib/utils';

interface AddButtonProps extends Omit<ButtonProps, 'onClick'> {
  to: string;
  permission: Permission;
  label: string;
  icon?: React.ReactNode;
}

/**
 * Universal Add Button for ERP tables.
 * Handles permissions, multi-tenant routing, and standardized styling.
 */
export function AddButton({
  to,
  permission,
  label,
  icon,
  className,
  variant = 'default',
  ...props
}: AddButtonProps) {
  const navigate = useNavigate();
  const { getPath } = useTenantPath();

  return (
    <Can I={permission}>
      <Button
        variant={variant}
        onClick={() => navigate(getPath(to))}
        className={cn('h-9 gap-2', className)}
        {...props}
      >
        {icon || <Plus className="h-4 w-4" />}
        {label}
      </Button>
    </Can>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/shared/data-table/AddButton.tsx
git commit -m "feat(shared): add universal AddButton component"
```

---

### Task 2: Update EntityTable with Header Variants

**Files:**

- Modify: `client/src/components/shared/data-table/EntityTable.tsx`

- [x] **Step 1: Update props and styling in EntityTable**
  1. Add `headerVariant?: 'default' | 'primary'` to the `EntityTableProps` interface.
  2. Update the `EntityTable` component to accept `headerVariant = 'default'`.
  3. Update the header rendering logic to use the following styles when `headerVariant === 'primary'`:
     - Header container: Add `mb-8`.
     - Title: Use `h1` with classes `text-2xl font-bold tracking-tight text-foreground truncate leading-tight lg:text-3xl`.
     - Description: Use classes `text-sm text-muted-foreground leading-relaxed max-w-2xl font-medium`.
  4. Keep the original styles for the `default` variant (h2, etc.).
  5. Ensure `cn` utility is used for merging classes.

---

### Task 3: Refactor CustomerList to use AddButton and Primary Header

**Files:**

- Modify: `client/src/features/customers/components/CustomerList.tsx`

- [ ] **Step 1: Import AddButton and update EntityTable usage**

```tsx
// Add imports
import { AddButton } from '@/components/shared/data-table/AddButton';
import { PERMISSIONS } from '@shared/index';

// Update CustomerList return:
return (
  <EntityTable
    headerVariant="primary"
    title="Customers"
    description="Manage your client base and their details."
    // ...
    headerActions={
      <div className="flex items-center gap-2">
        <AddButton
          to="/customers/new"
          permission={PERMISSIONS.CUSTOMERS.CREATE}
          label="Add Customer"
        />
        <ExportButton endpoint="/customers/export" filename={`customers-${Date.now()}.csv`} />
        <ImportModal
        // ...
        />
      </div>
    }
    // ...
  />
);
```

- [ ] **Step 2: Commit**

```bash
git add client/src/features/customers/components/CustomerList.tsx
git commit -m "refactor(customers): integrate AddButton and primary header into CustomerList"
```

---

### Task 4: Simplify CustomersPage

**Files:**

- Modify: `client/src/features/customers/pages/CustomersPage.tsx`

- [ ] **Step 1: Remove PageHeader and manual buttons**

```tsx
import { CustomerList } from '../components/CustomerList';
import { PageContainer } from '@/components/shared/PageContainer';

export default function CustomersPage() {
  return (
    <PageContainer>
      <CustomerList />
    </PageContainer>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/features/customers/pages/CustomersPage.tsx
git commit -m "refactor(customers): simplify CustomersPage by removing PageHeader"
```

---

### Task 5: Verification

- [ ] **Step 1: Run TypeScript check**

Run: `cd client && npx tsc --noEmit`
Expected: 0 errors

- [ ] **Step 2: Verify visually (Manual)**
- Check `Customers` page: Should have a large title, description, and "Add Customer" button aligned with Export/Import.
- Check `Settings` page: Should still look correct with `PageHeader` (verifying no regression in the design system).
