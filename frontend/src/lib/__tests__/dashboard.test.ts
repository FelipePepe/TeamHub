import { describe, it, expect, vi } from 'vitest';
import {
  getAdminDashboard,
  getRRHHDashboard,
  getManagerDashboard,
  getEmpleadoDashboard,
  getDashboardEndpointForRole,
} from '../dashboard';

const getMock = vi.fn();
vi.mock('../api', () => ({ get: (...args: unknown[]) => getMock(...args) }));

describe('lib/dashboard', () => {
  it('llama endpoints correctos', async () => {
    getMock.mockResolvedValue({});
    await getAdminDashboard();
    await getRRHHDashboard();
    await getManagerDashboard();
    await getEmpleadoDashboard();

    expect(getMock).toHaveBeenCalledWith('/dashboard/admin');
    expect(getMock).toHaveBeenCalledWith('/dashboard/rrhh');
    expect(getMock).toHaveBeenCalledWith('/dashboard/manager');
    expect(getMock).toHaveBeenCalledWith('/dashboard/empleado');
  });

  it('resuelve endpoint por rol', () => {
    expect(getDashboardEndpointForRole('ADMIN')).toBe(getAdminDashboard);
    expect(getDashboardEndpointForRole('RRHH')).toBe(getRRHHDashboard);
    expect(getDashboardEndpointForRole('MANAGER')).toBe(getManagerDashboard);
    expect(getDashboardEndpointForRole('EMPLEADO')).toBe(getEmpleadoDashboard);
  });
});
