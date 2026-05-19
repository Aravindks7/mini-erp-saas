# Stripe & Advanced Invoice UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Stripe-powered payment requests and advanced invoice UI logic with a clean database migration history.

**Architecture:** Intent vs. Fact pattern for payments. Single "Add Payment" action with manual/external modes. Webhook-driven reconciliation.

**Tech Stack:** React, Stripe Node SDK, Drizzle ORM, Express.

---

### Task 1: Phase 1 - Schema Updates & Database Reset

**Files:**

- Create: `server/src/db/schema/payment-intents.schema.ts`
- Modify: `server/src/db/schema/index.ts`
- Modify: `server/src/db/schema/payments.schema.ts`

- [ ] **Step 1: Create `payment-intents.schema.ts`**
      Define the `paymentIntents` table as specified in the design doc.

- [ ] **Step 2: Update `payments.schema.ts`**
      Add `paymentIntentId` reference to the `payments` table.

- [ ] **Step 3: Update `index.ts`**
      Export the new schema.

- [ ] **Step 4: Execute Database Reset Protocol**
  - [ ] Backup `server/drizzle/0001_security_policies.sql` and `server/drizzle/0002_dashboard_mvs.sql`.
  - [ ] Run: `rm -rf server/drizzle/*`
  - [ ] Run: `pnpm --filter server db:generate`
  - [ ] Re-create `0001_security_policies.sql` and `0002_dashboard_mvs.sql`.
  - [ ] Update `server/drizzle/meta/_journal.json` to include 0000, 0001, 0002.
  - [ ] Run: `pnpm --filter server db:migrate`

---

### Task 2: Phase 2 - Backend Stripe Integration

**Files:**

- Modify: `server/package.json`
- Modify: `server/src/modules/payments/payments.service.ts`
- Create: `server/src/modules/payments/webhooks.controller.ts`
- Modify: `server/src/modules/payments/payments.routes.ts`

- [ ] **Step 1: Install Stripe SDK**
      Run: `pnpm --filter server add stripe`

- [ ] **Step 2: Implement Stripe Session Logic**
      Add `createStripeSession` to `PaymentsService`. It should create a Stripe Checkout Session and a local `paymentIntent` record.

- [ ] **Step 3: Implement Webhook Controller**
      Create a handler for `checkout.session.completed` that fulfills the intent, creates a payment, and reconciles the invoice.

- [ ] **Step 4: Register Webhook Route**
      Add `router.post('/webhook/stripe', express.raw({ type: 'application/json' }), ...)` to the routes.

---

### Task 3: Phase 3 - Frontend Invoice UI Expansion

**Files:**

- Modify: `client/src/features/invoices/pages/InvoiceDetailsPage.tsx`
- Create: `client/src/features/invoices/components/AddPaymentSheet.tsx`
- Modify: `client/src/features/invoices/components/DocumentSummary.tsx` (if applicable)

- [ ] **Step 1: Update Summary Card**
      Show `Total Paid` and `Balance Due` on the Invoice Details page.

- [ ] **Step 2: Implement "Add Payment" Sheet**
      Single sheet with a tab switcher or toggle between "Record Manual" and "Request Online".

- [ ] **Step 3: Implement History Tab**
      Split the display to show realized `payments` and pending `payment_intents`.

---

### Task 4: Final Verification

- [ ] **Step 1: Run Type Checks**
- [ ] **Step 2: Run Tests**
- [ ] **Step 3: Manual Smoke Test with Stripe CLI**
