import type { Context } from 'hono';
import type { z } from 'zod';

export async function parseJson<T extends z.ZodTypeAny>(
  c: Context,
  schema: T
): Promise<z.output<T>> {
  const body = await c.req.json().catch(() => undefined);
  const parsed = schema.safeParse(body ?? {});
  if (!parsed.success) {
    throw parsed.error;
  }
  return parsed.data;
}

export function parseParams<T extends z.ZodTypeAny>(c: Context, schema: T): z.output<T> {
  const parsed = schema.safeParse(c.req.param());
  if (!parsed.success) {
    throw parsed.error;
  }
  return parsed.data;
}

export function parseQuery<T extends z.ZodTypeAny>(c: Context, schema: T): z.output<T> {
  const parsed = schema.safeParse(c.req.query());
  if (!parsed.success) {
    throw parsed.error;
  }
  return parsed.data;
}
