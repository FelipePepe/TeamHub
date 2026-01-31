import type { HonoEnv } from '../types/hono.js';
import { Hono } from 'hono';
import { registerUsuariosRoutes } from './usuarios/handlers.js';

export const usuariosRoutes = new Hono<HonoEnv>();

registerUsuariosRoutes(usuariosRoutes);
