# 2026-04-30 Roadmap Implementation Design

## 1. Goal

Implement Priority 1-4 of the Roadmap to ensure structural consistency, feature parity for detail views, scalable CSV workflows, and advanced financial state reconciliation.

## 2. Functional Taxonomy

### 2.1 Core Business Entities (Standardization & Parity)

1. **Inventory Module**: Refactor to strictly use `#shared/` aliases and ensure compliance with Feature-Driven Vertical Slicing.
2. **Tax & Unit of Measure (UoM)**: Extend with `DetailsPage` components in the frontend.

### 2.2 Transactional Data (Advanced Logic)

1. **Products**: Add CSV Import/Export capability.
2. **Invoices & Payments**: Implement `partially_paid` status and dynamic `balanceDue` reconciliation.

## 3. Architecture & Implementation Sections

### 3.1 Priority 1: Structural Inconsistency Alignment (Inventory)

- **Problem**: Potential usage of deep relative imports or inconsistent referencing of shared contracts in the `Inventory` module.
- **Solution**:
  - Audit all files in `server/src/modules/inventory/`.
  - Replace any `../../shared` imports with `#shared/`.
  - Ensure `inventory.service.ts` uses the `BaseService` patterns consistently (already largely present).
  - Verify `inventory.routes.ts` exports follow the standard pattern used in `customers.routes.ts`.

### 3.2 Priority 2: Detail-View Completeness (Taxes & UoM)

- **Problem**: Taxes and UoM only have list views, breaking the "Everything has a reading view" pattern.
- **Solution**:
  - Create `client/src/features/taxes/pages/TaxDetailsPage.tsx`.
  - Create `client/src/features/uom/pages/UomDetailsPage.tsx`.
  - Use `DetailView` shared component.
  - Implement `RouteTabs` for "Overview" and "Audit Trail".
  - Update `routes.tsx` for both features to mount the new pages.

### 3.3 Priority 3: CSV Workflow Expansion (Products)

- **Problem**: `ProductsService` lacks bulk data handling.
- **Solution**:
  - Add `exportProducts` to `ProductsService` (Flattening Product + UoM Name + Tax Name).
  - Add `importProducts` to `ProductsService`.
  - Implementation detail: Import must validate that `baseUomId` and `taxId` (if provided) exist for the tenant.
  - Add corresponding routes and controller methods.
  - Add "Import/Export" buttons to the `ProductsListPage`.

### 3.4 Priority 4: Deep Integration (Invoice Reconciliation)

- **Problem**: Invoices only transition from `open` to `paid`. No support for partial payments or balance tracking.
- **Solution**:
  - **Shared**: Update `invoiceStatusEnumSchema` in `shared/contracts/invoices.contract.ts` to include `partially_paid`.
  - **Database**: Update `invoices` table schema (and migrations) to add `balance_due` (decimal) and update the status enum check constraint if it exists.
  - **Logic**: Update `PaymentsService.reconcileInvoiceStatus`:
    - Calculate `totalPaid` from all `completed` payments for the invoice.
    - Calculate `balanceDue = totalAmount - totalPaid`.
    - If `totalPaid == 0`, status = `open`.
    - If `totalPaid > 0` AND `totalPaid < totalAmount`, status = `partially_paid`.
    - If `totalPaid >= totalAmount`, status = `paid`.
  - **Verification**: Add a Vitest integration test in `payments.test.ts` simulating a partial payment and verifying the `balanceDue` and `status` updates.

## 4. Success Criteria

- [ ] No relative imports to `shared` folder in `server/src/modules/inventory`.
- [ ] Navigating to `/taxes/:id` and `/uom/:id` shows the DetailView.
- [ ] CSV Export from Products returns a valid CSV with UoM/Tax names.
- [ ] A partial payment on an Invoice sets status to `partially_paid` and correctly updates `balanceDue`.

## 5. Risk Assessment & Trade-offs

- **Migration Risk**: Updating the Invoice status enum requires a database migration. We must ensure existing records remain valid.
- **Performance**: Dynamic calculation of `balanceDue` in the reconciliation service is efficient as it uses indexed `invoiceId` on payments.
- **Architecture**: Storing `balanceDue` on the Invoice table provides faster reads for lists/summaries but requires strict reconciliation logic to avoid stale data. We will maintain the "Single Source of Truth" by trigger-based reconciliation in the `PaymentsService`.

## 7. Database Migration Reset Protocol

To maintain a clean schema history with the new `partially_paid` status and `balanceDue` fields, the database migrations will be reset using the following sequence:

1. **Pre-Reset Backup**: Ensure contents of `0001_security_policies.sql` and `0002_dashboard_mvs.sql` are captured.
2. **Directory Purge**: Delete all files in `server/drizzle/` and `server/drizzle/meta/`.
3. **Re-Generation**: Run `pnpm --filter server db:generate` to create a new `0000` base migration containing the updated schema.
4. **Manual Re-creation**:
   - Re-create `server/drizzle/0001_security_policies.sql` with the clinical RLS enforcement script.
   - Re-create `server/drizzle/0002_dashboard_mvs.sql` with the dashboard materialized view logic.
5. **Journal Synchronization**: Update `server/drizzle/meta/_journal.json` to include the three migrations in the correct order (0000, 0001, 0002) with appropriate timestamps.
6. **Execution**: Run `pnpm --filter server db:push` or `db:migrate` (depending on environment safety) to apply the fresh schema.
