import type { Context } from 'hono';
import type { z } from 'zod';

export async function parseJson<T>(c: Context, schema: z.ZodSchema<T>): Promise<T> {
  const body = await c.req.json().catch(() => undefined);
  const parsed = schema.safeParse(body ?? {});
  if (!parsed.success) {
    throw parsed.error;
  }
  return parsed.data;
}

export function parseParams<T>(c: Context, schema: z.ZodSchema<T>): T {
  const parsed = schema.safeParse(c.req.param());
  if (!parsed.success) {
    throw parsed.error;
  }
  return parsed.data;
}

export function parseQuery<T>(c: Context, schema: z.ZodSchema<T>): T {
  const parsed = schema.safeParse(c.req.query());
  if (!parsed.success) {
    throw parsed.error;
  }
  return parsed.data;
}
