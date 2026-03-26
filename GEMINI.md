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

## 4. Review & Critical Analysis Rules

- **Anti-Hallucination:** If a library or API is deprecated, flag it immediately.
- **Efficiency:** Prioritize lean, performant code. Avoid heavy third-party dependencies unless they solve a core structural problem.
- **Critical Tone:** When asked to review code, identify logical fallacies, potential race conditions in PostgreSQL, and technical debt.
- **Showcase Narratives:** For complex features, prioritize explaining the trade-offs and decisions made to build a "story" for interviews.
