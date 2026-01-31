import type { HonoEnv } from '../types/hono.js';
import { Hono } from 'hono';
import { registerProyectosRoutes } from './proyectos/handlers.js';

export const proyectosRoutes = new Hono<HonoEnv>();

registerProyectosRoutes(proyectosRoutes);
