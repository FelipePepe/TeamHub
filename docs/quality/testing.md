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
- Pendiente de implementar (no existe carpeta `frontend/e2e/`).

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
