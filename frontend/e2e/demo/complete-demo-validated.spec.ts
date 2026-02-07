import { test, expect, Page } from '@playwright/test';
import {
  think,
  read,
  observe,
  waitForLoad,
  moveAndClick,
  typeFast,
  scrollDown,
  navigateTo,
} from './demo.helpers';
import { getAdminTokens, applySession } from '../helpers/e2e-session';

/**
 * DEMO COMPLETA CON VALIDACIÓN DE CONTENIDO
 * - Captura screenshots de cada pantalla
 * - Define expectativas de qué debe mostrar cada vista
 * - Reporta errores si falta contenido esperado
 */

// ============================================
// DEFINICIÓN DE EXPECTATIVAS POR PANTALLA
// ============================================
interface ScreenExpectation {
  name: string;
  url: RegExp;
  requiredElements: {
    selector: string;
    description: string;
    critical: boolean; // Si es crítico, falla el test; si no, solo advierte
  }[];
  optionalChecks?: {
    selector: string;
    description: string;
  }[];
}

const SCREEN_EXPECTATIONS: Record<string, ScreenExpectation> = {
  dashboard: {
    name: 'Dashboard',
    url: /dashboard/,
    requiredElements: [
      { selector: 'main', description: 'Contenedor principal', critical: true },
      { selector: 'nav', description: 'Barra de navegación lateral', critical: true },
      { selector: 'h1:has-text("Bienvenido")', description: 'Título de bienvenida', critical: true },
    ],
    optionalChecks: [
      { selector: 'text=Usuarios activos', description: 'KPI Usuarios activos' },
      { selector: 'text=Proyectos activos', description: 'KPI Proyectos activos' },
      { selector: 'text=Actividad reciente', description: 'Sección Actividad reciente' },
      { selector: 'text=Usuarios por rol', description: 'Gráfico Usuarios por rol' },
    ],
  },

  departamentos: {
    name: 'Departamentos',
    url: /departamentos/,
    requiredElements: [
      { selector: 'main', description: 'Contenedor principal', critical: true },
      { selector: 'h1:has-text("Departamentos")', description: 'Título de página', critical: true },
      { selector: 'button:has-text("Crear Departamento")', description: 'Botón crear departamento', critical: true },
    ],
    optionalChecks: [
      { selector: 'input[placeholder*="Buscar"]', description: 'Campo de búsqueda' },
      { selector: 'text=Activos', description: 'Filtro Activos' },
      { selector: 'button:has-text("Editar")', description: 'Botones de edición (si hay datos)' },
      { selector: 'button:has-text("Eliminar")', description: 'Botones de eliminación' },
    ],
  },

  empleados: {
    name: 'Empleados',
    url: /empleados/,
    requiredElements: [
      { selector: 'main', description: 'Contenedor principal', critical: true },
      { selector: 'h1:has-text("Empleados")', description: 'Título de página', critical: true },
      { selector: 'button:has-text("Crear empleado")', description: 'Botón crear empleado', critical: true },
      { selector: 'text=Listado de empleados', description: 'Encabezado del listado', critical: true },
    ],
    optionalChecks: [
      { selector: 'text=Filtros', description: 'Sección de filtros' },
      { selector: 'input[placeholder*="Buscar"]', description: 'Campo de búsqueda' },
      { selector: 'text=Empleado, text=Email, text=Rol', description: 'Cabeceras de columna' },
      { selector: 'text=Activo', description: 'Badge de estado' },
    ],
  },

  plantillas: {
    name: 'Plantillas de Onboarding',
    url: /plantillas/,
    requiredElements: [
      { selector: 'main', description: 'Contenedor principal', critical: true },
      { selector: 'h1:has-text("Plantillas")', description: 'Título de página', critical: true },
      { selector: 'button:has-text("Crear plantilla")', description: 'Botón crear plantilla', critical: true },
    ],
    optionalChecks: [
      { selector: 'text=Filtros', description: 'Sección de filtros' },
      { selector: 'text=Listado de plantillas', description: 'Encabezado de listado' },
      { selector: 'text=No hay plantillas, text=No se encontraron', description: 'Estado vacío (si aplica)' },
    ],
  },

  onboarding: {
    name: 'Procesos de Onboarding',
    url: /onboarding/,
    requiredElements: [
      { selector: 'main', description: 'Contenedor principal', critical: true },
      { selector: 'h1:has-text("Onboarding"), h1:has-text("Procesos")', description: 'Título de página', critical: true },
    ],
    optionalChecks: [
      { selector: 'text=Filtros', description: 'Sección de filtros' },
      { selector: 'button:has-text("Iniciar"), button:has-text("Nuevo")', description: 'Botón iniciar proceso' },
      { selector: '[class*="card"], [class*="Card"]', description: 'Tarjetas de proceso' },
    ],
  },

  proyectos: {
    name: 'Proyectos',
    url: /proyectos/,
    requiredElements: [
      { selector: 'main', description: 'Contenedor principal', critical: true },
      { selector: 'h1:has-text("Proyectos")', description: 'Título de página', critical: true },
      { selector: 'button:has-text("Crear proyecto"), a:has-text("Crear proyecto")', description: 'Botón crear proyecto', critical: true },
    ],
    optionalChecks: [
      { selector: 'text=Filtros', description: 'Sección de filtros' },
      { selector: 'text=Listado de proyectos', description: 'Encabezado de listado' },
      { selector: '[class*="card"], [class*="Card"]', description: 'Tarjetas de proyecto' },
      { selector: 'button:has-text("Ver")', description: 'Botones de ver proyecto' },
    ],
  },

  timetracking: {
    name: 'Timetracking',
    url: /timetracking/,
    requiredElements: [
      { selector: 'main', description: 'Contenedor principal', critical: true },
      { selector: '[role="tablist"]', description: 'Tabs de navegación', critical: true },
      { selector: '[role="tab"]', description: 'Pestañas individuales', critical: true },
    ],
    optionalChecks: [
      { selector: 'table', description: 'Tabla de registros' },
      { selector: 'svg', description: 'Gráfico Gantt' },
      { selector: 'text=Mis Registros, text=Weekly', description: 'Nombres de pestañas' },
    ],
  },

  misTareas: {
    name: 'Mis Tareas',
    url: /mis-tareas/,
    requiredElements: [
      { selector: 'main', description: 'Contenedor principal', critical: true },
      { selector: 'h1:has-text("Tareas"), h1:has-text("Mis Tareas")', description: 'Título de página', critical: true },
    ],
    optionalChecks: [
      { selector: '[class*="card"], li', description: 'Items de tareas' },
      { selector: 'text=No hay tareas, text=No tienes tareas', description: 'Estado vacío' },
      { selector: 'text=Pendiente, text=Completada', description: 'Estados de tareas' },
    ],
  },

  perfil: {
    name: 'Perfil de Usuario',
    url: /perfil/,
    requiredElements: [
      { selector: 'main', description: 'Contenedor principal', critical: true },
      { selector: 'h1:has-text("Mi perfil"), h1:has-text("Perfil")', description: 'Título de página', critical: true },
      { selector: 'text=Información personal', description: 'Sección información personal', critical: true },
      { selector: 'button:has-text("Guardar cambios")', description: 'Botón guardar cambios', critical: true },
    ],
    optionalChecks: [
      { selector: 'input#nombre, input[name="nombre"]', description: 'Campo nombre' },
      { selector: 'text=Cambiar contraseña', description: 'Sección cambiar contraseña' },
      { selector: 'text=ADMIN, text=EMPLEADO, text=RRHH, text=MANAGER', description: 'Badge de rol' },
    ],
  },
};

// ============================================
// LOGGER CON VALIDACIÓN
// ============================================
type ValidationResult = {
  screen: string;
  passed: boolean;
  criticalErrors: string[];
  warnings: string[];
  screenshot: string;
};

class ValidationLogger {
  private results: ValidationResult[] = [];
  private currentStep = 0;

  startStep(num: number, description: string) {
    this.currentStep = num;
    console.log(`\n${'='.repeat(60)}`);
    console.log(`[PASO ${num}] ${description}`);
    console.log('='.repeat(60));
  }

  addResult(result: ValidationResult) {
    this.results.push(result);

    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`\n${status}: ${result.screen}`);

    if (result.criticalErrors.length > 0) {
      console.log('  Errores críticos:');
      result.criticalErrors.forEach(e => console.log(`    ❌ ${e}`));
    }

    if (result.warnings.length > 0) {
      console.log('  Advertencias:');
      result.warnings.forEach(w => console.log(`    ⚠️  ${w}`));
    }

    console.log(`  Screenshot: ${result.screenshot}`);
  }

  getSummary() {
    const total = this.results.length;
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const totalCriticalErrors = this.results.reduce((sum, r) => sum + r.criticalErrors.length, 0);
    const totalWarnings = this.results.reduce((sum, r) => sum + r.warnings.length, 0);

    return { total, passed, failed, totalCriticalErrors, totalWarnings };
  }

  getResults() {
    return this.results;
  }

  printFinalReport() {
    const summary = this.getSummary();

    console.log('\n' + '='.repeat(60));
    console.log('           REPORTE FINAL DE VALIDACIÓN');
    console.log('='.repeat(60));
    console.log(`Pantallas validadas: ${summary.total}`);
    console.log(`  ✅ Pasaron:        ${summary.passed}`);
    console.log(`  ❌ Fallaron:       ${summary.failed}`);
    console.log(`  ⚠️  Advertencias:   ${summary.totalWarnings}`);
    console.log('='.repeat(60));

    if (summary.failed > 0) {
      console.log('\nPANTALLAS CON ERRORES:');
      this.results
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`\n  📍 ${r.screen}:`);
          r.criticalErrors.forEach(e => console.log(`     ❌ ${e}`));
        });
    }

    if (summary.totalWarnings > 0) {
      console.log('\nADVERTENCIAS (elementos opcionales faltantes):');
      this.results
        .filter(r => r.warnings.length > 0)
        .forEach(r => {
          console.log(`\n  📍 ${r.screen}:`);
          r.warnings.forEach(w => console.log(`     ⚠️  ${w}`));
        });
    }
  }
}

// ============================================
// FUNCIÓN DE VALIDACIÓN DE PANTALLA
// ============================================
async function validateScreen(
  page: Page,
  expectation: ScreenExpectation,
  logger: ValidationLogger,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  testInfo: any
): Promise<ValidationResult> {
  const criticalErrors: string[] = [];
  const warnings: string[] = [];

  // Verificar URL
  const currentUrl = page.url();
  if (!expectation.url.test(currentUrl)) {
    criticalErrors.push(`URL incorrecta: esperaba ${expectation.url}, obtuvo ${currentUrl}`);
  }

  // Verificar elementos requeridos
  for (const element of expectation.requiredElements) {
    const locator = page.locator(element.selector).first();
    const isVisible = await locator.isVisible({ timeout: 3000 }).catch(() => false);

    if (!isVisible) {
      if (element.critical) {
        criticalErrors.push(`Falta elemento crítico: ${element.description} (${element.selector})`);
      } else {
        warnings.push(`Falta elemento: ${element.description}`);
      }
    }
  }

  // Verificar elementos opcionales
  if (expectation.optionalChecks) {
    for (const check of expectation.optionalChecks) {
      const locator = page.locator(check.selector).first();
      const isVisible = await locator.isVisible({ timeout: 1000 }).catch(() => false);

      if (!isVisible) {
        warnings.push(`Elemento opcional no encontrado: ${check.description}`);
      }
    }
  }

  // Capturar screenshot
  const screenshotName = `${expectation.name.toLowerCase().replace(/\s+/g, '-')}.png`;
  const screenshotPath = `screenshots/${screenshotName}`;

  await page.screenshot({
    path: `demo-output/${screenshotPath}`,
    fullPage: true
  });

  // Adjuntar screenshot al reporte
  await testInfo.attach(expectation.name, {
    path: `demo-output/${screenshotPath}`,
    contentType: 'image/png',
  });

  const result: ValidationResult = {
    screen: expectation.name,
    passed: criticalErrors.length === 0,
    criticalErrors,
    warnings,
    screenshot: screenshotPath,
  };

  logger.addResult(result);
  return result;
}

// ============================================
// TEST PRINCIPAL CON VALIDACIÓN
// ============================================
test.describe('Demo Completa con Validación de Contenido', () => {
  let logger: ValidationLogger;

  test.beforeAll(async () => {
    // Crear directorio para screenshots
    const fs = await import('fs');
    const dir = 'demo-output/screenshots';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  test.beforeEach(() => {
    logger = new ValidationLogger();
  });

  test.afterEach(async ({}, testInfo) => {
    // Imprimir reporte final
    logger.printFinalReport();

    // Adjuntar reporte JSON
    await testInfo.attach('validation-report.json', {
      body: JSON.stringify({
        summary: logger.getSummary(),
        results: logger.getResults(),
      }, null, 2),
      contentType: 'application/json',
    });

    // Fallar el test si hay errores críticos
    const summary = logger.getSummary();
    if (summary.failed > 0) {
      throw new Error(`${summary.failed} pantalla(s) fallaron la validación. Ver reporte adjunto.`);
    }
  });

  test('Validar todas las pantallas de la aplicación', async ({ page }, testInfo) => {
    // =====================================================
    // AUTENTICACIÓN
    // =====================================================
    logger.startStep(1, 'Autenticación como ADMIN');

    const tokens = await getAdminTokens();
    await applySession(page, tokens, '/dashboard');
    await page.waitForLoadState('networkidle');
    await observe(page);

    // =====================================================
    // DASHBOARD
    // =====================================================
    logger.startStep(2, 'Validar Dashboard');
    await validateScreen(page, SCREEN_EXPECTATIONS.dashboard, logger, testInfo);
    await scrollDown(page, 400);
    await observe(page);

    // =====================================================
    // DEPARTAMENTOS
    // =====================================================
    logger.startStep(3, 'Validar Departamentos');
    await navigateTo(page, 'Departamentos');
    await validateScreen(page, SCREEN_EXPECTATIONS.departamentos, logger, testInfo);
    await observe(page);

    // Probar crear departamento
    const timestamp = Date.now();
    await moveAndClick(page, 'button:has-text("Crear Departamento")');
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    await read(page);

    await typeFast(page, '#nombre', `Demo Validación ${timestamp.toString().slice(-6)}`);
    await typeFast(page, '#codigo', `DV${timestamp.toString().slice(-4)}`);
    await moveAndClick(page, '[role="dialog"] button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await read(page);

    // =====================================================
    // EMPLEADOS
    // =====================================================
    logger.startStep(4, 'Validar Empleados');
    await navigateTo(page, 'Empleados');
    await validateScreen(page, SCREEN_EXPECTATIONS.empleados, logger, testInfo);
    await scrollDown(page, 300);
    await observe(page);

    // =====================================================
    // PLANTILLAS
    // =====================================================
    logger.startStep(5, 'Validar Plantillas de Onboarding');
    await navigateTo(page, 'Plantillas');
    await validateScreen(page, SCREEN_EXPECTATIONS.plantillas, logger, testInfo);
    await observe(page);

    // =====================================================
    // ONBOARDING
    // =====================================================
    logger.startStep(6, 'Validar Procesos de Onboarding');
    await navigateTo(page, 'Onboarding');
    await validateScreen(page, SCREEN_EXPECTATIONS.onboarding, logger, testInfo);
    await observe(page);

    // =====================================================
    // PROYECTOS
    // =====================================================
    logger.startStep(7, 'Validar Proyectos');
    await navigateTo(page, 'Proyectos');
    await validateScreen(page, SCREEN_EXPECTATIONS.proyectos, logger, testInfo);
    await observe(page);

    // =====================================================
    // TIMETRACKING
    // =====================================================
    logger.startStep(8, 'Validar Timetracking');
    await navigateTo(page, 'Timetracking');
    await validateScreen(page, SCREEN_EXPECTATIONS.timetracking, logger, testInfo);

    // Verificar cada tab
    const tabs = page.locator('[role="tab"]');
    const tabCount = await tabs.count();

    for (let i = 0; i < tabCount; i++) {
      await tabs.nth(i).click();
      await page.waitForLoadState('networkidle');
      await read(page);

      const tabName = await tabs.nth(i).textContent();
      await page.screenshot({
        path: `demo-output/screenshots/timetracking-tab-${i + 1}-${tabName?.toLowerCase().replace(/\s+/g, '-') || i}.png`,
        fullPage: true,
      });
    }
    await observe(page);

    // =====================================================
    // MIS TAREAS
    // =====================================================
    logger.startStep(9, 'Validar Mis Tareas');
    await page.goto('/mis-tareas');
    await page.waitForLoadState('networkidle');
    await validateScreen(page, SCREEN_EXPECTATIONS.misTareas, logger, testInfo);
    await observe(page);

    // =====================================================
    // PERFIL
    // =====================================================
    logger.startStep(10, 'Validar Perfil de Usuario');
    await page.goto('/perfil');
    await page.waitForLoadState('networkidle');
    await validateScreen(page, SCREEN_EXPECTATIONS.perfil, logger, testInfo);
    await observe(page);

    // =====================================================
    // RESUMEN FINAL
    // =====================================================
    logger.startStep(11, 'Validación Completada');

    // Volver al dashboard para screenshot final
    await navigateTo(page, 'Dashboard');
    await observe(page);

    console.log('\n✅ Validación de todas las pantallas completada');
  });
});
