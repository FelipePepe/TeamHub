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
}

interface UserResponse {
  id: string;
  email: string;
}

interface UserListResponse {
  data: UserResponse[];
}

interface DepartamentoUsuariosResponse {
  data: UserResponse[];
}

function uniqueSuffix() {
  return `${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

async function createDepartamento(
  tokens: AuthTokens,
  data: { nombre: string; codigo: string }
): Promise<DepartamentoResponse> {
  const authHelper = await getAuthApiHelper();
  return authHelper.apiRequest<DepartamentoResponse>(
    'POST',
    '/departamentos',
    data,
    tokens.accessToken
  );
}

async function createUser(
  tokens: AuthTokens,
  data: {
    email: string;
    password: string;
    nombre: string;
    apellidos: string;
    rol: 'EMPLEADO' | 'MANAGER' | 'RRHH' | 'ADMIN';
    departamentoId?: string;
  }
) {
  const authHelper = await getAuthApiHelper();
  return authHelper.apiRequest<UserResponse>('POST', '/usuarios', data, tokens.accessToken);
}

async function listUsersBySearch(tokens: AuthTokens, search: string): Promise<UserResponse[]> {
  const authHelper = await getAuthApiHelper();
  const response = await authHelper.apiRequest<UserListResponse>(
    'GET',
    `/usuarios?search=${encodeURIComponent(search)}&page=1&limit=20`,
    undefined,
    tokens.accessToken
  );
  return response.data;
}

async function listDepartamentoUsers(
  tokens: AuthTokens,
  departamentoId: string
): Promise<UserResponse[]> {
  const authHelper = await getAuthApiHelper();
  const response = await authHelper.apiRequest<DepartamentoUsuariosResponse>(
    'GET',
    `/departamentos/${departamentoId}/empleados`,
    undefined,
    tokens.accessToken
  );
  return response.data;
}

test.describe('Bloque B - Usuarios', () => {
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

    await applySession(page, adminTokens, '/admin/empleados');
    await expect(page).toHaveURL(/\/admin\/empleados/, { timeout: 10000 });
  });

  test('E2E-USR-001: RRHH/ADMIN crea empleado con departamento', async ({ page }) => {
    if (!adminTokens || setupError) {
      throw new Error(setupError ?? 'Sin sesión admin inicializada');
    }

    const suffix = uniqueSuffix();
    const departamento = await createDepartamento(adminTokens, {
      nombre: `E2E USR Dept ${suffix}`,
      codigo: `UDEP${suffix.slice(-6)}`,
    });
    const email = `e2e.user.${suffix}@example.com`;

    await page.getByRole('button', { name: /crear empleado/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText(/crear nuevo empleado/i)).toBeVisible({ timeout: 5000 });
    await dialog.getByLabel(/email/i).fill(email);
    await dialog.getByLabel(/^nombre/i).fill('E2E');
    await dialog.getByLabel(/apellidos/i).fill('Usuario');

    const selects = dialog.getByRole('combobox');
    await selects.nth(1).click();
    await page.getByRole('option', { name: departamento.nombre }).click();

    await dialog.getByRole('button', { name: /crear empleado/i }).click();
    await expect(dialog).toHaveCount(0, { timeout: 10000 });

    await page.getByPlaceholder(/buscar por nombre o email/i).fill(email);
    await expect(page.getByText(email)).toBeVisible({ timeout: 10000 });

    const users = await listUsersBySearch(adminTokens, email);
    const createdUser = users.find((user) => user.email === email);
    expect(createdUser).toBeTruthy();
    const departamentoUsers = await listDepartamentoUsers(adminTokens, departamento.id);
    expect(departamentoUsers.some((user) => user.email === email)).toBe(true);
  });

  test('E2E-USR-002: no permite email duplicado en alta de empleado', async ({ page }) => {
    if (!adminTokens || setupError) {
      throw new Error(setupError ?? 'Sin sesión admin inicializada');
    }

    const suffix = uniqueSuffix();
    const email = `e2e.dup.${suffix}@example.com`;
    const password = `DupPass!${suffix}Aa`;

    await createUser(adminTokens, {
      email,
      password,
      nombre: 'E2E',
      apellidos: 'Original',
      rol: 'EMPLEADO',
    });

    await page.getByRole('button', { name: /crear empleado/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText(/crear nuevo empleado/i)).toBeVisible({ timeout: 5000 });
    await dialog.getByLabel(/email/i).fill(email);
    await dialog.getByLabel(/^nombre/i).fill('E2E');
    await dialog.getByLabel(/apellidos/i).fill('Duplicado');
    await dialog.getByRole('button', { name: /crear empleado/i }).click();

    await expect(dialog).toBeVisible({ timeout: 5000 });
    const users = await listUsersBySearch(adminTokens, email);
    expect(users.filter((user) => user.email === email)).toHaveLength(1);
    await dialog.getByRole('button', { name: /cancelar/i }).click();
  });
});
