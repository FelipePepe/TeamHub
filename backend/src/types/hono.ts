import type { User } from '../db/schema/users.js';

/**
 * Hono context variables type definitions.
 * Extends Hono's context to provide type-safe access to custom variables.
 */
export interface HonoVariables {
  user: User;
}

/**
 * Environment bindings for Hono.
 * Add any environment-specific bindings here.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface HonoBindings {}

/**
 * Combined Hono environment type.
 */
export interface HonoEnv {
  Variables: HonoVariables;
  Bindings: HonoBindings;
}
