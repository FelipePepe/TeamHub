# PROMPT: Demo Visual Completa de TeamHub con Playwright

## Objetivo

Implementar una demo automatizada de **todas las funcionalidades de TeamHub** usando Playwright, que:
- Grabe video en **1920x1080 Full HD**
- Genere **datos de prueba realistas** durante la ejecución
- **Verifique cada acción** con assertions y logs estructurados
- Muestre flujos **desde la perspectiva de cada rol** (ADMIN, RRHH, MANAGER, EMPLEADO)

---

## Archivo de Destino

`frontend/e2e/demo/complete-demo.spec.ts`

---

## Configuración de Playwright

Usa la configuración existente en `playwright.demo.config.ts`:
- `video: 'on'` - Grabar siempre
- `viewport: { width: 1920, height: 1080 }`
- `slowMo: 100` - Pausas para visualización humana
- `timeout: 300_000` - 5 minutos por test

---

## Estructura del Test

```typescript
import { test, expect } from '@playwright/test';
import {
  think, read, observe, moveTo, moveAndClick,
  typeNaturally, scrollTo, navigateTo, generateTotpCode
} from '../helpers/demo.helpers';
import { loginViaApiWithRetry, applySession, getAuthApiHelper } from '../helpers/e2e-session';

// ============================================
// GENERADOR DE DATOS DE DEMO
// ============================================
const DemoData = {
  timestamp: Date.now(),

  // Departamento nuevo
  departamento: {
    nombre: `Innovación Digital ${Date.now()}`,
    codigo: `INN-${Date.now().toString().slice(-6)}`,
    descripcion: 'Departamento creado en demo automatizada'
  },

  // Empleado nuevo para onboarding
  empleado: {
    nombre: 'María',
    apellido: 'García Demo',
    email: `maria.garcia.demo.${Date.now()}@teamhub.com`,
    dni: `12345678${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
    fechaNacimiento: '1995-06-15',
    fechaAlta: new Date().toISOString().split('T')[0],
    telefono: '612345678',
    direccion: 'Calle Demo 123, Madrid'
  },

  // Proyecto nuevo
  proyecto: {
    nombre: `App Móvil Demo ${Date.now().toString().slice(-4)}`,
    cliente: 'Cliente Demo Corp',
    descripcion: 'Proyecto de demostración automatizada',
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaFin: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    presupuestoHoras: 500
  },

  // Registro de tiempo
  timeEntry: {
    horas: 4,
    descripcion: 'Desarrollo de funcionalidad demo'
  }
};

// ============================================
// LOGGER ESTRUCTURADO PARA DEMO
// ============================================
class DemoLogger {
  private logs: Array<{ timestamp: string; level: string; action: string; result: string; data?: any }> = [];

  log(level: 'INFO' | 'SUCCESS' | 'ERROR' | 'STEP', action: string, result: string, data?: any) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      action,
      result,
      data
    };
    this.logs.push(entry);
    console.log(`[${level}] ${action}: ${result}`, data ? JSON.stringify(data) : '');
  }

  step(num: number, description: string) {
    this.log('STEP', `Paso ${num}`, description);
  }

  success(action: string, data?: any) {
    this.log('SUCCESS', action, 'OK', data);
  }

  error(action: string, error: string) {
    this.log('ERROR', action, error);
  }

  getSummary() {
    return {
      total: this.logs.length,
      success: this.logs.filter(l => l.level === 'SUCCESS').length,
      errors: this.logs.filter(l => l.level === 'ERROR').length,
      steps: this.logs.filter(l => l.level === 'STEP').length
    };
  }

  exportLogs() {
    return this.logs;
  }
}

// ============================================
// TEST PRINCIPAL: DEMO COMPLETA
// ============================================
test.describe('Demo Completa TeamHub - Todas las Funcionalidades', () => {
  let logger: DemoLogger;

  test.beforeEach(() => {
    logger = new DemoLogger();
  });

  test.afterEach(async ({}, testInfo) => {
    // Guardar logs al final del test
    const summary = logger.getSummary();
    console.log('\n========== RESUMEN DE DEMO ==========');
    console.log(`Total acciones: ${summary.total}`);
    console.log(`Exitosas: ${summary.success}`);
    console.log(`Errores: ${summary.errors}`);
    console.log(`Pasos completados: ${summary.steps}`);

    // Adjuntar logs al reporte
    await testInfo.attach('demo-logs.json', {
      body: JSON.stringify(logger.exportLogs(), null, 2),
      contentType: 'application/json'
    });
  });

  test('Flujo completo: ADMIN → RRHH → MANAGER → EMPLEADO', async ({ page }) => {

    // =====================================================
    // SECCIÓN 1: LOGIN Y AUTENTICACIÓN MFA (ADMIN)
    // =====================================================
    logger.step(1, 'Autenticación con MFA como ADMIN');

    await page.goto('/login');
    await observe(page);

    // Verificar que la página de login carga
    await expect(page.getByRole('heading', { name: /iniciar sesión/i })).toBeVisible();
    logger.success('Página de login visible');

    // Ingresar credenciales
    await moveAndClick(page, page.getByLabel(/email/i));
    await typeNaturally(page, process.env.E2E_USER || 'admin@teamhub.com');

    await moveAndClick(page, page.getByLabel(/contraseña/i));
    await typeNaturally(page, process.env.E2E_PASSWORD || 'Admin123!');

    await think(page);
    await moveAndClick(page, page.getByRole('button', { name: /entrar|iniciar/i }));

    // Esperar pantalla MFA
    await expect(page.getByText(/código de verificación|MFA|autenticador/i)).toBeVisible({ timeout: 10000 });
    logger.success('Pantalla MFA mostrada');

    // Generar y escribir código TOTP
    const totpCode = generateTotpCode(process.env.E2E_MFA_SECRET!);
    await moveAndClick(page, page.getByLabel(/código/i));
    await typeNaturally(page, totpCode);

    await moveAndClick(page, page.getByRole('button', { name: /verificar|confirmar/i }));

    // Verificar redirección al dashboard
    await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });
    logger.success('Login completado, dashboard visible');

    // =====================================================
    // SECCIÓN 2: DASHBOARD ADMIN
    // =====================================================
    logger.step(2, 'Explorar Dashboard de Administrador');

    await observe(page);

    // Verificar KPIs del dashboard admin
    const kpiCards = page.locator('[data-testid="kpi-card"], .stat-card, [class*="card"]').first();
    await expect(kpiCards).toBeVisible();
    logger.success('KPIs del dashboard visibles');

    // Capturar métricas actuales
    const activeUsers = await page.locator('text=/usuarios activos|empleados/i').first().textContent();
    logger.log('INFO', 'Métricas dashboard', 'Capturadas', { activeUsers });

    await read(page);

    // =====================================================
    // SECCIÓN 3: GESTIÓN DE DEPARTAMENTOS
    // =====================================================
    logger.step(3, 'Crear nuevo Departamento');

    await navigateTo(page, 'Departamentos');
    await expect(page).toHaveURL(/departamentos/);
    await observe(page);

    // Click en crear nuevo
    await moveAndClick(page, page.getByRole('button', { name: /nuevo|crear|añadir/i }));
    await expect(page.getByRole('dialog')).toBeVisible();

    // Rellenar formulario
    await moveAndClick(page, page.getByLabel(/nombre/i));
    await typeNaturally(page, DemoData.departamento.nombre);

    await moveAndClick(page, page.getByLabel(/código/i));
    await typeNaturally(page, DemoData.departamento.codigo);

    if (await page.getByLabel(/descripción/i).isVisible()) {
      await moveAndClick(page, page.getByLabel(/descripción/i));
      await typeNaturally(page, DemoData.departamento.descripcion);
    }

    await think(page);
    await moveAndClick(page, page.getByRole('button', { name: /guardar|crear/i }));

    // Verificar creación
    await expect(page.getByText(DemoData.departamento.nombre)).toBeVisible({ timeout: 5000 });
    logger.success('Departamento creado', DemoData.departamento);

    // =====================================================
    // SECCIÓN 4: GESTIÓN DE EMPLEADOS
    // =====================================================
    logger.step(4, 'Crear nuevo Empleado para Onboarding');

    await navigateTo(page, 'Empleados');
    await expect(page).toHaveURL(/empleados/);
    await observe(page);

    // Crear empleado
    await moveAndClick(page, page.getByRole('button', { name: /nuevo|crear|añadir/i }));

    // Rellenar datos del empleado
    await typeNaturally(page, DemoData.empleado.nombre, page.getByLabel(/nombre/i));
    await typeNaturally(page, DemoData.empleado.apellido, page.getByLabel(/apellido/i));
    await typeNaturally(page, DemoData.empleado.email, page.getByLabel(/email/i));
    await typeNaturally(page, DemoData.empleado.dni, page.getByLabel(/dni|documento/i));

    // Seleccionar departamento creado
    await moveAndClick(page, page.getByLabel(/departamento/i));
    await page.getByRole('option', { name: new RegExp(DemoData.departamento.nombre, 'i') }).click();

    await think(page);
    await moveAndClick(page, page.getByRole('button', { name: /guardar|crear/i }));

    // Verificar
    await expect(page.getByText(DemoData.empleado.email)).toBeVisible({ timeout: 5000 });
    logger.success('Empleado creado', DemoData.empleado);

    // =====================================================
    // SECCIÓN 5: PLANTILLAS DE ONBOARDING
    // =====================================================
    logger.step(5, 'Revisar Plantillas de Onboarding');

    await navigateTo(page, 'Plantillas');
    await expect(page).toHaveURL(/plantillas/);
    await observe(page);

    // Verificar que existen plantillas
    const plantillas = page.locator('[data-testid="plantilla-item"], .plantilla-card, tr').first();
    await expect(plantillas).toBeVisible();
    logger.success('Plantillas de onboarding listadas');

    // Click en una plantilla para ver detalles
    await moveAndClick(page, plantillas);
    await read(page);

    // =====================================================
    // SECCIÓN 6: INICIAR PROCESO DE ONBOARDING
    // =====================================================
    logger.step(6, 'Iniciar Proceso de Onboarding');

    await navigateTo(page, 'Onboarding');
    await expect(page).toHaveURL(/onboarding/);

    await moveAndClick(page, page.getByRole('button', { name: /iniciar|nuevo proceso/i }));

    // Seleccionar empleado y plantilla
    await moveAndClick(page, page.getByLabel(/empleado/i));
    await page.getByRole('option', { name: new RegExp(DemoData.empleado.nombre, 'i') }).click();

    await moveAndClick(page, page.getByLabel(/plantilla/i));
    await page.getByRole('option').first().click();

    await moveAndClick(page, page.getByRole('button', { name: /iniciar|crear/i }));

    // Verificar proceso creado
    await expect(page.getByText(/en curso|activo/i)).toBeVisible({ timeout: 5000 });
    logger.success('Proceso de onboarding iniciado');

    // =====================================================
    // SECCIÓN 7: GESTIÓN DE PROYECTOS
    // =====================================================
    logger.step(7, 'Crear Proyecto y Asignar Equipo');

    await navigateTo(page, 'Proyectos');
    await expect(page).toHaveURL(/proyectos/);
    await observe(page);

    // Crear proyecto
    await moveAndClick(page, page.getByRole('button', { name: /nuevo|crear/i }));

    await typeNaturally(page, DemoData.proyecto.nombre, page.getByLabel(/nombre/i));
    await typeNaturally(page, DemoData.proyecto.cliente, page.getByLabel(/cliente/i));
    await typeNaturally(page, DemoData.proyecto.descripcion, page.getByLabel(/descripción/i));

    await moveAndClick(page, page.getByRole('button', { name: /guardar|crear/i }));

    // Verificar proyecto creado
    await expect(page.getByText(DemoData.proyecto.nombre)).toBeVisible({ timeout: 5000 });
    logger.success('Proyecto creado', DemoData.proyecto);

    // Asignar empleado al proyecto
    await moveAndClick(page, page.getByText(DemoData.proyecto.nombre));
    await moveAndClick(page, page.getByRole('button', { name: /asignar|añadir miembro/i }));

    // Seleccionar empleado
    await moveAndClick(page, page.getByLabel(/empleado/i));
    await page.getByRole('option').first().click();

    await moveAndClick(page, page.getByRole('button', { name: /asignar|guardar/i }));
    logger.success('Empleado asignado al proyecto');

    // =====================================================
    // SECCIÓN 8: TIMETRACKING - REGISTRO DE HORAS
    // =====================================================
    logger.step(8, 'Timetracking: Weekly Timesheet');

    await navigateTo(page, 'Timetracking');
    await expect(page).toHaveURL(/timetracking/);
    await observe(page);

    // Navegar a Weekly Timesheet
    await moveAndClick(page, page.getByRole('tab', { name: /weekly|semanal/i }));
    await read(page);

    // Ver el grid de timesheet
    const timesheetGrid = page.locator('[data-testid="timesheet-grid"], .timesheet, table').first();
    await expect(timesheetGrid).toBeVisible();
    logger.success('Weekly Timesheet visible');

    // Navegar a Gantt Chart
    await moveAndClick(page, page.getByRole('tab', { name: /gantt/i }));
    await read(page);

    // Verificar visualización D3
    const ganttChart = page.locator('[data-testid="gantt-chart"], svg, .gantt').first();
    await expect(ganttChart).toBeVisible();
    logger.success('Gantt Chart renderizado');

    // =====================================================
    // SECCIÓN 9: MIS TAREAS (VISTA RESPONSABLE)
    // =====================================================
    logger.step(9, 'Ver Mis Tareas Asignadas');

    await navigateTo(page, 'Mis Tareas');
    await expect(page).toHaveURL(/mis-tareas/);
    await observe(page);

    // Verificar lista de tareas
    const tareasList = page.locator('[data-testid="tarea-item"], .tarea-card, li').first();
    if (await tareasList.isVisible()) {
      logger.success('Tareas asignadas visibles');

      // Completar una tarea
      await moveAndClick(page, tareasList);
      const completarBtn = page.getByRole('button', { name: /completar|marcar/i });
      if (await completarBtn.isVisible()) {
        await moveAndClick(page, completarBtn);
        logger.success('Tarea marcada como completada');
      }
    }

    // =====================================================
    // SECCIÓN 10: PERFIL DE USUARIO
    // =====================================================
    logger.step(10, 'Revisar Perfil de Usuario');

    // Click en avatar/menú usuario
    await moveAndClick(page, page.locator('[data-testid="user-nav"], .user-menu, [aria-label*="usuario"]').first());
    await moveAndClick(page, page.getByText(/perfil|mi cuenta/i));

    await expect(page).toHaveURL(/perfil/);
    await observe(page);

    // Verificar datos del perfil
    await expect(page.getByText(/admin/i)).toBeVisible();
    logger.success('Perfil de usuario visible');

    // =====================================================
    // SECCIÓN 11: CAMBIO DE ROL (Login como EMPLEADO)
    // =====================================================
    logger.step(11, 'Demostrar Vista de EMPLEADO');

    // Logout
    await moveAndClick(page, page.locator('[data-testid="user-nav"], .user-menu').first());
    await moveAndClick(page, page.getByText(/cerrar sesión|logout/i));

    await expect(page).toHaveURL(/login/);

    // Login como empleado
    await typeNaturally(page, process.env.E2E_EMPLOYEE_USER || 'empleado@teamhub.com', page.getByLabel(/email/i));
    await typeNaturally(page, process.env.E2E_EMPLOYEE_PASSWORD || 'Emp123!', page.getByLabel(/contraseña/i));
    await moveAndClick(page, page.getByRole('button', { name: /entrar/i }));

    // MFA empleado
    const totpEmpleado = generateTotpCode(process.env.E2E_EMPLOYEE_MFA_SECRET!);
    await typeNaturally(page, totpEmpleado, page.getByLabel(/código/i));
    await moveAndClick(page, page.getByRole('button', { name: /verificar/i }));

    await expect(page).toHaveURL(/dashboard/);
    logger.success('Login como EMPLEADO completado');

    // =====================================================
    // SECCIÓN 12: DASHBOARD EMPLEADO
    // =====================================================
    logger.step(12, 'Dashboard del Empleado');

    await observe(page);

    // Verificar KPIs de empleado (mi progreso, proyectos, etc.)
    await expect(page.getByText(/mi progreso|mis proyectos|mi dedicación/i).first()).toBeVisible();
    logger.success('Dashboard empleado con métricas personales');

    // =====================================================
    // SECCIÓN 13: REGISTRAR HORAS (EMPLEADO)
    // =====================================================
    logger.step(13, 'Empleado Registra Horas');

    await navigateTo(page, 'Timetracking');

    // Crear registro de tiempo
    await moveAndClick(page, page.getByRole('button', { name: /nuevo|registrar/i }));

    // Seleccionar proyecto
    await moveAndClick(page, page.getByLabel(/proyecto/i));
    await page.getByRole('option').first().click();

    // Ingresar horas
    await typeNaturally(page, String(DemoData.timeEntry.horas), page.getByLabel(/horas/i));
    await typeNaturally(page, DemoData.timeEntry.descripcion, page.getByLabel(/descripción|notas/i));

    await moveAndClick(page, page.getByRole('button', { name: /guardar|registrar/i }));

    // Verificar registro
    await expect(page.getByText(/pendiente/i)).toBeVisible();
    logger.success('Registro de horas creado', DemoData.timeEntry);

    // =====================================================
    // SECCIÓN 14: VERIFICACIÓN FINAL
    // =====================================================
    logger.step(14, 'Verificación Final - Resumen');

    await observe(page);

    // Verificaciones finales
    const checks = {
      dashboardVisible: await page.locator('[data-testid="dashboard"], .dashboard').isVisible(),
      sessionActiva: await page.evaluate(() => !!localStorage.getItem('accessToken')),
      noErrorsInPage: await page.locator('.error, [role="alert"][aria-live="assertive"]').count() === 0
    };

    logger.log('INFO', 'Verificaciones finales', 'Completadas', checks);

    // Assertions finales
    expect(checks.dashboardVisible).toBe(true);
    expect(checks.sessionActiva).toBe(true);
    expect(checks.noErrorsInPage).toBe(true);

    logger.success('DEMO COMPLETA FINALIZADA EXITOSAMENTE');
  });
});
```

---

## Verificaciones Implementadas

| Sección | Verificación | Método |
|---------|--------------|--------|
| Login | Página carga, MFA funciona | `expect().toBeVisible()` |
| Dashboard | KPIs visibles | Selectores + log |
| Departamentos | CRUD funciona | Verificar texto creado |
| Empleados | Creación exitosa | Email visible en lista |
| Onboarding | Proceso iniciado | Estado "En curso" |
| Proyectos | CRUD + asignación | Nombre en listado |
| Timetracking | Grid + Gantt renderizan | SVG/tabla visible |
| Perfil | Datos correctos | Texto rol visible |
| Sesión | Token activo | `localStorage.getItem()` |
| Errores | No hay alertas de error | Count = 0 |

---

## Comandos para Ejecutar

```bash
# Demo con ventana visible (desarrollo)
cd frontend && npm run demo

# Demo sin ventana, solo grabación de video
cd frontend && npm run demo:record

# Ver reporte HTML con videos
npx playwright show-report demo-report
```

---

## Salida Esperada

1. **Video**: `frontend/demo-output/complete-demo-*.webm` (1920x1080)
2. **Screenshots**: Capturados automáticamente en pasos clave
3. **Trace**: `demo-output/trace.zip` para depuración
4. **Logs JSON**: Adjuntos al reporte HTML
5. **Reporte**: `frontend/demo-report/index.html`

---

## Notas de Implementación

1. **Datos únicos**: Usa `Date.now()` para evitar colisiones en cada ejecución
2. **Helpers visuales**: `think()`, `read()`, `observe()` ya existen en `demo.helpers.ts`
3. **Rate limiting**: `loginViaApiWithRetry` maneja reintentos automáticos
4. **MFA**: `generateTotpCode()` genera códigos TOTP válidos
5. **Logs estructurados**: Clase `DemoLogger` para trazabilidad completa

---

## Flujo de la Demo (14 Pasos)

```
┌─────────────────────────────────────────────────────────────┐
│                    DEMO COMPLETA TEAMHUB                     │
├─────────────────────────────────────────────────────────────┤
│  ADMIN                                                       │
│  ├─ 1. Login + MFA                                          │
│  ├─ 2. Dashboard Admin (KPIs)                               │
│  ├─ 3. Crear Departamento                                   │
│  ├─ 4. Crear Empleado                                       │
│  ├─ 5. Ver Plantillas Onboarding                            │
│  ├─ 6. Iniciar Proceso Onboarding                           │
│  ├─ 7. Crear Proyecto + Asignar Equipo                      │
│  ├─ 8. Timetracking (Weekly + Gantt)                        │
│  ├─ 9. Mis Tareas                                           │
│  └─ 10. Perfil Usuario                                      │
├─────────────────────────────────────────────────────────────┤
│  EMPLEADO                                                    │
│  ├─ 11. Login + MFA                                         │
│  ├─ 12. Dashboard Empleado                                  │
│  └─ 13. Registrar Horas                                     │
├─────────────────────────────────────────────────────────────┤
│  VERIFICACIÓN                                                │
│  └─ 14. Checks finales + Resumen logs                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Variables de Entorno Requeridas

```env
# .env.e2e
E2E_USER=admin@teamhub.com
E2E_PASSWORD=Admin123!
E2E_MFA_SECRET=JBSWY3DPEHPK3PXP

E2E_EMPLOYEE_USER=empleado@teamhub.com
E2E_EMPLOYEE_PASSWORD=Emp123!
E2E_EMPLOYEE_MFA_SECRET=JBSWY3DPEHPK3PXP

NEXT_PUBLIC_API_URL=http://localhost:3001/api
```
