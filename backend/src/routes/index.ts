import { Hono } from 'hono';
import type { HonoEnv } from '../types/hono.js';
import { authRoutes } from './auth.js';
import { usuariosRoutes } from './usuarios.js';
import { departamentosRoutes } from './departamentos.js';
import { plantillasRoutes } from './plantillas.js';
import { procesosRoutes } from './procesos.js';
import { proyectosRoutes } from './proyectos.js';
import { tareasRoutes } from './tareas.routes.js';
import { timetrackingRoutes } from './timetracking.js';
import { dashboardRoutes } from './dashboard.js';
import { registerErrorRoutes } from './errors.routes.js';

export const apiRoutes = new Hono<HonoEnv>();

// Error logging endpoint (sin autenticación para capturar errores de login)
const errorsRouter = new Hono<HonoEnv>();
registerErrorRoutes(errorsRouter);
apiRoutes.route('/errors', errorsRouter);

apiRoutes.route('/auth', authRoutes);
apiRoutes.route('/usuarios', usuariosRoutes);
apiRoutes.route('/departamentos', departamentosRoutes);
apiRoutes.route('/plantillas', plantillasRoutes);
apiRoutes.route('/procesos', procesosRoutes);
apiRoutes.route('/proyectos', proyectosRoutes);
apiRoutes.route('/', tareasRoutes);
apiRoutes.route('/timetracking', timetrackingRoutes);
apiRoutes.route('/dashboard', dashboardRoutes);

