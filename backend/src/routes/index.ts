import { Hono } from 'hono';
import { authRoutes } from './auth.js';
import { usuariosRoutes } from './usuarios.js';
import { departamentosRoutes } from './departamentos.js';
import { plantillasRoutes } from './plantillas.js';
import { procesosRoutes } from './procesos.js';
import { proyectosRoutes } from './proyectos.js';
import { timetrackingRoutes } from './timetracking.js';
import { dashboardRoutes } from './dashboard.js';

export const apiRoutes = new Hono();

apiRoutes.route('/auth', authRoutes);
apiRoutes.route('/usuarios', usuariosRoutes);
apiRoutes.route('/departamentos', departamentosRoutes);
apiRoutes.route('/plantillas', plantillasRoutes);
apiRoutes.route('/procesos', procesosRoutes);
apiRoutes.route('/proyectos', proyectosRoutes);
apiRoutes.route('/timetracking', timetrackingRoutes);
apiRoutes.route('/dashboard', dashboardRoutes);
