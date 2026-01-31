import type { HonoEnv } from '../types/hono.js';
import { Hono } from 'hono';
import { registerAuthRoutes } from './auth/handlers.js';

export const authRoutes = new Hono<HonoEnv>();

registerAuthRoutes(authRoutes);
