import { expect, test } from '@playwright/test';

import {
  getAdminTokens,
  getAuthApiHelper,
  getRetryAfterSecondsFromError,
  getStatusCodeFromError,
  type AuthTokens,
} from './helpers/e2e-session';

interface LoginResponse {
  mfaToken?: string;
  passwordChangeRequired?: boolean;
}

function uniqueSuffix() {
  return `${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

async function loginWithExpectedStatus(
  email: string,
  password: string,
  expectedStatus: number
): Promise<LoginResponse | null> {
  const authHelper = await getAuthApiHelper();

  for (;;) {
    try {
      const response = await authHelper.apiRequest<LoginResponse>('POST', '/auth/login', {
        email,
        password,
      });
      if (expectedStatus !== 200) {
        throw new Error(`Se esperaba status ${expectedStatus} y se obtuvo 200`);
      }
      return response;
    } catch (error) {
      const status = getStatusCodeFromError(error);
      if (status === 429) {
        const retryAfterSeconds = getRetryAfterSecondsFromError(error);
        await new Promise((resolve) => setTimeout(resolve, (retryAfterSeconds + 1) * 1000));
        continue;
      }
      if (status !== expectedStatus) {
        throw error;
      }
      return null;
    }
  }
}

test.describe('Bloque B - Auth', () => {
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

  test('E2E-AUTH-004: cuenta bloqueada tras 3 intentos fallidos y desbloqueo ADMIN', async () => {
    if (!adminTokens || setupError) {
      throw new Error(setupError ?? 'Sin sesión admin inicializada');
    }

    const authHelper = await getAuthApiHelper();
    const suffix = uniqueSuffix();
    const email = `e2e.lock.${suffix}@example.com`;
    const password = `LockPass!${suffix}Aa`;
    const wrongPassword = `Wrong!${suffix}Aa`;

    const createdUser = await authHelper.apiRequest<{ id: string }>(
      'POST',
      '/usuarios',
      {
        email,
        password,
        nombre: 'E2E',
        apellidos: 'Lockout',
        rol: 'EMPLEADO',
      },
      adminTokens.accessToken
    );

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      await loginWithExpectedStatus(email, wrongPassword, 401);
    }

    await loginWithExpectedStatus(email, password, 401);

    const unlockResponse = await authHelper.apiRequest<{ message: string }>(
      'PATCH',
      `/usuarios/${createdUser.id}/unlock`,
      {},
      adminTokens.accessToken
    );
    expect(unlockResponse.message).toMatch(/desbloqueado/i);
  });
});
