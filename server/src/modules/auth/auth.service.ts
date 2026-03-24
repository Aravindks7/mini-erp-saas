import bcrypt from 'bcrypt';
import { db } from '../../db';
import { organizations, users } from '../../db/schema';
import { generateToken } from '../../utils/jwt';

export async function registerUser(data: {
  organizationName: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) {
  const passwordHash = await bcrypt.hash(data.password, 10);
  const slug = data.organizationName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const [organization] = await db
    .insert(organizations)
    .values({ name: data.organizationName, slug })
    .returning();

  if (!organization) {
    throw new Error('Organization creation failed');
  }
  const [user] = await db
    .insert(users)
    .values({
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      role: 'admin',
      organizationId: organization.id,
    })
    .returning();

  if (!user) {
    throw new Error('User creation failed');
  }

  const token = generateToken({
    userId: user.id,
    organizationId: user.organizationId,
    role: user.role,
  });

  return { user, token };
}

export async function loginUser(email: string, password: string) {
  const user = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.email, email),
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);

  if (!valid) {
    throw new Error('Invalid credentials');
  }

  const token = generateToken({
    userId: user.id,
    organizationId: user.organizationId,
    role: user.role,
  });

  return { user, token };
}
