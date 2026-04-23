# Design Spec: Collapsible Filter Toolbar

## 1. Objective

Enhance the `DataTable` system with a standardized, collapsible filter area and improved individual filter management. This allows users to keep the interface clean while providing quick access to advanced filtering options and efficient filter clearing.

## 2. Approach: Composed `DataTableToolbar`

The toggle state and collapsible layout will be handled directly inside `DataTableToolbar`. This ensures consistency across the ERP while minimizing boilerplate for individual features. Granular filters in `DataTableFilter` will also support individual clearing.

## 3. Detailed Design

### 3.1. Filter Toggle Button

- **Placement**: Main toolbar row, next to the Search input.
- **Visuals**:
  - Uses the `ListFilter` icon.
  - Displays a count badge when filters are active.
  - Badge logic: `activeFilters.length` (excluding the primary search key).
- **Behavior**: Toggles the visibility of the "Filter Row".

### 3.2. Collapsible Filter Row

- **Placement**: Immediately below the main toolbar, above the table/cards.
- **Visibility**: Controlled by internal `isFilterVisible` state.
- **Animation**: Uses standard Tailwind/Animate.css transitions (`animate-in slide-in-from-top-2`) for a polished feel.
- **Content**: Renders the `children` (granular `DataTableFilter` components).

### 3.3. Search Input

- **Behavior**: Remains permanently visible in the main toolbar row.
- **Rationale**: Search is the primary interaction for data discovery and should never be hidden.

### 3.4. Individual Filter Clearing

- **Component**: `DataTableFilter.tsx`
- **Visuals**: A small `X` icon (using `X` from `lucide-react`) appended to the filter button when `selectedValues.size > 0`.
- **Behavior**: Clicking the `X` clears only that specific column's filters (`column.setFilterValue(undefined)`).
- **Implementation**: Stop propagation on the click event to prevent the popover from opening.

## 4. UI/UX Refinements

- **Active State**: The Filter button will show a subtle "active" background color (e.g., `bg-muted`) when the filter area is open.
- **Reset Integration**: The existing "Reset" button in the toolbar will continue to clear all filters (including search).

## 5. Implementation Strategy

1.  **Update `DataTableFilter.tsx`**: Add the individual clear button logic.
2.  **Update `DataTableToolbar.tsx`**:
    - Include `isFilterVisible` state.
    - Add the toggle button with badge logic.
    - Wrap `children` in a conditional, animated container.
3.  **Verify layout**: Ensure the Customers feature works seamlessly with the new collapsible area.

## 6. Security & Standards

- Follows existing `shadcn/ui` patterns for buttons and badges.
- Maintains 100% type safety for the `Table` instance.
