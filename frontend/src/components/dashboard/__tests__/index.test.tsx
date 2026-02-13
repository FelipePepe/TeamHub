import { describe, it, expect } from 'vitest';
import {
  KpiCard,
  BarChart,
  LineChart,
  ActivityList,
  AlertList,
  AdminDashboard,
  RRHHDashboard,
  ManagerDashboard,
  EmpleadoDashboard,
} from '../index';

describe('dashboard/index exports', () => {
  it('exporta componentes de dashboard', () => {
    expect(KpiCard).toBeDefined();
    expect(BarChart).toBeDefined();
    expect(LineChart).toBeDefined();
    expect(ActivityList).toBeDefined();
    expect(AlertList).toBeDefined();
    expect(AdminDashboard).toBeDefined();
    expect(RRHHDashboard).toBeDefined();
    expect(ManagerDashboard).toBeDefined();
    expect(EmpleadoDashboard).toBeDefined();
  });
});
