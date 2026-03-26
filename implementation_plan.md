# Multi-Tenant Invitation System

Currently, adding a member to an organization requires the user to already exist in the database. This is a common limitation in early-stage SaaS applications. To fulfill the "Interview-Ready" objective and improve UX, we will implement an Invitation system.

## Proposed Changes

### Database Schema

1. **New Table: `organization_invites`**
   - `id`: UUID (Primary Key)
   - `email`: Text (The email to invite)
   - `organizationId`: UUID (The target organization)
   - `role`: Enum ('admin', 'employee')
   - `invitedById`: UUID (The admin who sent the invite)
   - `status`: Enum ('pending', 'accepted', 'revoked')
   - `expiresAt`: Timestamp (e.g., 7 days from now)
   - `...timestamps`

### Backend Modules

1. **[OrganizationsService](file:///home/aravind/personal/erp-saas-app/server/src/modules/organizations/organizations.service.ts#5-87)**
   - Add `inviteMember` which verifies the requester's admin status and creates an invitation record.
   - Modify [addMember](file:///home/aravind/personal/erp-saas-app/server/src/modules/organizations/organizations.service.ts#44-86) (or deprecate it for invitations) — it can still exist for "direct add" if the user _is_ already registered.

2. **`OrganizationsController`**
   - New `inviteMember` endpoint which accepts email and role.

3. **Signup / Auth Hook**
   - After a new user registers (`user` table insert), check for any `pending` invites for their email.
   - If found, automatically create `organizationMemberships` records for them and mark invites as `accepted`.

## Verification Plan

### Automated Tests

- Integration tests for `inviteMember` to ensure it only allows admins to invite.
- Integration tests for the signup flow to verify that pending invites are processed correctly.

### Manual Verification

1. As an admin, invite an email that doesn't exist.
2. Sign up with that email.
3. Verify the user is automatically added to the organization with the correct role.
