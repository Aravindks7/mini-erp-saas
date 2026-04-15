# User & Organization Management Refinements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate the administrative interface to industry standards by implementing slug-based routing (`/:slug/feature`), role-based UI visibility, searchable inputs, and clinical table refinements.

**Architecture:**

- **Slug-based Routing:** Shift the app's routing core to use URL-driven tenancy.
- **RBAC UI Masking:** Centralized filtering in the Sidebar and Settings Hub.
- **UI Enhancement:** Standardize on searchable Comboboxes and informative "Summary Cards."

**Tech Stack:** React (Router v7), TanStack Query, shadcn/ui, Zod.

---

## Phase 1: Architectural - URL Sync & Slug Routing

### Task 1: Implement Slug-based Routing Logic

**Files:**

- Modify: `client/src/app-router.tsx`
- Modify: `client/src/components/guards/TenantGuard.tsx`
- Modify: `client/src/contexts/TenantContext.tsx`

- [ ] **Step 1: Update main dashboard route to use `/:slug`**

```typescript
// app-router.tsx
{
  path: '/:slug', // Change from '/' to '/:slug'
  element: (
    <AuthGuard>
      <TenantGuard>
        <DashboardLayout />
      </TenantGuard>
    </AuthGuard>
  ),
  children: dashboardRoutes,
}
```

- [ ] **Step 2: Update `TenantGuard` to resolve org from slug**
  - Use `useParams()` to get the slug.
  - If slug is present, find matching org in the `organizations` list.
  - If found and `activeOrganizationId` doesn't match, call `setActiveOrganizationId`.
  - If no slug is present but `activeOrganizationId` exists, redirect to `/${activeOrg.slug}`.

- [ ] **Step 3: Commit**

```bash
git add client/src/app-router.tsx client/src/components/guards/TenantGuard.tsx
git commit -m "arch: implement slug-based routing core"
```

### Task 2: Prefix Sidebar Links with Slug

**Files:**

- Modify: `client/src/components/shared/SidebarContent.tsx`

- [ ] **Step 1: Update `sidebarItems` mapping**
  - Use `activeOrganization?.slug` from `useTenant`.
  - Prefix all NavLink paths: `to={/${activeOrg.slug}${item.path}}`.

- [ ] **Step 2: Commit**

```bash
git add client/src/components/shared/SidebarContent.tsx
git commit -m "ui: update sidebar links to include workspace slug"
```

## Phase 2: Menu & Navigation Cleanup

### Task 3: Remove Users Menu & RBAC Settings Masking

**Files:**

- Delete: `client/src/features/users/`
- Modify: `client/src/lib/router-registry.tsx`
- Modify: `client/src/components/shared/SidebarContent.tsx`

- [ ] **Step 1: Remove `usersRoutes` from registry and delete folder**
- [ ] **Step 2: Implement RBAC filtering in Sidebar**

```typescript
// SidebarContent.tsx
const sidebarItems = dashboardRoutes.filter((route) => {
  if (!route.handle?.showInSidebar) return false;
  // Hide settings for non-admins
  if (route.path === 'settings' && activeOrganization?.role !== 'admin') return false;
  return true;
});
```

- [ ] **Step 3: Commit**

```bash
git add client/src/lib/router-registry.tsx client/src/components/shared/SidebarContent.tsx
git commit -m "feat: remove users menu and hide settings for employees"
```

## Phase 3: Settings Page & Form Enhancements

### Task 4: Persistent Tabs & UI Summary Card

**Files:**

- Modify: `client/src/features/settings/pages/SettingsPage.tsx`
- Modify: `client/src/features/organizations/components/OrgProfileTab.tsx`

- [ ] **Step 1: Implement `localStorage` persistence for settings tabs**
  - On mount, if path is exactly `/settings`, redirect to the last saved sub-path.
- [ ] **Step 2: Add "Organization At-a-Glance" summary card to the right of the Profile Form**
  - Layout: `<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">`
  - Left (2 cols): `UpdateOrganizationForm`
  - Right (1 col): `StatsCard` or `AuditInfo` showing member counts and creation date.

- [ ] **Step 3: Commit**

```bash
git add client/src/features/settings/pages/SettingsPage.tsx client/src/features/organizations/components/OrgProfileTab.tsx
git commit -m "ui: implement persistent tabs and profile summary card"
```

### Task 5: Searchable Country Combobox

**Files:**

- Modify: `client/src/features/organizations/components/UpdateOrganizationForm.tsx`

- [ ] **Step 1: Replace `Select` with `Combobox` for Default Country**
  - Map `COUNTRIES` to `{ label, value }`.
  - Use `@/components/shared/form/Combobox`.

- [ ] **Step 2: Commit**

```bash
git add client/src/features/organizations/components/UpdateOrganizationForm.tsx
git commit -m "ui: replace country select with searchable combobox"
```

## Phase 4: Table Action Refinements

### Task 6: Conditional Row Actions

**Files:**

- Modify: `client/src/features/organizations/components/MembersTab.tsx`
- Modify: `client/src/features/organizations/components/InvitationsTab.tsx`

- [ ] **Step 1: Hide actions for current user in Members table**

```typescript
renderRowActions={(member) => {
  if (member.userId === session?.user?.id) return null;
  // ... rest of actions
}}
```

- [ ] **Step 2: Hide actions for accepted/revoked invites**

```typescript
renderRowActions={(invite) => {
  if (invite.status !== 'pending') return null;
  // ... rest of actions
}}
```

- [ ] **Step 3: Commit**

```bash
git add client/src/features/organizations/components/MembersTab.tsx client/src/features/organizations/components/InvitationsTab.tsx
git commit -m "ui: refine table actions for members and invitations"
```
