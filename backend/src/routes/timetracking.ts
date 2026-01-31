import type { HonoEnv } from '../types/hono.js';
import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { registerTimetrackingRoutes } from './timetracking/handlers.js';

export const timetrackingRoutes = new Hono<HonoEnv>();

timetrackingRoutes.use('*', authMiddleware);
registerTimetrackingRoutes(timetrackingRoutes);
