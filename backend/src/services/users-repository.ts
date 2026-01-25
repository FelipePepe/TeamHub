import { and, eq, isNull, sql } from 'drizzle-orm';
import { db } from '../db';
import { users, type NewUser, type User } from '../db/schema/users';

export const countUsers = async () => {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(users);
  return Number(result[0]?.count ?? 0);
};

export const findUserByEmail = async (email: string) => {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return result[0] ?? null;
};

export const findUserById = async (id: string) => {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);
  return result[0] ?? null;
};

export const findActiveUserById = async (id: string) => {
  const result = await db
    .select()
    .from(users)
    .where(and(eq(users.id, id), isNull(users.deletedAt)))
    .limit(1);
  return result[0] ?? null;
};

export const createUser = async (payload: NewUser) => {
  const result = await db.insert(users).values(payload).returning();
  return result[0] ?? null;
};

export const updateUserById = async (id: string, payload: Partial<User>) => {
  const result = await db
    .update(users)
    .set(payload)
    .where(eq(users.id, id))
    .returning();
  return result[0] ?? null;
};
