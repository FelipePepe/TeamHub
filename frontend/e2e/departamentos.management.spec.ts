import { expect, test } from '@playwright/test';

import {
  applySession,
  getAdminTokens,
  getAuthApiHelper,
  type AuthTokens,
} from './helpers/e2e-session';

interface DepartamentoResponse {
  id: string;
  nombre: string;
  codigo: string;
  activo: boolean;
}

interface DepartamentoListResponse {
  data: DepartamentoResponse[];
}

function uniqueSuffix() {
  return `${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

async function createDepartamento(
  tokens: AuthTokens,
  data: { nombre: string; codigo: string; descripcion?: string }
): Promise<DepartamentoResponse> {
  const authHelper = await getAuthApiHelper();
  return authHelper.apiRequest<DepartamentoResponse>(
    'POST',
    '/departamentos',
    data,
    tokens.accessToken
  );
}

async function listDepartamentosBySearch(
  tokens: AuthTokens,
  search: string,
  activo: boolean
): Promise<DepartamentoResponse[]> {
  const authHelper = await getAuthApiHelper();
  const response = await authHelper.apiRequest<DepartamentoListResponse>(
    'GET',
    `/departamentos?search=${encodeURIComponent(search)}&activo=${activo ? 'true' : 'false'}`,
    undefined,
    tokens.accessToken
  );
  return response.data;
}

test.describe('Bloque B - Departamentos management', () => {
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(120000);
  let adminTokens: AuthTokens | null = null;
  let setupError: string | null = null;

  test.beforeAll(async () => {
    try {
      adminTokens = await getAdminTokens();
    } catch (error) {
      setupError = `No se pudo obtener sesión admin: ${(error as Error).message}`;
    }
  });

  test.beforeEach(async ({ page }) => {
    if (!adminTokens || setupError) {
      throw new Error(setupError ?? 'Sin sesión admin inicializada');
    }

    await applySession(page, adminTokens, '/admin/departamentos');
    await expect(page).toHaveURL(/\/admin\/departamentos/, { timeout: 10000 });
  });

  test('E2E-DEP-003: editar departamento existente', async ({ page }) => {
    if (!adminTokens || setupError) {
      throw new Error(setupError ?? 'Sin sesión admin inicializada');
    }

    const suffix = uniqueSuffix();
    const originalCode = `EDT${suffix.slice(-6)}`;
    const created = await createDepartamento(adminTokens, {
      nombre: `E2E Edit ${suffix}`,
      codigo: originalCode,
      descripcion: 'Departamento para edición E2E',
    });

    const updatedName = `E2E Edit Updated ${suffix}`;
    const updatedCode = `UPD${suffix.slice(-6)}`;

    await page.getByPlaceholder(/buscar por nombre o código/i).fill(originalCode);
    await expect(page.getByText(created.nombre)).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: /^editar$/i }).first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText(/editar departamento/i)).toBeVisible({ timeout: 5000 });
    await dialog.getByLabel(/nombre/i).fill(updatedName);
    await dialog.getByLabel(/código/i).fill(updatedCode);
    await dialog.getByRole('button', { name: /^actualizar$/i }).click();

    await page.getByPlaceholder(/buscar por nombre o código/i).fill(updatedCode);
    await expect(page.getByText(updatedName)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(updatedCode)).toBeVisible({ timeout: 5000 });
  });

  test('E2E-DEP-004: no permite duplicar código de departamento', async ({ page }) => {
    if (!adminTokens || setupError) {
      throw new Error(setupError ?? 'Sin sesión admin inicializada');
    }

    const suffix = uniqueSuffix();
    const duplicateCode = `DUP${suffix.slice(-6)}`;
    await createDepartamento(adminTokens, {
      nombre: `E2E Base ${suffix}`,
      codigo: duplicateCode,
    });

    await page.getByRole('button', { name: /crear departamento/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText(/crear departamento/i)).toBeVisible({ timeout: 5000 });
    await dialog.getByLabel(/nombre/i).fill(`E2E Dup ${suffix}`);
    await dialog.getByLabel(/código/i).fill(duplicateCode);
    await dialog.getByRole('button', { name: /^crear$/i }).click();

    await expect(dialog).toBeVisible({ timeout: 5000 });
    const found = await listDepartamentosBySearch(adminTokens, duplicateCode, true);
    expect(found).toHaveLength(1);
    await dialog.getByRole('button', { name: /cancelar/i }).click();
  });

  test('E2E-DEP-005: soft delete y filtro activo/inactivo', async ({ page }) => {
    if (!adminTokens || setupError) {
      throw new Error(setupError ?? 'Sin sesión admin inicializada');
    }

    const suffix = uniqueSuffix();
    const code = `DEL${suffix.slice(-6)}`;
    const created = await createDepartamento(adminTokens, {
      nombre: `E2E Delete ${suffix}`,
      codigo: code,
    });

    await page.getByPlaceholder(/buscar por nombre o código/i).fill(code);
    await expect(page.getByText(created.nombre)).toBeVisible({ timeout: 10000 });
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: /^eliminar$/i }).first().click();

    await expect(page.getByText(created.nombre)).toHaveCount(0, { timeout: 10000 });
    await page.getByRole('button', { name: /^inactivos$/i }).click();
    await page.getByPlaceholder(/buscar por nombre o código/i).fill(code);
    await expect(page.getByText(created.nombre)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Inactivo', { exact: true })).toBeVisible({ timeout: 10000 });

    const activeRecords = await listDepartamentosBySearch(adminTokens, code, true);
    const inactiveRecords = await listDepartamentosBySearch(adminTokens, code, false);
    expect(activeRecords).toHaveLength(0);
    expect(inactiveRecords.some((department) => department.id === created.id)).toBe(true);
  });
});
