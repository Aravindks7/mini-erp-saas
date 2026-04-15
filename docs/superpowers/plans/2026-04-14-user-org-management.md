# User & Organization Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a comprehensive, multi-tenant administrative interface for managing Organization Profiles, Memberships, and Invitations.

**Architecture:** Vertical slice implementation following the "Tabbed Workspace Center" model. Uses TanStack Query for state, Contract-First Zod schemas for validation, and a "Zero-Leak" backend security model.

**Tech Stack:** React (Vite), Node.js (Express), Drizzle ORM, Zod, TanStack Query, shadcn/ui.

---

## Phase 1: Shared Contracts & Backend Enhancements

### Task 1: Update Organization Contracts

**Files:**

- Modify: `shared/contracts/organizations.contract.ts`

- [ ] **Step 1: Add member management and invite lifecycle schemas**

```typescript
// Add to shared/contracts/organizations.contract.ts

export const updateMemberRoleSchema = z.object({
  role: z.enum(['admin', 'employee']),
});

export const memberResponseSchema = z.object({
  id: uuidSchema, // Assuming a uuidSchema helper exists or use z.string().uuid()
  userId: z.string().uuid(),
  organizationId: z.string().uuid(),
  role: z.enum(['admin', 'employee']),
  joinedAt: z.string().datetime(),
  user: z.object({
    name: z.string(),
    email: z.string().email(),
    image: z.string().url().nullable(),
  }),
});

export const inviteResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(['admin', 'employee']),
  status: z.enum(['pending', 'accepted', 'cancelled']),
  expiresAt: z.string().datetime(),
  createdAt: z.string().datetime(),
});

export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
```

- [ ] **Step 2: Commit**

```bash
git add shared/contracts/organizations.contract.ts
git commit -m "contract: add member and invite management schemas"
```

### Task 2: Enhance Organizations Service

**Files:**

- Modify: `server/src/modules/organizations/organizations.service.ts`

- [ ] **Step 1: Implement `listMembers`, `updateMemberRole`, `removeMember`, and `inviteLifecycle` methods**
- [ ] **Step 2: Add "Last Admin" lockout protection in `removeMember` and `updateMemberRole`**
- [ ] **Step 3: Implement `resendInvite` and `cancelInvite`**
- [ ] **Step 4: Commit**

```bash
git add server/src/modules/organizations/organizations.service.ts
git commit -m "feat(server): implement organization member and invite management logic"
```

### Task 3: Implement Backend Routes & Controllers

**Files:**

- Modify: `server/src/modules/organizations/organizations.controller.ts`
- Modify: `server/src/modules/organizations/organizations.routes.ts`

- [ ] **Step 1: Add controller handlers for new endpoints**
- [ ] **Step 2: Mount routes in `organizations.routes.ts`**
- [ ] **Step 3: Verify with httpie smoke tests**
- [ ] **Step 4: Commit**

```bash
git add server/src/modules/organizations/organizations.controller.ts server/src/modules/organizations/organizations.routes.ts
git commit -m "feat(server): add organization management endpoints"
```

## Phase 2: Frontend Data Layer

### Task 4: Update Organizations API Client

**Files:**

- Modify: `client/src/features/organizations/api/organizations.api.ts`

- [ ] **Step 1: Add methods for members and invitations**
- [ ] **Step 2: Commit**

```bash
git add client/src/features/organizations/api/organizations.api.ts
git commit -m "feat(client): update organizations api client with member and invite actions"
```

### Task 5: Create TanStack Query Hooks

**Files:**

- Modify: `client/src/features/organizations/hooks/organizations.hooks.ts`

- [ ] **Step 1: Implement `useMembers`, `useUpdateMemberRole`, `useRemoveMember`**
- [ ] **Step 2: Implement `useInvitations`, `useResendInvite`, `useCancelInvite`**
- [ ] **Step 3: Commit**

```bash
git add client/src/features/organizations/hooks/organizations.hooks.ts
git commit -m "feat(client): add hooks for member and invitation management"
```

## Phase 3: UI Construction

### Task 6: Implement Tabbed Workspace Center

**Files:**

- Modify: `client/src/features/settings/pages/SettingsPage.tsx`
- Create: `client/src/features/organizations/components/MembersTab.tsx`
- Create: `client/src/features/organizations/components/InvitationsTab.tsx`
- Create: `client/src/features/organizations/components/OrgProfileTab.tsx`

- [ ] **Step 1: Refactor `SettingsPage` to use Tabs**
- [ ] **Step 2: Build `OrgProfileTab` with `UpdateOrganizationForm`**
- [ ] **Step 3: Build `MembersTab` with `MembersTable`**
- [ ] **Step 4: Build `InvitationsTab` with `InvitationsTable` and `InviteMemberDialog`**
- [ ] **Step 5: Commit**

```bash
git add client/src/features/settings/pages/SettingsPage.tsx client/src/features/organizations/components/
git commit -m "feat(client): implement tabbed organization management interface"
```

### Task 7: Final Polish & RBAC Guards

**Files:**

- Modify: `client/src/features/users/pages/UsersPage.tsx`
- Modify: `client/src/components/guards/RoleGuard.tsx` (if needed)

- [ ] **Step 1: Redirect `UsersPage` to the new Members Tab or implement shared view**
- [ ] **Step 2: Apply RBAC guards to hide management tabs for non-admins**
- [ ] **Step 3: Commit**

```bash
git add client/src/features/users/pages/UsersPage.tsx
git commit -m "feat(client): finalize user and org management integration"
```
