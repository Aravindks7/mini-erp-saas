# API Testing Guide with Bruno

This guide outlines the professional, dependency-ordered approach to testing the ERP SaaS API using the [Bruno API Client](https://www.usebruno.com/).

## 🏗️ Architectural Overview

The API follows a multi-tenant architecture with Row-Level Security (RLS).

- **Authentication**: Handled by `Better Auth` (cookie-based).
- **Tenant Isolation**: Controlled via the `x-organization-id` header.
- **Dependency Flow**: User Auth ➔ Organization Context ➔ Business Modules (Customers).

---

## 1. Environment Setup

Create a new Environment in Bruno (e.g., `Development`) and define the following variables:

| Variable     | Value                   | Description                                           |
| :----------- | :---------------------- | :---------------------------------------------------- |
| `baseUrl`    | `http://localhost:3000` | Local server endpoint                                 |
| `orgId`      | _(Captured later)_      | The active Organization ID                            |
| `customerId` | _(Captured later)_      | ID of a created customer for testing GET/PATCH/DELETE |

---

## 2. Testing Sequence (Dependency Order)

### Step 1: Authentication

Better Auth uses cookies for session management. Bruno handles cookies automatically across requests in the same collection.

#### A. Initial Sign-Up

- **Method**: `POST`
- **URL**: `{{baseUrl}}/api/auth/sign-up/email`
- **Body (JSON)**:
  ```json
  {
    "email": "admin@example.com",
    "password": "Password123!",
    "name": "Admin User"
  }
  ```

#### B. Sign-In (If session expired)

- **Method**: `POST`
- **URL**: `{{baseUrl}}/api/auth/sign-in/email`
- **Body (JSON)**: same as above.

#### C. Verify Session

- **Method**: `GET`
- **URL**: `{{baseUrl}}/api/auth/get-session`

---

### Step 2: Organization Context

You cannot access business modules (like Customers) without an organization.

#### A. Create Organization

- **Method**: `POST`
- **URL**: `{{baseUrl}}/organizations`
- **Body (JSON)**:
  ```json
  {
    "name": "Acme Corp",
    "slug": "acme-corp"
  }
  ```
- **Bruno automation (Scripting)**:
  Add this to the **Post-response** tab to automatically update your environment variable:
  ```javascript
  const data = res.getBody();
  if (data && data.id) {
    bru.setEnvVar('orgId', data.id);
  }
  ```

#### B. List Organizations

- **Method**: `GET`
- **URL**: `{{baseUrl}}/organizations`

#### C. Invite Member (Admin only)

- **Method**: `POST`
- **URL**: `{{baseUrl}}/organizations/{{orgId}}/invites`
- **Body (JSON)**:
  ```json
  {
    "userEmail": "employee@example.com",
    "role": "employee"
  }
  ```
- **Scenario**: If the user already exists, they are added directly. If not, a pending invitation is created.

#### D. Accept Invitation (Sign-Up as Employee)

- **Method**: `POST`
- **URL**: `{{baseUrl}}/api/auth/sign-up/email`
- **Description**: Sign up using the _same_ email that was invited.
- **Body (JSON)**:
  ```json
  {
    "email": "employee@example.com",
    "password": "Password123!",
    "name": "Employee User"
  }
  ```
- **Validation**: After sign-up, call `GET /organizations` to verify the user is automatically a member of the organization with the `employee` role.

---

### Step 3: Business Logic (e.g., Customers)

All business routes **REQUIRE** the `x-organization-id` header.

#### A. Create Customer

- **Method**: `POST`
- **URL**: `{{baseUrl}}/customers`
- **Headers**:
  - `x-organization-id`: `{{orgId}}`
- **Body (JSON)**:
  ```json
  {
    "firstName": "John",
    "lastName": "Doe",
    "companyName": "Tech Solutions",
    "email": "john@tech.com",
    "status": "active"
  }
  ```
- **Bruno automation**:
  Add this to the **Post-response** tab:
  ```javascript
  const data = res.getBody();
  if (data && data.id) {
    bru.setEnvVar('customerId', data.id);
  }
  ```

#### B. List All Customers

- **Method**: `GET`
- **URL**: `{{baseUrl}}/customers`
- **Headers**:
  - `x-organization-id`: `{{orgId}}`

#### C. Get Customer by ID

- **Method**: `GET`
- **URL**: `{{baseUrl}}/customers/{{customerId}}`
- **Headers**:
  - `x-organization-id`: `{{orgId}}`

---

## 🛡️ Edge Cases to Test

1.  **Missing Header**: Call `GET /customers` without the `x-organization-id`. (Expected: `400 Bad Request`).
2.  **Wrong Tenant**: Use a valid `orgId` that doesn't belong to your user. (Expected: `403 Forbidden`).
3.  **No Session**: Delete your Bruno cookies and try to call `/organizations`. (Expected: `401 Unauthorized`).
4.  **RBAC Verification**: Try to `DELETE` a customer with a user who has only 'employee' role. (Expected: `403 Forbidden`).
5.  **Multi-Tenant Isolation**: Ensure that an invited employee in `Org A` cannot access `Org B`'s data. (Expected: `403 Forbidden`).

---

## 💡 Pro Tip: Collection-Level Headers

Instead of adding `x-organization-id` to every request manually, select your Collection folder in Bruno, go to the **Headers** tab, and add:

- Key: `x-organization-id`
- Value: `{{orgId}}`

This will inject the header into every request within that folder automatically.
