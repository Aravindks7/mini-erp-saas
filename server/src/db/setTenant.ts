import { sql } from 'drizzle-orm';
import { db } from './index';

export async function setTenant(organizationId: string) {
  await db.execute(sql`SELECT set_config('app.current_organization_id', ${organizationId}, true)`);
}
