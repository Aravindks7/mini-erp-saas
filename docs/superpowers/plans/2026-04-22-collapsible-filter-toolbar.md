# Collapsible Filter Toolbar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a standardized, collapsible filter area and improved individual filter management for the DataTable system.

**Architecture:**

1. Update `DataTableFilter` to include a clear button (`X`) for individual column filters, using `stopPropagation` to prevent popover triggering.
2. Refactor `DataTableToolbar` to handle `searchNode` (permanent) and `filterNode` (collapsible row), along with a toggle button that displays active filter counts.
3. Update `EntityTable` and `CustomerList` to adopt the new toolbar API (`searchNode` and `filterNode` instead of unified `children`/`toolbarContent`).

**Tech Stack:** React, TailwindCSS, lucide-react, @tanstack/react-table, Vitest, React Testing Library.

---

### Task 1: Update `DataTableFilter` with Individual Clear Button

**Files:**

- Modify: `client/src/components/shared/data-table/DataTableFilter.tsx`
- Modify: `client/src/components/shared/data-table/__tests__/DataTableFilter.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// in client/src/components/shared/data-table/__tests__/DataTableFilter.test.tsx
// Add this test to the describe block:

it('should render an X button and clear filter when clicked directly', () => {
  mockColumn.getFilterValue.mockReturnValue('active');

  render(
    <DataTableFilter
      column={mockColumn as unknown as Column<unknown, unknown>}
      title="Status"
      options={options}
    />,
  );

  const clearButton = screen.getByTestId('clear-filter-status');
  expect(clearButton).toBeInTheDocument();

  fireEvent.click(clearButton);
  expect(mockColumn.setFilterValue).toHaveBeenCalledWith(undefined);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- client/src/components/shared/data-table/__tests__/DataTableFilter.test.tsx`
Expected: FAIL (Unable to find an element by: [data-testid="clear-filter-status"])

- [ ] **Step 3: Write minimal implementation**

```tsx
// in client/src/components/shared/data-table/DataTableFilter.tsx
// Add import { X } from 'lucide-react';
// And modify the return block around the badges:

export function DataTableFilter<TData, TValue>({
  column,
  title,
  options,
}: DataTableFilterProps<TData, TValue>) {
  if (!column) return null;

  const currentFilterValue = column.getFilterValue() as string | undefined;
  const selectedValues = new Set(currentFilterValue ? currentFilterValue.split(',') : []);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <PlusCircle className="mr-2 h-4 w-4" />
          {title}
          {selectedValues?.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                {selectedValues.size}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedValues.size > 2 ? (
                  <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                    {selectedValues.size} selected
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedValues.has(option.value))
                    .map((option) => (
                      <Badge
                        variant="secondary"
                        key={option.value}
                        className="rounded-sm px-1 font-normal"
                      >
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
              <div
                role="button"
                data-testid={`clear-filter-${title?.toLowerCase()}`}
                className="ml-2 rounded-full hover:bg-muted/50 p-0.5 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  column.setFilterValue(undefined);
                }}
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
// ... rest unchanged
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- client/src/components/shared/data-table/__tests__/DataTableFilter.test.tsx`
Expected: PASS

---

### Task 2: Refactor `DataTableToolbar`

**Files:**

- Modify: `client/src/components/shared/data-table/DataTableToolbar.tsx`

- [ ] **Step 1: Write the updated implementation**

```tsx
// in client/src/components/shared/data-table/DataTableToolbar.tsx
'use no memo';

import * as React from 'react';
import type { Table } from '@tanstack/react-table';
import { X, Trash2, ListFilter } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { BulkAction } from './DataTable';
import { DataViewToggle } from './DataViewToggle';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchNode?: React.ReactNode;
  filterNode?: React.ReactNode;
  searchKey?: string;
  bulkActions?: BulkAction<TData>[];
  onReset?: () => void;
  viewMode?: 'list' | 'grid';
  onViewModeChange?: (view: 'list' | 'grid') => void;
}

export function DataTableToolbar<TData>({
  table,
  searchNode,
  filterNode,
  searchKey,
  bulkActions = [],
  onReset,
  viewMode,
  onViewModeChange,
}: DataTableToolbarProps<TData>) {
  const [isFilterVisible, setIsFilterVisible] = React.useState(false);
  const isFiltered = table.getState().columnFilters.length > 0;
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const hasSelection = selectedRows.length > 0;

  const activeFiltersCount = React.useMemo(() => {
    return table.getState().columnFilters.filter((f) => (searchKey ? f.id !== searchKey : true))
      .length;
  }, [table.getState().columnFilters, searchKey]);

  const handleReset = () => {
    if (onReset) {
      onReset();
    } else {
      table.resetColumnFilters();
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 w-full">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto flex-1">
          {searchNode}

          {filterNode && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFilterVisible(!isFilterVisible)}
              className={`h-8 border-dashed ${isFilterVisible ? 'bg-muted' : ''}`}
            >
              <ListFilter className="mr-2 h-4 w-4" />
              Filter
              {activeFiltersCount > 0 && (
                <span className="ml-2 rounded-sm bg-secondary px-1.5 py-0.5 text-xs font-normal">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          )}

          {viewMode && onViewModeChange && (
            <DataViewToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
          )}
          {isFiltered && (
            <Button
              variant="ghost"
              onClick={handleReset}
              className="h-8 px-2 lg:px-3 text-muted-foreground hover:text-foreground shrink-0"
            >
              Reset
              <X className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          {hasSelection && (
            <div className="flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-200 w-full sm:w-auto">
              <span className="text-xs font-semibold text-muted-foreground mr-2 px-2 py-1 bg-muted rounded-md whitespace-nowrap">
                {selectedRows.length} selected
              </span>
              <div className="flex items-center gap-2 ml-auto sm:ml-0">
                {bulkActions.map((action, idx) => (
                  <Button
                    key={idx}
                    variant={action.variant || 'outline'}
                    size="sm"
                    onClick={() => action.onAction(selectedRows.map((r) => r.original))}
                    className="h-8 gap-2 font-medium"
                  >
                    {action.icon ||
                      (action.variant === 'destructive' && <Trash2 className="h-3.5 w-3.5" />)}
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {isFilterVisible && filterNode && (
        <div className="flex items-center gap-2 animate-in slide-in-from-top-2 duration-200 w-full flex-wrap border-t pt-3 mt-1">
          {filterNode}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Check for type errors**

Run: `npx tsc --noEmit`
Expect: Errors in `EntityTable.tsx` where `DataTableToolbar` is used without correct props.

---

### Task 3: Update `EntityTable` API

**Files:**

- Modify: `client/src/components/shared/data-table/EntityTable.tsx`

- [ ] **Step 1: Write the updated implementation**

```tsx
// in client/src/components/shared/data-table/EntityTable.tsx
// 1. Change the interface property:
  /** Custom content to inject into the toolbar (e.g., specialized filters) */
  toolbarFilters?: (table: Table<TData>) => React.ReactNode;

// 2. Change the props destructuring in the EntityTable component definition:
  headerActions,
  toolbarFilters,
  bulkActions,

// 3. Update the DataTableToolbar usage:
        <DataTableToolbar
          table={table}
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
          bulkActions={bulkActions}
          onReset={onReset}
          searchKey={searchKey}
          searchNode={
            searchKey ? (
              <DataTableSearch
                searchKey={searchKey}
                value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ''}
                onChange={(value) => table.getColumn(searchKey)?.setFilterValue(value)}
              />
            ) : undefined
          }
          filterNode={toolbarFilters?.(table)}
        />
```

- [ ] **Step 2: Check for type errors**

Run: `npx tsc --noEmit`
Expect: Errors in `CustomerList.tsx` where `toolbarContent` is still used.

---

### Task 4: Update `CustomerList` to match new API

**Files:**

- Modify: `client/src/features/customers/components/CustomerList.tsx`

- [ ] **Step 1: Write the updated implementation**

```tsx
// in client/src/features/customers/components/CustomerList.tsx
// Update the EntityTable call to remove DataTableSearch from toolbarContent, use searchKey instead, and rename toolbarContent to toolbarFilters

      emptyState={{
        title: 'Customer Directory is empty',
        description: 'You haven\'t added any customers yet. Click "Add Customer" to get started.',
      }}
      bulkActions={[
        {
          label: 'Delete Selected',
          onAction: (rows: CustomerResponse[]) =>
            console.log(
              'Bulk delete:',
              rows.map((r) => r.id),
            ),
          variant: 'destructive',
        },
      ]}
      searchKey="companyName"
      toolbarFilters={(table) => (
        <DataTableFilter
          column={table.getColumn('status')}
          title="Status"
          options={customerStatusOptions}
        />
      )}
    />
```

- [ ] **Step 2: Verify all types and tests**

Run: `npx tsc --noEmit`
Expected: PASS

Run: `npm run test`
Expected: PASS
