# 2026-04-30 Stripe Integration & Advanced Invoice Payments Design

## 1. Goal

Implement a robust, Staff-level payment system that supports both manual internal recording and automated external payment requests via Stripe, maintaining strict separation between payment intents and realized transactions.

## 2. Functional Taxonomy

### 2.1 Transactional Entities

1. **Payment Intent**: A request for payment (expected funds). Stores provider references (Stripe) and metadata.
2. **Payment**: A realized transaction (actual funds). Linked to an Invoice or Bill.

### 2.2 Lifecycle Stages

1. **Manual Entry**: `Add Payment` -> `Record Manual` -> `Payment Created` -> `Reconciliation`.
2. **Online Request**: `Add Payment` -> `Request Online` -> `Payment Intent Created (Pending)` -> `External Payment` -> `Webhook` -> `Payment Created` + `Intent Succeeded` -> `Reconciliation`.

## 3. Architecture & Implementation Sections

### 3.1 Priority 1: Schema Updates & Migration Reset

- **New Table: `payment_intents`**
  - `id`, `organization_id`, `invoice_id`, `amount`, `status` (pending, succeeded, failed, expired), `provider` (stripe), `providerRef`, `metadata`.
- **Reset Protocol**:
  - Purge `server/drizzle/`.
  - Regenerate `0000_baseline.sql`.
  - Restore `0001_security_policies.sql` and `0002_dashboard_mvs.sql`.
  - Sync `_journal.json`.

### 3.2 Priority 2: Backend Stripe Integration

- **Stripe SDK**: Add `stripe` library to `server`.
- **Service**: Implement `createStripeSession` in `PaymentsService`.
- **Webhook Handler**: `POST /api/webhooks/stripe`.
  - Handles `checkout.session.completed`.
  - Atomically creates `payment` and marks `intent` as `succeeded`.
  - Triggers `reconcileInvoiceStatus`.

### 3.3 Priority 3: Frontend UI (Invoice Details)

- **Summary**: Show `Total`, `Paid to Date`, and `Balance Due`.
- **"Add Payment" Sheet**:
  - Mode A: Manual Record (Internal).
  - Mode B: Stripe Request (External).
- **History Tab**: List `payments` and `pending_intents`.

## 4. Success Criteria

- [ ] Manual payment updates `balanceDue` and status.
- [ ] Stripe webhook success creates payment record and updates invoice.
- [ ] Database migration history is clean and contains all custom RLS/MV logic.
