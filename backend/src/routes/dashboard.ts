import type { HonoEnv } from '../types/hono.js';
import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import type { User } from '../db/schema/users.js';
import { buildAdminDashboardResponse } from './dashboard/admin.js';
import { buildEmpleadoDashboardResponse } from './dashboard/empleado.js';
import { buildManagerDashboardResponse } from './dashboard/manager.js';
import { buildRrhhDashboardResponse } from './dashboard/rrhh.js';

export const dashboardRoutes = new Hono<HonoEnv>();

dashboardRoutes.use('*', authMiddleware);

dashboardRoutes.get('/admin', async (c) => {
  return c.json(await buildAdminDashboardResponse());
});

dashboardRoutes.get('/rrhh', async (c) => {
  return c.json(await buildRrhhDashboardResponse());
});

dashboardRoutes.get('/manager', async (c) => {
  const user = c.get('user') as User;
  return c.json(await buildManagerDashboardResponse(user));
});

dashboardRoutes.get('/empleado', async (c) => {
  const user = c.get('user') as User;
  return c.json(await buildEmpleadoDashboardResponse(user));
});
