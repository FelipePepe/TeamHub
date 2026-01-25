import { Hono } from 'hono';
import { authRoutes } from './auth';
import { usuariosRoutes } from './usuarios';
import { departamentosRoutes } from './departamentos';
import { plantillasRoutes } from './plantillas';
import { procesosRoutes } from './procesos';
import { proyectosRoutes } from './proyectos';
import { timetrackingRoutes } from './timetracking';
import { dashboardRoutes } from './dashboard';

export const apiRoutes = new Hono();

apiRoutes.route('/auth', authRoutes);
apiRoutes.route('/usuarios', usuariosRoutes);
apiRoutes.route('/departamentos', departamentosRoutes);
apiRoutes.route('/plantillas', plantillasRoutes);
apiRoutes.route('/procesos', procesosRoutes);
apiRoutes.route('/proyectos', proyectosRoutes);
apiRoutes.route('/timetracking', timetrackingRoutes);
apiRoutes.route('/dashboard', dashboardRoutes);
