import 'dotenv/config';
import { db } from './index.js';

async function inspect() {
  console.log('--- RBAC INSPECTION ---');

  const allRoles = await db.query.roles.findMany({
    with: {
      permissionSets: {
        with: {
          permissionSet: {
            with: {
              items: true,
            },
          },
        },
      },
    },
  });

  console.log('Roles in DB:', JSON.stringify(allRoles, null, 2));

  const memberships = await db.query.organizationMemberships.findMany({
    with: {
      role: true,
      organization: true,
    },
  });

  console.log('Memberships in DB:', JSON.stringify(memberships, null, 2));

  process.exit(0);
}

inspect();
