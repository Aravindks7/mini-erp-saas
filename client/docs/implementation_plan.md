# ERP SaaS Component Library Expansion Plan

This plan outlines the systematic expansion of the shared component library to meet the "Interview-Ready" standards of a premium ERP SaaS. The goal is to maximize code reuse, ensure 100% type safety, and provide a clinical, professional user experience.

## User Review Required

> [!IMPORTANT]
> **Component Generalization:** To maintain a clear separation of concerns, I will implement these in `client/src/components/shared`. They MUST NOT contain business logic specific to any single feature (e.g., no "Customer" specific logic in `StatusBadge`).

> [!CAUTION]
> **Dependency management:** Some UI components might require additional shadcn primitives (like `calendar` for `DatePicker`). I will install these via `npx shadcn-ui@latest add` as needed.

## Proposed Changes

### Phase 1: Resilience & Global UX (Infrastructure)

Establish the "Zero-Compromise" layer to handle loading and error states across the app.

#### [NEW] [ErrorBoundary.tsx](file:///home/aravind/personal/mini-erp-saas/client/src/components/shared/ErrorBoundary.tsx)

- React Error Boundary to catch runtime failures.
- Prevents the entire application from crashing if a single component fails.

#### [NEW] [ErrorState.tsx](file:///home/aravind/personal/mini-erp-saas/client/src/components/shared/ErrorState.tsx)

- Visual component with "Retry" functionality and detailed logging for debugging.

#### [NEW] [SkeletonLoader.tsx](file:///home/aravind/personal/mini-erp-saas/client/src/components/shared/SkeletonLoader.tsx)

- Generic skeletons for forms and tables.
- Integration into `DataTable.tsx` to handle `isLoading` states.

---

### Phase 2: Specialized ERP Inputs (Precision)

Standardize inputs that require specific formatting or large-dataset handling.

#### [NEW] [AmountInput.tsx](file:///home/aravind/personal/mini-erp-saas/client/src/components/shared/form/AmountInput.tsx)

- Controlled input for financial values.
- **Requirement:** MUST require a `currency` prop (e.g., "USD", "EUR").
- **Implementation:** Use `Intl.NumberFormat` for internal formatting transitions.
- **Validation:** Ensure 100% precision for ERP financial records.

#### [NEW] [Combobox.tsx](file:///home/aravind/personal/mini-erp-saas/client/src/components/shared/form/Combobox.tsx)

- Searchable select for mapping large entities (e.g., "Select Customer").
- Supports external filtering/async loading.

#### [NEW] [DateRangePicker.tsx](file:///home/aravind/personal/mini-erp-saas/client/src/components/shared/form/DateRangePicker.tsx)

- Simplified wrapper around shadcn `calendar` for reporting windows.

---

### Phase 3: Data Presentation & Metadata (Branding/Status)

Refining how entities are represented and audited.

#### [NEW] [StatusBadge.tsx](file:///home/aravind/personal/mini-erp-saas/client/src/components/shared/StatusBadge.tsx)

- Generic component that consumes a `StatusMap` provided by the calling feature.
- **Requirement:** Feature-level mapping of enums to semantic tones (`success`, `danger`, `warning`, `neutral`).
- **Constraint:** ❌ No central status registry to keep features decoupled.

#### [NEW] [UserDisplay.tsx](file:///home/aravind/personal/mini-erp-saas/client/src/components/shared/UserDisplay.tsx)

- Composition of `Avatar` + `Name` + `Email`.
- Standard presentation for users/team members.

#### [NEW] [AuditInfo.tsx](file:///home/aravind/personal/mini-erp-saas/client/src/components/shared/AuditInfo.tsx)

- Shared footer for detail views showing `CreatedAt`, `UpdatedAt`, and record owner.

---

### Phase 4: Navigation & Structure (Hierarchy)

Enhancing deep-module navigation and read-only views.

#### [NEW] [Breadcrumbs.tsx](file:///home/aravind/personal/mini-erp-saas/client/src/components/shared/Breadcrumbs.tsx)

- Auto-generating path links based on URL/module hierarchy.

#### [NEW] [DetailView.tsx](file:///home/aravind/personal/mini-erp-saas/client/src/components/shared/DetailView.tsx)

- A standardized "Info Grid" for displaying entity data in a non-editable state.

---

## Open Questions (RESOLVED)

1. **Status Mapping:** Feature-driven mapping. `StatusBadge` remains generic and consumes a map of semantic tones provided by each feature.
2. **Currency Precision:** `AmountInput` MUST require a `currency` prop and use `Intl.NumberFormat` for internal formatting.

## Verification Plan

### Automated Tests

- `npx vitest client/src/components/shared`
- Verify component rendering with various edge cases (empty data, long strings, invalid dates).

### Manual Verification

- Review the new components in the context of the `Customers` feature.
- Verify `DataTable` loading state by simulating slow API responses.
