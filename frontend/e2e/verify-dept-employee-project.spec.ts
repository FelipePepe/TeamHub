import { test, expect } from '@playwright/test';
import { applySession } from './helpers/e2e-session';

const E2E_USER = process.env.E2E_USER ?? '';
const E2E_PASSWORD = process.env.E2E_PASSWORD ?? '';

test.describe('Verificacion UI: Departamento → Empleado → Proyecto', () => {
  test('muestra asignacion del empleado en el proyecto', async ({ page }) => {
    if (!E2E_USER || !E2E_PASSWORD) {
      throw new Error('Faltan E2E_USER/E2E_PASSWORD en frontend/.env.e2e');
    }

    const suffix = Date.now();
    const { apiRequest, loginViaApi } = await import('./helpers/auth-api.mjs');
    const tokens = await loginViaApi(E2E_USER, E2E_PASSWORD);

    const departamento = await apiRequest<{ id: string }>(
      'POST',
      '/departamentos',
      {
        nombre: `QA Dept ${suffix}`,
        codigo: `QA${String(suffix).slice(-4)}`,
        descripcion: 'Depto QA UI',
      },
      tokens.accessToken
    );

    const usuario = await apiRequest<{ id: string }>(
      'POST',
      '/usuarios',
      {
        email: `qa.employee.${suffix}@example.com`,
        password: `InitPass!${suffix}Aa`,
        nombre: 'QA',
        apellidos: 'Empleado',
        rol: 'EMPLEADO',
        departamentoId: departamento.id,
      },
      tokens.accessToken
    );

    const deptEmployees = await apiRequest<{ data: Array<{ id: string }> }>(
      'GET',
      `/departamentos/${departamento.id}/empleados`,
      undefined,
      tokens.accessToken
    );
    const isEmployeeInDept = deptEmployees.data.some((u) => u.id === usuario.id);
    expect(isEmployeeInDept).toBeTruthy();

    const proyecto = await apiRequest<{ id: string }>(
      'POST',
      '/proyectos',
      {
        nombre: `QA Proyecto ${suffix}`,
        codigo: `QAP${String(suffix).slice(-4)}`,
        cliente: 'QA',
      },
      tokens.accessToken
    );

    const today = new Date().toISOString().slice(0, 10);
    await apiRequest(
      'POST',
      `/proyectos/${proyecto.id}/asignaciones`,
      {
        usuarioId: usuario.id,
        fechaInicio: today,
        rol: 'Developer',
        dedicacionPorcentaje: 100,
      },
      tokens.accessToken
    );

    await applySession(page, tokens, `/proyectos/${proyecto.id}`);
    await page.waitForLoadState('domcontentloaded');

    const userPrefix = usuario.id.slice(0, 8);
    await expect(page.getByText(new RegExp(userPrefix))).toBeVisible({ timeout: 10000 });
  });
});
