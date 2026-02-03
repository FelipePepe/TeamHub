# Testing y calidad

Documento base para la estrategia de pruebas y controles de calidad de TeamHub.

## Objetivo
- Asegurar el comportamiento correcto de flujos criticos (auth, onboarding, timetracking).
- Reducir regresiones y fallos en despliegue.

## Alcance
- Backend: servicios, rutas y middleware.
- Frontend: hooks, componentes y vistas.
- E2E: flujos clave por rol.

## Tipos de pruebas

### Unitarias / Integracion
- Backend: Vitest 3.x con pruebas de servicios y rutas via `app.request`.
- Frontend: Vitest 3.x + Testing Library para hooks y componentes (React 19).
- Ubicacion:
  - `backend/src/__tests__/`
  - `frontend/src/**/__tests__/`

### E2E
- Playwright en `frontend/e2e/`. **Ejecutar con** `cd frontend && npm run e2e` **o** `npm run test:e2e` (no usar `npm test e2e`, que invoca Vitest con filtro y no encuentra tests). Requiere frontend en http://localhost:3000 (o PLAYWRIGHT_BASE_URL).
- **Para que pasen los tests CRUD (departamentos):** ejecuta **`npm run e2e:auth`** desde `frontend/`. Ese script hace login por API (con MFA si aplica), obtiene los tokens y lanza Playwright con `E2E_ACCESS_TOKEN` y `E2E_REFRESH_TOKEN` en el entorno. Requiere: (1) backend en marcha, (2) credenciales en `frontend/.env.e2e` (E2E_USER, E2E_PASSWORD, y E2E_MFA_SECRET si tienes MFA), (3) `NEXT_PUBLIC_API_HMAC_SECRET` en frontend igual que `API_HMAC_SECRET` en backend.
- **MFA:** si tu usuario tiene MFA activo y no tienes `E2E_MFA_SECRET` en `.env.e2e`, al ejecutar los E2E en una **terminal interactiva** se te pedirá el código de 6 dígitos de tu app; introdúcelo y el test seguirá. Si usas el prompt y hay varios workers, ejecuta con un solo worker: `npm run test:e2e -- --workers=1`. En CI o sin TTY, define `E2E_MFA_SECRET` o los tests fallarán al pedir MFA.
- **Si no tienes E2E_MFA_SECRET** (habitual si ya activaste MFA y no guardaste el código manual): no hace falta. Ejecuta los E2E en una **terminal interactiva** con `npm run test:e2e -- --workers=1`; cuando pida "Código MFA (6 dígitos de tu app):", abre tu app de autenticación (Google Authenticator, etc.), copia el código de 6 dígitos, pégalo en la terminal y pulsa Enter. El test continuará.
- **Dónde obtener E2E_MFA_SECRET** (opcional): es el código manual en base32 que TeamHub muestra **solo una vez** al configurar MFA. Si no lo guardaste, no se puede recuperar; usa la opción anterior (introducir el código de 6 dígitos cuando lo pida el test).
- El archivo `.env.e2e` está en `.gitignore`; no se sube al repo.
- Si el login por API falla (401 o 429), los tests CRUD se omiten con un mensaje indicando que configures seed y HMAC.
- **Si recibes 401 "No autorizado" en login:** (1) En `frontend/.env` o `.env.e2e`, `NEXT_PUBLIC_API_HMAC_SECRET` debe ser **exactamente igual** que `API_HMAC_SECRET` en `backend/.env`. (2) Comprueba que `E2E_USER` y `E2E_PASSWORD` en `frontend/.env.e2e` existen en la BD y la contraseña es correcta.
- **Comprobar configuración antes de E2E:** desde `frontend/` ejecuta `npm run e2e:check-auth`. Requiere backend en marcha; comprueba HMAC, credenciales y hace un login de prueba. Si falla, indica qué revisar.

### Contrato API
- Validacion de `openapi.yaml` con `scripts/validate-openapi.sh`.

## Objetivos de cobertura
- 100/80/0:
  - 100%: logica critica (auth, reglas de negocio, calculos).
  - 80%: features visibles para usuarios.
  - 0%: tipos/constantes/infrastructura.

### Metricas y umbrales recomendados
- Lines/Statements: >= 80% en modulos de negocio.
- Branches: >= 70% en rutas y validaciones.
- Excepciones: infraestructura, tipos y capas de integracion externa.

## Datos de prueba
- Seed admin (usa variables de entorno).
- Fixtures para casos de error y edge cases.

## Calidad (gates)
- Lint + type-check + tests en CI.
- Hook `pre-push` con validacion OpenAPI y checks por paquete.

## Lista minima de pruebas
- Auth: login, MFA, reset password, bloqueo/desbloqueo.
- Usuarios: CRUD, filtros, soft delete.
- Onboarding: crear plantilla, iniciar proceso, completar tarea.
- Proyectos: CRUD, asignaciones, validacion de dedicacion.
- Timetracking: crear/editar, aprobacion, limite diario.

## Casos negativos recomendados

### Auth
- Credenciales invalidas -> error generico.
- MFA invalido o expirado -> rechazo sin filtrar existencia.
- Reset password con token invalido/expirado.
- Login con cuenta bloqueada (30 min) y desbloqueo manual por ADMIN.

### Usuarios
- Email duplicado en alta/edicion.
- Cambio de password con politica invalida.
- Acceso a endpoints sin rol (403).

### Departamentos
- Codigo duplicado.
- Eliminacion con empleados activos (validar soft delete o bloqueo).

### Onboarding
- Crear proceso con plantilla inexistente.
- Completar tarea sin permisos de responsable.
- Rechazo de tarea sin comentario cuando es requerido.

### Proyectos y asignaciones
- Crear proyecto sin codigo.
- Asignacion supera 100% de dedicacion.
- Modificacion de proyecto cancelado/completado.

### Timetracking
- Crear registro en fecha futura.
- Horas diarias > 14.
- Editar/eliminar cuando estado != PENDIENTE.
- Aprobar/rechazar sin permisos de MANAGER.

## Cobertura de flujos E2E
- Verificar paths negativos por rol (403/401).
- Validar mensajes genericos en UI y detalle en logs.

## Ejemplos de tests negativos

### Backend (Vitest)
```typescript
import { describe, it, expect } from 'vitest';
import app from '../../src/index';

describe('Auth - login invalid', () => {
  it('returns 401 with generic message', async () => {
    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nope@teamhub.com', password: 'BadPass123!' }),
    });

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });
});
```

### Frontend (Testing Library)
```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '@/components/forms/LoginForm';

it('shows generic error on invalid login', async () => {
  render(<LoginForm />);
  await userEvent.type(screen.getByPlaceholderText('Email'), 'bad@teamhub.com');
  await userEvent.type(screen.getByPlaceholderText('Contraseña'), 'Wrong123!');
  await userEvent.click(screen.getByRole('button', { name: /iniciar/i }));

  expect(await screen.findByText(/error/i)).toBeInTheDocument();
});
```

### E2E (Playwright)
```ts
import { test, expect } from '@playwright/test';

test('blocks editing approved timetracking', async ({ page }) => {
  await page.goto('/timetracking');
  await page.getByText('APROBADO').first().click();
  await expect(page.getByRole('button', { name: /editar/i })).toBeDisabled();
});
```
