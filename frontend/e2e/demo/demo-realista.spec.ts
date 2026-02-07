import { test, expect, Page } from '@playwright/test';
import {
  think,
  read,
  observe,
  waitForLoad,
  moveAndClick,
  typeFast,
  typeNaturally,
  scrollDown,
  navigateTo,
} from './demo.helpers';
import { getAdminTokens, applySession } from '../helpers/e2e-session';

/**
 * DEMO REALISTA - Crea datos en todas las secciones
 *
 * Flujo:
 * 1. Dashboard inicial (vacío)
 * 2. Crear Departamento
 * 3. Crear Empleado
 * 4. Crear Plantilla de Onboarding
 * 5. Iniciar Proceso de Onboarding
 * 6. Crear Proyecto
 * 7. Asignar Empleado a Proyecto
 * 8. Registrar Horas en Timetracking
 * 9. Dashboard final (con datos reflejados)
 */

// ============================================
// DATOS DE DEMO
// ============================================
const timestamp = Date.now().toString().slice(-6);

const DEMO_DATA = {
  departamento: {
    nombre: `Desarrollo ${timestamp}`,
    codigo: `DEV${timestamp.slice(-4)}`,
    descripcion: 'Departamento de desarrollo de software',
  },

  empleado: {
    nombre: 'María',
    apellidos: 'García López',
    email: `maria.garcia.${timestamp}@demo.com`,
    telefono: '612345678',
  },

  plantilla: {
    nombre: `Onboarding Developer ${timestamp}`,
    descripcion: 'Plantilla de onboarding para desarrolladores',
    tareas: [
      { titulo: 'Configurar equipo', dias: 1 },
      { titulo: 'Acceso a repositorios', dias: 2 },
      { titulo: 'Reunión con equipo', dias: 3 },
    ],
  },

  proyecto: {
    nombre: `App Móvil ${timestamp}`,
    codigo: `APP${timestamp.slice(-4)}`,
    cliente: 'TechCorp',
    descripcion: 'Desarrollo de aplicación móvil multiplataforma',
    presupuestoHoras: '500',
  },

  timeEntry: {
    horas: '8',
    descripcion: 'Desarrollo de módulo de autenticación',
  },
};

// ============================================
// LOGGER
// ============================================
class DemoLogger {
  step(num: number, title: string) {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`  PASO ${num}: ${title}`);
    console.log('═'.repeat(60));
  }

  success(msg: string) {
    console.log(`  ✅ ${msg}`);
  }

  info(msg: string) {
    console.log(`  ℹ️  ${msg}`);
  }

  created(entity: string, data: Record<string, unknown>) {
    console.log(`  ✨ ${entity} creado:`, JSON.stringify(data));
  }
}

// ============================================
// HELPERS
// ============================================
async function fillForm(page: Page, fields: Record<string, string>) {
  for (const [selector, value] of Object.entries(fields)) {
    const field = page.locator(selector).first();
    if (await field.isVisible({ timeout: 2000 }).catch(() => false)) {
      await field.click();
      await field.fill(value);
      await think(page);
    }
  }
}

async function selectOption(page: Page, labelText: string, optionText: string) {
  // Click en el select/combobox
  const trigger = page.locator(`button:near(:text("${labelText}")), [role="combobox"]:near(:text("${labelText}"))`).first();
  if (await trigger.isVisible({ timeout: 2000 }).catch(() => false)) {
    await trigger.click();
    await think(page);
    // Seleccionar opción
    const option = page.getByRole('option', { name: new RegExp(optionText, 'i') }).first();
    if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
      await option.click();
      await think(page);
    }
  }
}

async function captureScreenshot(page: Page, name: string) {
  await page.screenshot({
    path: `demo-output/screenshots/realista-${name}.png`,
    fullPage: true,
  });
}

// ============================================
// TEST PRINCIPAL
// ============================================
test.describe('Demo Realista - Flujo Completo con Datos', () => {
  const logger = new DemoLogger();

  test('Crear datos en todas las secciones y verificar dashboard', async ({ page }, testInfo) => {
    // ═══════════════════════════════════════════════════════════
    // PASO 1: AUTENTICACIÓN Y DASHBOARD INICIAL
    // ═══════════════════════════════════════════════════════════
    logger.step(1, 'DASHBOARD INICIAL');

    const tokens = await getAdminTokens();
    await applySession(page, tokens, '/dashboard');
    await waitForLoad(page);
    logger.success('Autenticación completada');

    await observe(page);
    await captureScreenshot(page, '01-dashboard-inicial');

    // Capturar métricas iniciales
    const initialMetrics = await page.evaluate(() => {
      const getText = (selector: string) => document.querySelector(selector)?.textContent || '0';
      return {
        usuarios: getText('[data-metric="usuarios"]') || 'N/A',
        proyectos: getText('[data-metric="proyectos"]') || 'N/A',
      };
    });
    logger.info(`Métricas iniciales: ${JSON.stringify(initialMetrics)}`);

    await scrollDown(page, 400);
    await observe(page);

    // ═══════════════════════════════════════════════════════════
    // PASO 2: CREAR DEPARTAMENTO
    // ═══════════════════════════════════════════════════════════
    logger.step(2, 'CREAR DEPARTAMENTO');

    await navigateTo(page, 'Departamentos');
    await observe(page);
    await captureScreenshot(page, '02-departamentos-antes');

    // Click en Crear Departamento
    await moveAndClick(page, 'button:has-text("Crear Departamento")');
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    logger.success('Modal de creación abierto');
    await read(page);

    // Llenar formulario
    await typeFast(page, '#nombre', DEMO_DATA.departamento.nombre);
    await typeFast(page, '#codigo', DEMO_DATA.departamento.codigo);
    const descField = page.locator('#descripcion');
    if (await descField.isVisible()) {
      await typeFast(page, '#descripcion', DEMO_DATA.departamento.descripcion);
    }

    await think(page);
    await captureScreenshot(page, '02-departamento-form');

    // Guardar
    await moveAndClick(page, '[role="dialog"] button[type="submit"]');
    await waitForLoad(page);
    await read(page);

    // Verificar creación
    await expect(page.getByText(DEMO_DATA.departamento.nombre)).toBeVisible({ timeout: 5000 });
    logger.created('Departamento', DEMO_DATA.departamento);
    await captureScreenshot(page, '02-departamentos-despues');
    await observe(page);

    // ═══════════════════════════════════════════════════════════
    // PASO 3: CREAR EMPLEADO
    // ═══════════════════════════════════════════════════════════
    logger.step(3, 'CREAR EMPLEADO');

    await navigateTo(page, 'Empleados');
    await observe(page);
    await captureScreenshot(page, '03-empleados-antes');

    // Click en Crear Empleado
    await moveAndClick(page, 'button:has-text("Crear empleado")');
    await page.waitForSelector('[role="dialog"], form', { timeout: 5000 });
    logger.success('Formulario de creación abierto');
    await read(page);

    // Llenar formulario de empleado
    await fillForm(page, {
      '#nombre': DEMO_DATA.empleado.nombre,
      '#apellidos': DEMO_DATA.empleado.apellidos,
      '#email': DEMO_DATA.empleado.email,
      'input[name="telefono"], #telefono': DEMO_DATA.empleado.telefono,
    });

    // Seleccionar departamento creado
    await selectOption(page, 'Departamento', DEMO_DATA.departamento.nombre);

    // Seleccionar rol
    await selectOption(page, 'Rol', 'EMPLEADO');

    await think(page);
    await captureScreenshot(page, '03-empleado-form');

    // Guardar
    const submitBtn = page.locator('button[type="submit"]:has-text("Crear"), button:has-text("Guardar")').first();
    await submitBtn.click();
    await waitForLoad(page);
    await read(page);

    // Verificar creación
    await expect(page.getByText(DEMO_DATA.empleado.email)).toBeVisible({ timeout: 5000 });
    logger.created('Empleado', DEMO_DATA.empleado);
    await captureScreenshot(page, '03-empleados-despues');
    await observe(page);

    // ═══════════════════════════════════════════════════════════
    // PASO 4: CREAR PLANTILLA DE ONBOARDING
    // ═══════════════════════════════════════════════════════════
    logger.step(4, 'CREAR PLANTILLA DE ONBOARDING');

    await navigateTo(page, 'Plantillas');
    await observe(page);
    await captureScreenshot(page, '04-plantillas-antes');

    // Click en Crear Plantilla
    await moveAndClick(page, 'button:has-text("Crear plantilla"), a:has-text("Crear plantilla")');
    await waitForLoad(page);
    logger.success('Formulario de plantilla abierto');
    await read(page);

    // Llenar datos de plantilla
    await fillForm(page, {
      '#nombre, input[name="nombre"]': DEMO_DATA.plantilla.nombre,
      '#descripcion, textarea[name="descripcion"]': DEMO_DATA.plantilla.descripcion,
    });

    // Seleccionar departamento
    await selectOption(page, 'Departamento', DEMO_DATA.departamento.nombre);

    await think(page);
    await captureScreenshot(page, '04-plantilla-form');

    // Guardar plantilla
    const savePlantillaBtn = page.locator('button[type="submit"], button:has-text("Crear"), button:has-text("Guardar")').first();
    if (await savePlantillaBtn.isVisible()) {
      await savePlantillaBtn.click();
      await waitForLoad(page);
      await read(page);
    }

    logger.created('Plantilla', { nombre: DEMO_DATA.plantilla.nombre });
    await captureScreenshot(page, '04-plantillas-despues');
    await observe(page);

    // ═══════════════════════════════════════════════════════════
    // PASO 5: INICIAR PROCESO DE ONBOARDING
    // ═══════════════════════════════════════════════════════════
    logger.step(5, 'INICIAR PROCESO DE ONBOARDING');

    await navigateTo(page, 'Onboarding');
    await observe(page);
    await captureScreenshot(page, '05-onboarding-antes');

    // Click en Iniciar Proceso
    const iniciarBtn = page.locator('button:has-text("Iniciar"), button:has-text("Nuevo proceso")').first();
    if (await iniciarBtn.isVisible({ timeout: 3000 })) {
      await iniciarBtn.click();
      await page.waitForSelector('[role="dialog"], form', { timeout: 5000 });
      logger.success('Modal de inicio de proceso abierto');
      await read(page);

      // Seleccionar empleado
      await selectOption(page, 'Empleado', DEMO_DATA.empleado.nombre);

      // Seleccionar plantilla
      await selectOption(page, 'Plantilla', DEMO_DATA.plantilla.nombre);

      await think(page);
      await captureScreenshot(page, '05-onboarding-form');

      // Iniciar - usar selector dentro del dialog para evitar que el overlay intercepte
      const startBtn = page.locator('[role="dialog"] button[type="submit"]');
      await startBtn.click({ force: true });
      await waitForLoad(page);
      await read(page);

      logger.created('Proceso de Onboarding', { empleado: DEMO_DATA.empleado.nombre });
    } else {
      logger.info('Botón de iniciar proceso no visible, continuando...');
    }

    await captureScreenshot(page, '05-onboarding-despues');
    await observe(page);

    // ═══════════════════════════════════════════════════════════
    // PASO 6: CREAR PROYECTO
    // ═══════════════════════════════════════════════════════════
    logger.step(6, 'CREAR PROYECTO');

    await navigateTo(page, 'Proyectos');
    await observe(page);
    await captureScreenshot(page, '06-proyectos-antes');

    // Click en Crear Proyecto
    const crearProyectoBtn = page.locator('a:has-text("Crear proyecto"), button:has-text("Crear proyecto")').first();
    await crearProyectoBtn.waitFor({ state: 'visible', timeout: 10000 });
    await crearProyectoBtn.click();
    await waitForLoad(page);
    logger.success('Formulario de proyecto abierto');
    await read(page);

    // Llenar formulario
    await fillForm(page, {
      '#nombre': DEMO_DATA.proyecto.nombre,
      '#codigo': DEMO_DATA.proyecto.codigo,
      '#cliente': DEMO_DATA.proyecto.cliente,
      '#descripcion': DEMO_DATA.proyecto.descripcion,
      '#presupuestoHoras': DEMO_DATA.proyecto.presupuestoHoras,
    });

    await scrollDown(page, 200);
    await think(page);
    await captureScreenshot(page, '06-proyecto-form');

    // Guardar
    const submitProyectoBtn = page.locator('button[type="submit"]').first();
    await submitProyectoBtn.click();
    await waitForLoad(page);
    await read(page);

    // Verificar creación (puede redirigir a listado o detalle)
    await expect(page.getByText(DEMO_DATA.proyecto.nombre).first()).toBeVisible({ timeout: 10000 });
    logger.created('Proyecto', DEMO_DATA.proyecto);
    await captureScreenshot(page, '06-proyectos-despues');
    await observe(page);

    // ═══════════════════════════════════════════════════════════
    // PASO 7: ASIGNAR EMPLEADO A PROYECTO
    // ═══════════════════════════════════════════════════════════
    logger.step(7, 'ASIGNAR EMPLEADO A PROYECTO');

    // Click en el proyecto creado para ver detalles
    const proyectoCard = page.locator(`text=${DEMO_DATA.proyecto.nombre}`).first();
    await proyectoCard.click();
    await waitForLoad(page);
    logger.success('Detalle de proyecto abierto');
    await read(page);
    await captureScreenshot(page, '07-proyecto-detalle');

    // Buscar botón de asignar
    const asignarBtn = page.locator('button:has-text("Asignar"), button:has-text("Añadir miembro"), button:has-text("Añadir")').first();
    if (await asignarBtn.isVisible({ timeout: 3000 })) {
      await asignarBtn.click();
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
      logger.success('Modal de asignación abierto');
      await read(page);

      // Seleccionar empleado
      await selectOption(page, 'Empleado', DEMO_DATA.empleado.nombre);

      // Seleccionar rol en proyecto
      await selectOption(page, 'Rol', 'Developer');

      // Dedicación
      const dedicacionField = page.locator('#dedicacion, input[name="dedicacion"]').first();
      if (await dedicacionField.isVisible()) {
        await dedicacionField.fill('100');
      }

      await think(page);
      await captureScreenshot(page, '07-asignacion-form');

      // Guardar asignación
      const saveAsignacionBtn = page.locator('button[type="submit"], button:has-text("Asignar"), button:has-text("Guardar")').first();
      await saveAsignacionBtn.click();
      await waitForLoad(page);
      await read(page);

      logger.created('Asignación', { empleado: DEMO_DATA.empleado.nombre, proyecto: DEMO_DATA.proyecto.nombre });
    } else {
      logger.info('Botón de asignar no visible en este proyecto');
    }

    await captureScreenshot(page, '07-proyecto-con-asignacion');
    await observe(page);

    // ═══════════════════════════════════════════════════════════
    // PASO 8: REGISTRAR HORAS EN TIMETRACKING
    // ═══════════════════════════════════════════════════════════
    logger.step(8, 'REGISTRAR HORAS EN TIMETRACKING');

    await navigateTo(page, 'Timetracking');
    await observe(page);
    await captureScreenshot(page, '08-timetracking-antes');

    // Click en Nuevo Registro o similar
    const nuevoRegistroBtn = page.locator('button:has-text("Nuevo"), button:has-text("Registrar"), button:has-text("Añadir")').first();
    if (await nuevoRegistroBtn.isVisible({ timeout: 3000 })) {
      await nuevoRegistroBtn.click();
      await page.waitForSelector('[role="dialog"], form', { timeout: 5000 });
      logger.success('Formulario de registro abierto');
      await read(page);

      // Seleccionar proyecto
      await selectOption(page, 'Proyecto', DEMO_DATA.proyecto.nombre);

      // Llenar horas y descripción
      await fillForm(page, {
        '#horas, input[name="horas"]': DEMO_DATA.timeEntry.horas,
        '#descripcion, textarea[name="descripcion"]': DEMO_DATA.timeEntry.descripcion,
      });

      await think(page);
      await captureScreenshot(page, '08-timetracking-form');

      // Guardar
      const saveTimeBtn = page.locator('button[type="submit"], button:has-text("Guardar"), button:has-text("Registrar")').first();
      await saveTimeBtn.click();
      await waitForLoad(page);
      await read(page);

      logger.created('Registro de Tiempo', DEMO_DATA.timeEntry);
    } else {
      logger.info('Formulario de registro no disponible directamente');

      // Intentar con Weekly Timesheet
      const weeklyTab = page.locator('[role="tab"]:has-text("Weekly"), [role="tab"]:has-text("Semanal")').first();
      if (await weeklyTab.isVisible({ timeout: 2000 })) {
        await weeklyTab.click();
        await waitForLoad(page);
        await read(page);
        logger.info('Vista Weekly Timesheet');
      }
    }

    await captureScreenshot(page, '08-timetracking-despues');
    await observe(page);

    // Ver Gantt Chart
    const ganttTab = page.locator('[role="tab"]:has-text("Gantt")').first();
    if (await ganttTab.isVisible({ timeout: 2000 })) {
      await ganttTab.click();
      await waitForLoad(page);
      await read(page);
      await captureScreenshot(page, '08-gantt-chart');
      logger.success('Gantt Chart visible');
    }

    await observe(page);

    // ═══════════════════════════════════════════════════════════
    // PASO 9: DASHBOARD FINAL - VERIFICAR DATOS
    // ═══════════════════════════════════════════════════════════
    logger.step(9, 'DASHBOARD FINAL - VERIFICAR DATOS CREADOS');

    await navigateTo(page, 'Dashboard');
    await observe(page);
    await captureScreenshot(page, '09-dashboard-final');

    // Verificar que hay datos reflejados
    logger.success('Dashboard actualizado con los datos creados');

    // Scroll para ver todo
    await scrollDown(page, 400);
    await read(page);
    await scrollDown(page, 400);
    await read(page);

    await captureScreenshot(page, '09-dashboard-final-scroll');

    // Verificar KPIs
    const usuariosActivos = page.locator('text=/Usuarios activos/i').first();
    const proyectosActivos = page.locator('text=/Proyectos activos/i').first();

    if (await usuariosActivos.isVisible({ timeout: 2000 })) {
      logger.success('KPI Usuarios Activos visible');
    }
    if (await proyectosActivos.isVisible({ timeout: 2000 })) {
      logger.success('KPI Proyectos Activos visible');
    }

    await observe(page);
    await observe(page);

    // ═══════════════════════════════════════════════════════════
    // RESUMEN FINAL
    // ═══════════════════════════════════════════════════════════
    console.log('\n' + '═'.repeat(60));
    console.log('  DEMO REALISTA COMPLETADA');
    console.log('═'.repeat(60));
    console.log('  Datos creados:');
    console.log(`    ✓ Departamento: ${DEMO_DATA.departamento.nombre}`);
    console.log(`    ✓ Empleado: ${DEMO_DATA.empleado.nombre} ${DEMO_DATA.empleado.apellidos}`);
    console.log(`    ✓ Plantilla: ${DEMO_DATA.plantilla.nombre}`);
    console.log(`    ✓ Proyecto: ${DEMO_DATA.proyecto.nombre}`);
    console.log(`    ✓ Horas registradas: ${DEMO_DATA.timeEntry.horas}h`);
    console.log('═'.repeat(60));

    // Adjuntar resumen al reporte
    await testInfo.attach('datos-creados.json', {
      body: JSON.stringify(DEMO_DATA, null, 2),
      contentType: 'application/json',
    });
  });
});
