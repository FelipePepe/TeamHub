import { test, expect, type Page } from '@playwright/test';
import {
  think,
  read,
  observe,
  waitForLoad,
  moveAndClick,
  typeNaturally,
  typeFast,
  scrollDown,
  navigateTo,
  generateTotpCode,
  getDemoCredentials,
} from './demo.helpers';
import {
  getAdminTokens,
  applySession,
  provisionEmployeeSession,
  type AuthTokens,
} from '../helpers/e2e-session';

/**
 * DEMO COMPLETA CONSOLIDADA: 14 pasos del flujo TeamHub
 *
 * - Un solo test() para video continuo (1920x1080 Full HD)
 * - test.step() internos para estructura en el reporter
 * - Flujo ADMIN completo + flujo EMPLEADO por API
 * - try/catch en pasos opcionales para no romper la demo
 */

// ============================================
// DATOS DE DEMO (con timestamp para evitar colisiones)
// ============================================
const timestamp = Date.now();
const ts = timestamp.toString().slice(-6);

const DemoData = {
  timestamp,

  departamento: {
    nombre: `Innovación Digital ${ts}`,
    codigo: `INN${ts.slice(-4)}`,
    descripcion: 'Departamento creado en demo automatizada',
  },

  empleado: {
    email: `demo.empleado.${ts}@example.com`,
    nombre: 'María',
    apellidos: `García Demo ${ts.slice(-4)}`,
  },

  plantilla: {
    nombre: `Onboarding Tech ${ts.slice(-4)}`,
    descripcion: 'Plantilla creada en demo automatizada',
  },

  proyecto: {
    nombre: `App Móvil Demo ${ts.slice(-4)}`,
    codigo: `DEMO${ts.slice(-4)}`,
    cliente: 'Cliente Demo Corp',
    descripcion: 'Proyecto de demostración automatizada',
    presupuestoHoras: '500',
  },

  timeEntry: {
    horas: '4',
    descripcion: 'Desarrollo de funcionalidad demo',
  },
};

// ============================================
// LOGGER ESTRUCTURADO
// ============================================
type LogLevel = 'INFO' | 'SUCCESS' | 'ERROR' | 'STEP';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  action: string;
  result: string;
  data?: unknown;
}

class DemoLogger {
  private logs: LogEntry[] = [];

  log(level: LogLevel, action: string, result: string, data?: unknown) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      action,
      result,
      data,
    };
    this.logs.push(entry);
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    console.log(`[${level}] ${action}: ${result}${dataStr}`);
  }

  step(num: number, description: string) {
    console.log(`\n${'='.repeat(50)}`);
    this.log('STEP', `Paso ${num}`, description);
    console.log('='.repeat(50));
  }

  success(action: string, data?: unknown) {
    this.log('SUCCESS', action, 'OK', data);
  }

  error(action: string, errorMsg: string) {
    this.log('ERROR', action, errorMsg);
  }

  info(action: string, result: string, data?: unknown) {
    this.log('INFO', action, result, data);
  }

  getSummary() {
    return {
      total: this.logs.length,
      success: this.logs.filter((l) => l.level === 'SUCCESS').length,
      errors: this.logs.filter((l) => l.level === 'ERROR').length,
      steps: this.logs.filter((l) => l.level === 'STEP').length,
    };
  }

  exportLogs() {
    return this.logs;
  }
}

// ============================================
// HELPER: Seleccionar opción en Radix Select
// ============================================

/**
 * Selecciona una opción en un Radix Select.
 * Los Select de Shadcn/Radix renderizan un <button role="combobox"> como trigger
 * y las opciones aparecen en portal como [role="option"].
 *
 * @param page - Playwright Page
 * @param labelText - Texto del Label asociado al Select (busca el trigger hermano)
 * @param optionText - Texto (parcial) de la opción a seleccionar
 */
async function selectRadixOption(page: Page, labelText: string, optionText: string) {
  // Buscar el contenedor del campo por el Label
  const fieldContainer = page.locator(`div.space-y-2:has(label:has-text("${labelText}"))`);
  const trigger = fieldContainer.locator('button[role="combobox"]');
  await trigger.waitFor({ state: 'visible', timeout: 5000 });
  await trigger.click();
  await page.waitForTimeout(300);

  // Seleccionar la opción del dropdown
  const option = page.locator(`[role="option"]:has-text("${optionText}")`).first();
  await option.waitFor({ state: 'visible', timeout: 5000 });
  await option.click();
  await think(page);
}

// ============================================
// TEST PRINCIPAL: DEMO COMPLETA 14 PASOS
// ============================================
test.describe('Demo Completa TeamHub - 14 Pasos', () => {
  let logger: DemoLogger;

  test.beforeEach(() => {
    logger = new DemoLogger();
  });

  test.afterEach(async ({}, testInfo) => {
    const summary = logger.getSummary();
    console.log('\n' + '='.repeat(50));
    console.log('          RESUMEN DE DEMO');
    console.log('='.repeat(50));
    console.log(`Total acciones: ${summary.total}`);
    console.log(`Exitosas:       ${summary.success}`);
    console.log(`Errores:        ${summary.errors}`);
    console.log(`Pasos:          ${summary.steps}`);
    console.log('='.repeat(50));

    await testInfo.attach('demo-logs.json', {
      body: JSON.stringify(logger.exportLogs(), null, 2),
      contentType: 'application/json',
    });
  });

  test('Flujo completo: 14 pasos ADMIN + EMPLEADO', async ({ page }) => {
    // Provisionar empleado en paralelo al inicio (API, sin UI)
    const adminTokens = await getAdminTokens();
    let employeeTokens: AuthTokens | null = null;

    // Lanzar provisioning en background (se usará en paso 12)
    const employeeProvisionPromise = provisionEmployeeSession(adminTokens.accessToken)
      .then((tokens) => {
        employeeTokens = tokens;
        logger.success('Provisioning empleado completado (background)');
      })
      .catch((err) => {
        logger.error('Provisioning empleado', (err as Error).message);
      });

    // =========================================================
    // PASO 1: Login MFA visual (ADMIN)
    // =========================================================
    await test.step('Paso 1: Login MFA visual (ADMIN)', async () => {
      logger.step(1, 'Login MFA visual como ADMIN');

      const credentials = getDemoCredentials();
      if (!credentials.mfaSecret) {
        // Fallback a login por API si no hay MFA secret
        logger.info('Login', 'Sin MFA_SECRET, usando login por API');
        await applySession(page, adminTokens, '/dashboard');
        await page.waitForLoadState('networkidle');
        logger.success('Login completado via API (fallback)');
        return;
      }

      await page.goto('/login');
      await observe(page);

      await expect(page.locator('form')).toBeVisible();
      logger.success('Página de login visible');

      // Email
      await typeNaturally(page, '#email', credentials.email);
      // Contraseña
      await typeNaturally(page, '#password', credentials.password);
      await think(page);

      // Submit login
      await moveAndClick(page, 'button[type="submit"]');

      // Esperar pantalla MFA
      await page.waitForSelector('#mfa-code, #totp, #code', { timeout: 15000 });
      logger.success('Pantalla MFA mostrada');
      await read(page);

      // Generar y escribir código TOTP
      const totpCode = generateTotpCode(credentials.mfaSecret);
      await typeNaturally(page, '#mfa-code, #totp, #code', totpCode);
      await think(page);

      // Verificar MFA
      await moveAndClick(page, 'button[type="submit"]');

      await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });
      logger.success('Login MFA completado, dashboard visible');
      await observe(page);
    });

    // =========================================================
    // PASO 2: Dashboard Admin (KPIs, scroll)
    // =========================================================
    await test.step('Paso 2: Dashboard Admin', async () => {
      logger.step(2, 'Explorar Dashboard de Administrador');

      await expect(page).toHaveURL(/dashboard/);
      logger.success('Dashboard visible');

      const dashboardContent = page.locator('main').first();
      await expect(dashboardContent).toBeVisible();
      logger.success('Contenido del dashboard cargado');

      await observe(page);
      await scrollDown(page, 400);
      await scrollDown(page, 400);
    });

    // =========================================================
    // PASO 3: Crear Departamento
    // =========================================================
    await test.step('Paso 3: Crear Departamento', async () => {
      logger.step(3, 'Crear nuevo Departamento');

      await navigateTo(page, 'Departamentos');
      await expect(page).toHaveURL(/departamentos/);
      logger.success('Navegación a Departamentos');
      await observe(page);

      await moveAndClick(page, 'button:has-text("Crear Departamento")');
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
      logger.success('Modal de creación abierto');
      await read(page);

      await typeFast(page, '#nombre', DemoData.departamento.nombre);
      await typeFast(page, '#codigo', DemoData.departamento.codigo);

      const descripcionField = page.locator('#descripcion');
      if (await descripcionField.isVisible()) {
        await typeFast(page, '#descripcion', DemoData.departamento.descripcion);
      }
      await think(page);

      await moveAndClick(page, '[role="dialog"] button[type="submit"]');
      await page.waitForLoadState('networkidle');
      await read(page);

      const departamentoCreado = page.getByText(DemoData.departamento.nombre).first();
      await expect(departamentoCreado).toBeVisible({ timeout: 5000 });
      logger.success('Departamento creado', DemoData.departamento);
      await observe(page);
    });

    // =========================================================
    // PASO 4: Crear Empleado
    // =========================================================
    await test.step('Paso 4: Crear Empleado', async () => {
      logger.step(4, 'Crear nuevo Empleado');

      await navigateTo(page, 'Empleados');
      await expect(page).toHaveURL(/empleados/);
      logger.success('Navegación a Empleados');
      await observe(page);

      await moveAndClick(page, 'button:has-text("Crear empleado")');
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
      logger.success('Modal de creación de empleado abierto');
      await read(page);

      // Rellenar campos del formulario
      await typeFast(page, '#email', DemoData.empleado.email);
      await typeFast(page, '#nombre', DemoData.empleado.nombre);
      await typeFast(page, '#apellidos', DemoData.empleado.apellidos);

      // Select Rol → EMPLEADO
      await selectRadixOption(page, 'Rol', 'Empleado');
      logger.success('Rol seleccionado: Empleado');

      // Select Departamento → el que acabamos de crear
      try {
        await selectRadixOption(page, 'Departamento', DemoData.departamento.nombre);
        logger.success('Departamento seleccionado', DemoData.departamento.nombre);
      } catch {
        logger.info('Departamento', 'No se encontró el departamento recién creado, continuando');
      }

      await think(page);

      await moveAndClick(page, '[role="dialog"] button[type="submit"]');
      await page.waitForLoadState('networkidle');
      await read(page);

      logger.success('Empleado creado', DemoData.empleado);
      await observe(page);
    });

    // =========================================================
    // PASO 5: Crear Plantilla de Onboarding
    // =========================================================
    await test.step('Paso 5: Crear Plantilla de Onboarding', async () => {
      logger.step(5, 'Crear Plantilla de Onboarding');

      await navigateTo(page, 'Plantillas');
      await expect(page).toHaveURL(/plantillas/);
      logger.success('Navegación a Plantillas');
      await observe(page);

      // Click en "Crear plantilla" → navega a /admin/plantillas/crear
      await moveAndClick(page, 'button:has-text("Crear plantilla"), a:has-text("Crear plantilla")');
      await page.waitForLoadState('networkidle');
      await read(page);

      await typeFast(page, '#nombre', DemoData.plantilla.nombre);
      await typeFast(page, '#descripcion', DemoData.plantilla.descripcion);

      // Select Departamento
      try {
        await selectRadixOption(page, 'Departamento', DemoData.departamento.nombre);
        logger.success('Departamento asignado a plantilla');
      } catch {
        logger.info('Plantilla - Dept', 'No se pudo seleccionar departamento, continuando');
      }

      await scrollDown(page, 200);
      await think(page);

      // Guardar plantilla
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
      await read(page);

      logger.success('Plantilla creada', DemoData.plantilla);
      await observe(page);
    });

    // =========================================================
    // PASO 6: Iniciar Onboarding
    // =========================================================
    await test.step('Paso 6: Iniciar Onboarding', async () => {
      logger.step(6, 'Iniciar Proceso de Onboarding');

      await navigateTo(page, 'Onboarding');
      await expect(page).toHaveURL(/onboarding/);
      logger.success('Navegación a Onboarding');
      await observe(page);

      try {
        await moveAndClick(page, 'button:has-text("Iniciar proceso")');
        await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
        logger.success('Modal Iniciar Proceso abierto');
        await read(page);

        // Select Empleado
        await selectRadixOption(page, 'Empleado', DemoData.empleado.nombre);
        logger.success('Empleado seleccionado para onboarding');

        // Select Plantilla
        await selectRadixOption(page, 'Plantilla', DemoData.plantilla.nombre);
        logger.success('Plantilla seleccionada para onboarding');

        await think(page);

        // Submit
        await moveAndClick(page, '[role="dialog"] button[type="submit"]');
        await page.waitForLoadState('networkidle');
        await read(page);

        logger.success('Proceso de onboarding iniciado');
      } catch (err) {
        logger.error('Iniciar onboarding', (err as Error).message);
      }

      await observe(page);
    });

    // =========================================================
    // PASO 7: Crear Proyecto + Asignar Equipo
    // =========================================================
    await test.step('Paso 7: Crear Proyecto + Asignar Equipo', async () => {
      logger.step(7, 'Crear Proyecto y Asignar Equipo');

      await navigateTo(page, 'Proyectos');
      await expect(page).toHaveURL(/proyectos/);
      logger.success('Navegación a Proyectos');
      await observe(page);

      // Crear proyecto
      const createBtn = page
        .locator('a:has-text("Crear proyecto"), button:has-text("Crear proyecto")')
        .first();
      if (await createBtn.isVisible({ timeout: 3000 })) {
        await createBtn.click();
        await page.waitForLoadState('networkidle');
        await read(page);

        await typeFast(page, '#nombre', DemoData.proyecto.nombre);
        await think(page);
        await typeFast(page, '#codigo', DemoData.proyecto.codigo);
        await think(page);

        const clienteField = page.locator('#cliente');
        if (await clienteField.isVisible()) {
          await typeFast(page, '#cliente', DemoData.proyecto.cliente);
          await think(page);
        }

        const descripcionField = page.locator('#descripcion');
        if (await descripcionField.isVisible()) {
          await typeFast(page, '#descripcion', DemoData.proyecto.descripcion);
          await think(page);
        }

        const presupuestoField = page.locator('#presupuestoHoras');
        if (await presupuestoField.isVisible()) {
          await typeFast(page, '#presupuestoHoras', DemoData.proyecto.presupuestoHoras);
          await think(page);
        }

        await scrollDown(page, 200);

        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');
        await read(page);

        logger.success('Proyecto creado', DemoData.proyecto);
      } else {
        logger.info('Crear proyecto', 'Botón no visible, continuando');
      }

      // Intentar asignar equipo al proyecto
      try {
        const asignarBtn = page.locator('button:has-text("Añadir asignación")').first();
        if (await asignarBtn.isVisible({ timeout: 3000 })) {
          await asignarBtn.click();
          await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
          logger.success('Modal Añadir asignación abierto');
          await read(page);

          // Seleccionar empleado recién creado
          try {
            await selectRadixOption(page, 'Empleado', DemoData.empleado.nombre);
            logger.success('Empleado seleccionado para asignación', DemoData.empleado.nombre);
            await think(page);

            // Submit asignación
            const submitBtn = page.locator('[role="dialog"] button[type="submit"]').first();
            if (await submitBtn.isVisible({ timeout: 3000 })) {
              await submitBtn.click();
              await page.waitForLoadState('networkidle');
              await read(page);
              logger.success('Empleado asignado al proyecto');
            }
          } catch {
            // Si no se puede asignar, cerrar el modal
            const cancelBtn = page.locator('[role="dialog"] button:has-text("Cancelar")').first();
            if (await cancelBtn.isVisible({ timeout: 2000 })) {
              await cancelBtn.click();
            } else {
              await page.keyboard.press('Escape');
            }
            logger.info('Asignación equipo', 'No se pudo completar, modal cerrado');
          }
        }
      } catch (err) {
        logger.error('Asignar equipo', (err as Error).message);
      }

      await observe(page);
    });

    // =========================================================
    // PASO 8: Timetracking (tabs)
    // =========================================================
    await test.step('Paso 8: Timetracking - Explorar vistas', async () => {
      logger.step(8, 'Timetracking: Explorar vistas');

      await navigateTo(page, 'Timetracking');
      await expect(page).toHaveURL(/timetracking/);
      logger.success('Navegación a Timetracking');
      await observe(page);

      const mainContent = page.locator('main').first();
      await expect(mainContent).toBeVisible();
      logger.success('Vista de Timetracking cargada');

      // Tab: Timesheet Semanal
      const timesheetTab = page.locator('[role="tab"]:has-text("Timesheet Semanal")');
      if (await timesheetTab.isVisible({ timeout: 3000 })) {
        await timesheetTab.click();
        await page.waitForLoadState('networkidle');
        await read(page);
        logger.success('Tab Timesheet Semanal visible');
        await observe(page);
      }

      // Tab: Diagrama Gantt
      const ganttTab = page.locator('[role="tab"]:has-text("Diagrama Gantt")');
      if (await ganttTab.isVisible({ timeout: 3000 })) {
        await ganttTab.click();
        await page.waitForLoadState('networkidle');
        await read(page);

        const ganttChart = page.locator('svg, canvas, [data-testid="gantt-chart"]').first();
        if (await ganttChart.isVisible({ timeout: 5000 })) {
          logger.success('Gantt Chart renderizado');
        }
        await observe(page);
      }

      // Volver a Mis Registros
      const registrosTab = page.locator('[role="tab"]:has-text("Mis Registros")');
      if (await registrosTab.isVisible({ timeout: 2000 })) {
        await registrosTab.click();
        await page.waitForLoadState('networkidle');
        await read(page);
      }
    });

    // =========================================================
    // PASO 9: Mis Tareas (completar una si hay)
    // =========================================================
    await test.step('Paso 9: Mis Tareas', async () => {
      logger.step(9, 'Ver Mis Tareas');

      await page.goto('/mis-tareas');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/mis-tareas/);
      logger.success('Navegación a Mis Tareas');
      await observe(page);

      const mainContent = page.locator('main').first();
      await expect(mainContent).toBeVisible();
      logger.success('Vista de Mis Tareas cargada');

      // Intentar completar una tarea
      try {
        const completarBtn = page.locator('button:has-text("Completar")').first();
        if (await completarBtn.isVisible({ timeout: 3000 })) {
          await completarBtn.click();
          await page.waitForLoadState('networkidle');
          await read(page);
          logger.success('Tarea completada');
        } else {
          logger.info('Mis Tareas', 'No hay tareas para completar');
        }
      } catch (err) {
        logger.error('Completar tarea', (err as Error).message);
      }

      await scrollDown(page, 300);
      await observe(page);
    });

    // =========================================================
    // PASO 10: Perfil (via UserNav dropdown)
    // =========================================================
    await test.step('Paso 10: Perfil de Usuario', async () => {
      logger.step(10, 'Revisar Perfil de Usuario');

      // Click en UserNav (avatar button)
      const userNav = page.locator('button:has(div.rounded-full)').first();
      if (await userNav.isVisible({ timeout: 3000 })) {
        await userNav.click();
        await read(page);

        // Click en "Mi perfil"
        const perfilLink = page.locator('a:has-text("Mi perfil")').first();
        if (await perfilLink.isVisible({ timeout: 3000 })) {
          await perfilLink.click();
          await page.waitForLoadState('networkidle');
          await read(page);

          await expect(page).toHaveURL(/perfil/);
          logger.success('Perfil de usuario visible');
          await observe(page);
        }
      } else {
        // Fallback: navegar directamente
        await page.goto('/perfil');
        await page.waitForLoadState('networkidle');
        logger.success('Navegación directa a Perfil');
        await observe(page);
      }
    });

    // =========================================================
    // PASO 11: Logout (UserNav → Cerrar sesion)
    // =========================================================
    await test.step('Paso 11: Logout', async () => {
      logger.step(11, 'Cerrar Sesión ADMIN');

      const userNav = page.locator('button:has(div.rounded-full)').first();
      if (await userNav.isVisible({ timeout: 3000 })) {
        await userNav.click();
        await read(page);

        const logoutBtn = page.locator('button:has-text("Cerrar sesion")').first();
        if (await logoutBtn.isVisible({ timeout: 3000 })) {
          await logoutBtn.click();
          await page.waitForLoadState('networkidle');
          await read(page);
          logger.success('Sesión ADMIN cerrada');
        }
      } else {
        // Fallback: limpiar localStorage
        await page.evaluate(() => {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        });
        await page.goto('/login');
        logger.success('Sesión cerrada (fallback)');
      }

      await observe(page);
    });

    // =========================================================
    // PASO 12: Login Empleado (API + applySession)
    // =========================================================
    await test.step('Paso 12: Login Empleado', async () => {
      logger.step(12, 'Login como EMPLEADO');

      // Esperar a que termine el provisioning
      await employeeProvisionPromise;

      if (!employeeTokens) {
        logger.error('Login Empleado', 'No se pudo provisionar empleado, saltando pasos 12-13');
        return;
      }

      await applySession(page, employeeTokens, '/dashboard');
      await page.waitForLoadState('networkidle');
      logger.success('Sesión EMPLEADO aplicada');

      await expect(page).toHaveURL(/dashboard/);
      logger.success('Dashboard empleado visible');
      await observe(page);

      // Scroll para ver contenido del dashboard
      await scrollDown(page, 300);
      await read(page);
    });

    // =========================================================
    // PASO 13: Empleado registra horas
    // =========================================================
    await test.step('Paso 13: Empleado registra horas', async () => {
      logger.step(13, 'Empleado registra horas en Timetracking');

      if (!employeeTokens) {
        logger.info('Registrar horas', 'Saltado - sin sesión de empleado');
        return;
      }

      await navigateTo(page, 'Timetracking');
      await expect(page).toHaveURL(/timetracking/);
      logger.success('Navegación a Timetracking (empleado)');
      await observe(page);

      try {
        const registrarBtn = page.locator('button:has-text("Registrar horas")').first();
        if (await registrarBtn.isVisible({ timeout: 5000 })) {
          await registrarBtn.click();
          await read(page);
          logger.success('Modal Registrar horas abierto');

          // Seleccionar proyecto (select nativo, no Radix)
          const proyectoSelect = page.locator('select').first();
          if (await proyectoSelect.isVisible({ timeout: 3000 })) {
            const options = proyectoSelect.locator('option:not([value=""])');
            if ((await options.count()) > 0) {
              const firstValue = await options.first().getAttribute('value');
              if (firstValue) {
                await proyectoSelect.selectOption(firstValue);
                logger.success('Proyecto seleccionado');
              }
            }
          }

          // Horas
          const horasInput = page.locator('input[type="number"]').first();
          if (await horasInput.isVisible()) {
            await horasInput.fill(DemoData.timeEntry.horas);
          }

          // Descripción
          const descTextarea = page.locator('textarea').first();
          if (await descTextarea.isVisible()) {
            await descTextarea.fill(DemoData.timeEntry.descripcion);
          }

          await think(page);

          // Submit
          const submitBtn = page.locator('button[type="submit"]:has-text("Crear registro")').first();
          if (await submitBtn.isVisible({ timeout: 3000 })) {
            await submitBtn.click();
            await page.waitForLoadState('networkidle');
            await read(page);
            logger.success('Registro de horas creado', DemoData.timeEntry);
          }
        } else {
          logger.info('Registrar horas', 'Botón no visible');
        }
      } catch (err) {
        logger.error('Registrar horas', (err as Error).message);
      }

      await observe(page);
    });

    // =========================================================
    // PASO 14: Verificación final
    // =========================================================
    await test.step('Paso 14: Verificación final', async () => {
      logger.step(14, 'Verificación Final');

      const checks = {
        dashboardVisible: await page.locator('main').first().isVisible(),
        sessionActiva: await page.evaluate(() => !!localStorage.getItem('accessToken')),
        noErrorsInPage: (await page.locator('[role="alert"][aria-live="assertive"]').count()) === 0,
      };

      logger.info('Verificaciones finales', 'Completadas', checks);

      expect(checks.dashboardVisible).toBe(true);
      expect(checks.sessionActiva).toBe(true);
      expect(checks.noErrorsInPage).toBe(true);

      logger.success('DEMO COMPLETA (14 PASOS) FINALIZADA EXITOSAMENTE');

      // Pausa final para el video
      await observe(page);
      await observe(page);
    });
  });
});
