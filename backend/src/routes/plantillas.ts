import type { HonoEnv } from '../types/hono.js';
import { Hono } from 'hono';
import { registerPlantillasRoutes } from './plantillas/handlers.js';

export const plantillasRoutes = new Hono<HonoEnv>();

registerPlantillasRoutes(plantillasRoutes);
