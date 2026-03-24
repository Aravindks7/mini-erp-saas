# Project: ERP-SaaS - Core Architecture & Constraints

## 1. Technical Stack

- **Frontend:** React (Vite), TailwindCSS, Shadcn UI.
- **State Management:** TanStack Query (for all server state/API calls).
- **Backend:** Node.js + Express.js.
- **Database:** PostgreSQL via Drizzle ORM.
- **Environment:** Windows 11 WSL2 (Ubuntu/Zsh) using the Antigravity IDE.

## 2. Engineering Standards (The "Stress-Test" Mindset)

- **Type Safety:** 100% TypeScript coverage. No `any`. Use Drizzle's `SelectModel` and `InsertModel` for frontend/backend type sharing.
- **Architecture:** Clean separation of concerns. Keep business logic out of Express controllers; use a dedicated `services/` layer.
- **Environment Pathing:** Since this runs in WSL2, ensure all generated file paths strictly use forward slashes (`/`) and assume a Linux filesystem structure.
- **Frontend Patterns:** - Use functional components with hooks.
  - Favor composition over complex prop-drilling.
  - All data fetching must use TanStack Query mutations/queries with proper error boundaries.
- **Error Handling:** Implement a global error-handling middleware. Never "swallow" errors; log them with context for clinical teardowns.

## 3. Review & Critical Analysis Rules

- **Anti-Hallucination:** If a library or API is deprecated, flag it immediately.
- **Efficiency:** Prioritize lean, performant code. Avoid heavy third-party dependencies unless they solve a core structural problem.
- **Critical Tone:** When asked to review code, identify logical fallacies, potential race conditions in PostgreSQL, and technical debt.
