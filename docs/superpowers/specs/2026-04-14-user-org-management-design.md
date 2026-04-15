# Spec: User & Organization Management (Tabbed Workspace Center)

**Date:** 2026-04-14  
**Status:** Approved  
**Author:** Gemini CLI (Senior Staff Engineer)

---

## 1. Primary Objective

Implement a professional, multi-tenant administrative interface for managing **Organization Profiles**, **Active Memberships**, and **User Invitations**. This feature is a core SaaS foundation, demonstrating architectural maturity, "zero-leak" security, and clinical UI precision.

## 2. Architecture & Data Flow

### 2.1 Technical Strategy

- **Feature-Driven Vertical Slicing:** Logic is colocated within `client/src/features/organizations` and `server/src/modules/organizations`.
- **Contract-First Development:** Shared Zod schemas define all API request/response shapes.
- **Tabbed Workspace Center:** A unified administrative hub in the frontend to reduce context-switching friction.
- **Multi-Tenant Isolation:** Rigorous backend checks ensuring `admin` role verification for all management actions.

### 2.2 Backend API (New & Existing)

- `PATCH /organizations/:id`: Update organization name/slug/country (Admin only).
- `GET /organizations/:id/members`: List all active members and their roles.
- `PATCH /organizations/:id/members/:userId`: Update a member's role (e.g., Employee <-> Admin).
- `DELETE /organizations/:id/members/:userId`: Remove a member from the organization (with "Last Admin" lockout protection).
- `POST /organizations/:id/invites`: Create a new invitation (Existing).
- `POST /organizations/:id/invites/:inviteId/resend`: Refresh an invitation's `expiresAt` timestamp.
- `DELETE /organizations/:id/invites/:inviteId`: Soft-delete (cancel) a pending or expired invitation.

### 2.3 Frontend State Management

- **TanStack Query:** Caching and synchronization for members, invites, and organization details.
- **Optimistic Updates:** Immediate UI feedback for "Resend Invite," "Delete Invite," and "Remove Member" actions.

---

## 3. UI/UX Design (The Tabbed Workspace Center)

### 3.1 Profile Tab (Organization Settings)

- **Component:** `UpdateOrganizationForm` (Contract-First Form).
- **Features:**
  - Pre-filled with current org data.
  - Live "Slug Preview" logic.
  - 409 Conflict handling for duplicate slugs.

### 3.2 Members Tab (Active Personnel)

- **Component:** `MembersTable` (DataTable wrapper).
- **Columns:** User (Avatar/Name/Email), Role (Interactive Dropdown), Joined Date, Actions (Remove).
- **Guardrails:** Disable "Remove" or "Change Role" for the current user and the last remaining administrator.

### 3.3 Invitations Tab (Pending Access)

- **Component:** `InvitationsTable` (DataTable wrapper).
- **Columns:** Email, Role, Expiry Date, Status Badge (Pending, Expired), Actions (Resend, Delete).
- **Workflow:**
  - **Resend:** Visible for Pending/Expired invites; extends the 7-day expiry.
  - **Delete:** Soft-deletes the invite, removing it from the active list.
- **Creation:** `InviteMemberDialog` (Modal) triggered from this tab.

---

## 4. Security & Error Handling

### 4.1 "Zero-Leak" Multi-Tenancy

- All service-level methods MUST verify that the `adminId` (requester) has an `admin` role within the target `organizationId`.
- Role-based UI masking: Non-admin users will not see management tabs or action buttons.

### 4.2 Failure Scenarios & Recovery

- **Last Admin Lockout:** Rejection of removal/role-change if it would result in 0 admins.
- **Invitation Collision:** Handle `ALREADY_MEMBER` and `ALREADY_INVITED` states gracefully with toast notifications.
- **Slug Conflict:** Real-time feedback in the form if a custom slug is already taken by another organization.

---

## 5. Implementation Roadmap

1. **Contracts:** Update `shared/contracts/organizations.contract.ts` with new schemas.
2. **Backend:** Implement Service/Controller/Routes for Members and Invites.
3. **Frontend API:** Build out TanStack Query hooks in `features/organizations`.
4. **UI Construction:** Build the three tabs and their associated tables/forms.
5. **Verification:** Rigorous integration testing for multi-tenant isolation and edge-case lockout protection.
