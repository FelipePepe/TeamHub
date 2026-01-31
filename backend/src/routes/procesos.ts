import type { HonoEnv } from '../types/hono.js';
import { Hono } from 'hono';
import { registerProcesosRoutes } from './procesos/handlers.js';

export const procesosRoutes = new Hono<HonoEnv>();

registerProcesosRoutes(procesosRoutes);
