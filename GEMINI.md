# Project: ERP-SaaS - Technical Excellence & Resume Showcase

## 1. Primary Objective: The Resume Showcase

This project is a high-stakes demonstration of software engineering proficiency. With ~1.8 years of experience, the goal is to **wow recruiters and technical interviewers** by showcasing:

- **Architectural Maturity:** Clean separation of concerns and production-grade patterns.
- **Deep Technical Competence:** Handling complex issues like multi-tenant data isolation and advanced state management.
- **Clinical Precision:** 100% type safety, rigorous error handling, and a zero-compromise approach to code quality.

Every line of code is written with the expectation of being audited during a technical interview.

## 2. Technical Stack

- **Frontend:** React (Vite), TailwindCSS, shadcn/ui, React Hook Form, Zod, TanStack Query, TanStack Table, React Router.
- **Backend:** Node.js with Express.js, Drizzle ORM, Zod validation, Better Auth, Pino logging.
- **Database:** PostgreSQL with Drizzle Kit migrations.
- **Testing:** Vitest (Unit/Integration), React Testing Library (UI), MSW (API Mocking), Supertest (Backend API), Playwright (E2E).
- **Tooling:** ESLint, Prettier, Husky, Docker.
- **Environment:** Windows 11 WSL2 (Ubuntu/Zsh) using the Antigravity IDE.

## 3. Engineering Standards (The "Interview-Ready" Mindset)

- **Type Safety:** 100% TypeScript coverage. No `any`. Use Drizzle's `SelectModel` and `InsertModel` for frontend/backend type sharing.
- **Architecture:** Clean separation of concerns. Keep business logic out of Express controllers.
- **Environment Pathing:** Since this runs in WSL2, ensure all generated file paths strictly use forward slashes (`/`) and assume a Linux filesystem structure.
- **Frontend Patterns:**
  - Use functional components with hooks.
  - Favor composition over complex prop-drilling.
  - All data fetching must use TanStack Query mutations/queries with proper error boundaries.
- **Error Handling:** Implement a global error-handling middleware. Never "swallow" errors; log them with context for clinical teardowns.
- **Self-Documenting Code:** Code must be clear enough to explain the "Why" during a whiteboard session, not just the "How."

## 4. Review & Critical Analysis Rules (The "Senior Staff" Directives)

- **The Mentorship Mandate (Extreme Technical Depth):** Act as a Senior Staff Engineer and Architectural Mentor. Do not summarize or use conversational filler. Provide comprehensive, long-form analyses for all code, database schema, and system design evaluations.
- **Functional Taxonomy (Structural Organization):** Organize all architectural and code explanations using a Functional Taxonomy. Group entities by Lifecycle (e.g., Core Business Entities, Transactional Data), use Semantic Mapping (map technical names to their real-world purpose using descriptive parentheticals), and employ a Hierarchical Layout (numbered headers for modules, bullet points for files/tables).
- **Contextual Storytelling (The "Why"):** Never just explain _how_ a piece of code works. Always explain the theoretical context and historical evolution of the design choice to build an interview-ready narrative (e.g., why the industry moved from pattern X to pattern Y).
- **Failure Simulation (Clinical Teardowns):** When pointing out a structural weakness, logical fallacy, or PostgreSQL race condition, do not just list the flaw. Trigger a scenario simulation: walk through a concrete, high-volume edge-case scenario detailing the exact chronological sequence of events where the system fails (from the TanStack Query mutation down to the Drizzle ORM/PostgreSQL database lock).
- **Architectural Alternatives (Trade-off Analysis):** Always conclude critiques by comparing the current approach with a concrete alternative architecture. Narrate the specific technical debt, scalability limits, and developer experience (DX) trade-offs of each, specifically contextualized for a multi-tenant ERP SaaS environment.
- **Anti-Hallucination & Efficiency (The Baseline):** Flag deprecated APIs or libraries immediately. Prioritize lean, performant code. Reject heavy third-party dependencies unless they solve a systemic structural problem.

## 5. File Structure & Module Architecture (The “Scalability Contract”)

### 5.1 Core Principle: Feature-Driven Vertical Slicing

The codebase MUST be organized by **business features**, not technical layers.

#### ❌ Strictly Forbidden

- Root-level folders like `controllers/`, `services/`, `routes/`
- Single `master.ts` schema file
- Mixing unrelated domain logic in shared folders

#### ✅ Required Structure

client/src/features/<feature>/
api/ # TanStack Query hooks (data fetching layer)
components/ # Presentational + container components
pages/ # Route-level components
hooks/ # Feature-specific hooks
index.ts # Public API (exports)

server/src/modules/<feature>/
<feature>.controller.ts # HTTP layer (req/res handling only)
<feature>.service.ts # Business logic
<feature>.routes.ts # Route definitions
<feature>.test.ts # Colocated tests

---

### 5.2 Database Schema Organization

Each table MUST be defined in its own file.

server/src/db/schema/
customers.ts
users.ts
organizations.ts
index.ts # Re-export all schemas

#### Rules:

- One file per table
- No “master schema” files
- Explicit relationships via imports
- Keep files under ~300 lines

---

### 5.3 Shared Contracts (Frontend ↔ Backend Boundary)

The `shared` directory MUST only contain API contracts.

shared/contracts/
customers.contract.ts

#### Rules:

- Only Zod schemas and inferred TypeScript types
- Represents API request/response shapes
- NO database logic (Drizzle ORM forbidden)
- NO server-only utilities
- Frontend-safe only

---

### 5.4 Import Boundaries (Strict Isolation Rules)

- Frontend MUST NOT import from `server`
- Shared MUST NOT depend on `server`
- Server MAY import from `shared`
- Contracts are the ONLY allowed bridge between frontend and backend

---

### 5.5 Testing Strategy (Colocation Rule)

Test files MUST be colocated with implementation.

Example:
customers.service.ts
customers.test.ts

#### Rules:

- Use `.test.ts` suffix
- Tests excluded from production via tsconfig/build tools
- No central `__tests__` directory unless project scales significantly

---

### 5.6 Abstraction Policy (Avoid Premature Complexity)

- DO NOT introduce repository layers unless complexity demands it
- Services may directly use Drizzle ORM initially
- Introduce abstraction ONLY when:
  - Query reuse emerges
  - Transactions become complex
  - Logic duplication appears

---

### 5.7 Anti-Patterns (Immediate Rejection)

- Shared folder containing database schema ❌
- Massive files (>300 lines) ❌
- Premature repository abstraction ❌
- Cross-feature tight coupling ❌
- Treating DB schema as API contract ❌

---

## 6. API Development & Verification (The “Live Prototype” Workflow)

To maintain clinical precision and ensure "Interview-Ready" reliability, every new API endpoint MUST undergo a three-stage verification process.

### 6.1 Stage 1: Manual Smoke Testing (httpie CLI)

Before writing automated tests, the Agent MUST verify the endpoint manually using `httpie`. This ensures the routing and basic Zod validation are functioning in a live environment.

**Requirement:**

- Use the `x-dev-bypass: true` header for authenticated routes to bypass session management in development.
- Target the local dev server and analyze JSON responses and status codes (expect `200` for success, `400` for validation).
- Example:
  ```bash
  http POST :3000/customers companyName="Acme Corp" x-organization-id:org_123 x-dev-bypass:true
  ```

### 6.2 Stage 2: Automated Integration Testing (Vitest)

Following Rule 5.5, the Agent MUST create a colocated `.test.ts` file. This is the **authoritative** source of truth for complex business logic, transactions, and multi-tenant isolation.

- **Requirement:** 100% path coverage for the new endpoint (Success, Validation Error, Authorization Error).
- **Format:** Use the Mocked Integration pattern to achieve high-fidelity logic verification.

### 6.3 Stage 3: Agent-Led Success Verification

The Agent MUST NOT consider a task "Done" until:

1. The `httpie` smoke test confirms the route is mounted and Zod validation is firing (using bypass header).
2. The `vitest` suite passes with 0 failures, confirming all business logic and database transactions.
3. A full TypeScript check (`npx tsc --noEmit`) passes in the relevant directory, ensuring no regressions or type-safety violations.
4. The Agent reports the verification summary (smoke tests, unit tests, and type check) in the final response.

**Goal:** This workflow ensures that we never commit code that hasn't been structurally and functionally verified in a live-emulated state.

---

## 7. Component Design System & Reusability

To ensure consistency, speed, and maintainability across the ERP, all frontend development must adhere to a strict component hierarchy and architectural patterns.

### 7.1 Core Principle: Domain-Agnostic vs. Feature-Specific

- **📁 `client/src/components/shared`**: Domain-agnostic, generic, and reusable. These components MUST NOT contain business logic or API calls.
- **📁 `client/src/components/shared/domain`**: Domain-agnostic _modular slices_. These are logical pieces (e.g., Address, Contact) that are reused across different feature entities (Customers, Suppliers, Users).
- **📁 `client/src/features/*/components`**: Feature-specific. These components compose shared components and inject business logic or domain context.
- **⚠️ Rule**: No mixing. If a UI pattern or logical block is used in more than one feature, it MUST be moved to `shared` and generalized.

### 7.2 Component Taxonomy (The "High-Leverage" List)

#### Core Layout & Structure

- `AppLayout`: Sidebar + Header + Content.
- `AuthLayout`: Login/Register pages.
- `FocusLayout`: Minimalist layout for core tasks (e.g., focused data entry).
- `PageContainer`: Consistent padding, max width.
- `PageHeader`: Standard titles, breadcrumbs, and primary actions.
- `Section / Card`: Grouping UI.
- `Stack / Flex`: Spacing abstraction.

#### Data Display & Dashboards

- `DataTable<T>`: TanStack Table wrapper (sorting, pagination, filters).
- `DataTableToolbar`: Search + filters + actions (e.g., CSV export).
- `EmptyState`: No data UX.
- `SkeletonLoader`: Loading states.
- `StatusBadge`: Mapped from domain enums (e.g., 'active', 'pending').
- `StatsCard`: High-level metrics for dashboards.
- `DashboardGrid`: Responsive layout for analytical widgets.
- `UserDisplay`: Avatar + name + email for users/customers.
- `AuditInfo`: Standardized `createdAt` / `updatedAt` display.

#### Forms & Inputs (The ERP Engine)

- `Form`: Wrapper with `react-hook-form` and Zod contract integration.
- `FormField`: shadcn pattern (Zod-driven).
- `Input, Textarea, Checkbox, RadioGroup`: Standard primitives.
- `Select, MultiSelect`: Generic selection widgets.
- `Combobox`: Searchable selection for large datasets.
- `DatePicker, DateRangePicker`: Date selection patterns.
- `AmountInput`: Specialized currency/number entry with formatting.
- `FileUpload`: Consistent file upload UI with preview.

#### Actions & Feedback

- `Button, IconButton`: Standard action triggers.
- `DropdownMenu, ContextMenu, Tooltip`: Utility interactions.
- `Modal / Dialog, ConfirmDialog`: Interruption patterns.
- `DeleteConfirmDialog`: Specialized safety check for destructive actions.
- `Toast / Notification, ProgressBar / Spinner`: Visual feedback.

#### Navigation & Control

- `Sidebar, Navbar / Topbar, Breadcrumb`.
- `RouteTabs`: Page-level navigation mapped to router state.
- `SearchInput, FilterPanel / FilterDrawer`.

### 7.3 Anti-Patterns (Immediate Rejection)

- **Feature-Locked Tables**: Creating `CustomerTable` separately ❌ (Use `DataTable<T>`).
- **Field Duplication**: Manually defining `street`, `city`, `zip` in every form ❌ (Use `AddressSection`).
- **Logic Pollution**: Breeding API calls inside `shared` components ❌ (Keep UI "dumb").
- **Schema-Atheist Forms**: Creating forms without a Zod contract ❌ (Violates Type Safety).
- **Hardcoded Colors**: Using `bg-red-500` instead of design tokens (`bg-destructive`) ❌.

### 7.4 The "Brutal Truth" for ERP Development

**80% of your app = tables + forms.**
The other 20% is the **integration of shared slices**. If the foundational components aren't reusable, the architecture is a failure. Focus on the `Form` system, the `DataTable`, and the `Layout` above all else.

---

### 7.5 The "Contract-First Form" Pattern

All data entry in the ERP MUST follow the Contract-First pattern to ensure 100% type safety and automatic validation.

1.  **Contract Definition**: Define a Zod schema in `shared/contracts` (e.g., `createCustomerSchema`).
2.  **Type Inference**: Infer the input type from the schema (`z.infer<typeof schema>`).
3.  **Form Integration**: Use the generic `Form` component:
    ```tsx
    <Form<T, typeof schema> schema={schema} onSubmit={...}>
      {(form) => (
        <FormField name="fieldName" label="...">
          {({ field }) => <Input {...field} />}
        </FormField>
      )}
    </Form>
    ```
4.  **Benefits**: Centralized validation, field-level type checking, and shared business rules across frontend/backend.

### 7.6 Domain-Specific Shared Abstractions

Complex, recurring data structures (e.g., Addresses, Contact Details, Bank Accounts) MUST be abstracted into `shared/domain` components.

- **Structure**: These components accept the `form.control` and the field `name` as props.
- **Example (`AddressSection.tsx`)**:
  ```tsx
  <AddressSection control={form.control} name="addresses" />
  ```
- **Rationale**: Ensures that an "Address" looks and behaves identically whether it's on a Customer, a Supplier, or an Employee record.

---

## 8. Testing Approach

To ensure code reliability and maintainability, the Agent MUST follow this testing approach after adding new backend or frontend code:

### 8.1 Frontend (client)

- **Vitest:** The primary test runner used for unit and integration testing.
- **React Testing Library (`@testing-library/react`):** Used for testing UI components by simulating user behavior.
- **Jest DOM (`@testing-library/jest-dom`):** Provides custom DOM element matchers for Vitest.
- **User Event (`@testing-library/user-event`):** Used to simulate realistic browser interactions (clicks, typing, etc.).
- **jsdom:** Provides a browser-like environment in Node.js for running DOM tests.

### 8.2 Backend (server)

- **Vitest:** Also used as the backend test runner for consistency across the monorepo.
- **Supertest:** Used for high-fidelity testing of Express API endpoints by simulating HTTP requests.
- **MSW (Mock Service Worker):** Used for mocking API responses and network-level interactions.
- **Better Auth Infra:** Used for testing authentication flows.

### 8.3 Cross-Cutting & E2E

- **Playwright:** Used for End-to-End (E2E) testing to verify full system workflows.
- **Zod:** Used extensively across both frontend and backend for contract-first validation and type safety in tests.
