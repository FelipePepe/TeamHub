import { describe, it, expect } from 'vitest';
import { getNavigationForRole, isNavItemActive, navigationItems } from '../navigation';

describe('navigation', () => {
  describe('navigationItems', () => {
    it('has dashboard available to all roles', () => {
      const dashboard = navigationItems.find((item) => item.href === '/dashboard');
      expect(dashboard).toBeDefined();
      expect(dashboard?.roles).toContain('ADMIN');
      expect(dashboard?.roles).toContain('RRHH');
      expect(dashboard?.roles).toContain('MANAGER');
      expect(dashboard?.roles).toContain('EMPLEADO');
    });

    it('has admin routes restricted', () => {
      const empleados = navigationItems.find((item) => item.href === '/admin/empleados');
      expect(empleados).toBeDefined();
      expect(empleados?.roles).toContain('ADMIN');
      expect(empleados?.roles).toContain('RRHH');
      expect(empleados?.roles).not.toContain('MANAGER');
      expect(empleados?.roles).not.toContain('EMPLEADO');
    });
  });

  describe('getNavigationForRole', () => {
    it('returns all items for ADMIN', () => {
      const items = getNavigationForRole('ADMIN');
      expect(items.length).toBeGreaterThan(0);
      expect(items.some((item) => item.href === '/admin/configuracion')).toBe(true);
    });

    it('returns limited items for EMPLEADO', () => {
      const items = getNavigationForRole('EMPLEADO');
      expect(items.some((item) => item.href === '/dashboard')).toBe(true);
      expect(items.some((item) => item.href === '/admin/empleados')).toBe(false);
      expect(items.some((item) => item.href === '/onboarding')).toBe(false);
    });

    it('returns items with onboarding for MANAGER', () => {
      const items = getNavigationForRole('MANAGER');
      expect(items.some((item) => item.href === '/onboarding')).toBe(true);
      expect(items.some((item) => item.href === '/admin/empleados')).toBe(false);
    });

    it('returns empty array for undefined role', () => {
      const items = getNavigationForRole(undefined);
      expect(items).toEqual([]);
    });
  });

  describe('isNavItemActive', () => {
    it('returns true for exact dashboard match', () => {
      expect(isNavItemActive('/dashboard', '/dashboard')).toBe(true);
    });

    it('returns false for dashboard when on subpath', () => {
      expect(isNavItemActive('/dashboard', '/dashboard/settings')).toBe(false);
    });

    it('returns true for prefix matches on other routes', () => {
      expect(isNavItemActive('/admin/empleados', '/admin/empleados')).toBe(true);
      expect(isNavItemActive('/admin/empleados', '/admin/empleados/123')).toBe(true);
    });

    it('returns false for non-matching routes', () => {
      expect(isNavItemActive('/proyectos', '/timetracking')).toBe(false);
    });
  });
});
