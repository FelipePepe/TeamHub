import { test, expect } from '@playwright/test';
import { getAdminTokens, applySession } from '../helpers/e2e-session';
import { observe, waitForLoad } from './demo.helpers';
import {
  OperationLogger,
} from './crud.helpers';
import { ErrorMonitor } from './monitoring/error-detection';
import {
  navigateToDepartamentos,
  createDepartmentAndVerify,
  searchDepartment,
  editDepartmentAndVerify,
  deleteDepartmentAndVerify,
  type DepartamentoData,
} from './entities/departamentos.crud';

/**
 * DEMO CRUD COMPLETO - Validación de operaciones Create, Read, Update, Delete
 * 
 * Este test demuestra el flujo completo de CRUD con:
 * - Capturas de pantalla antes/después de cada operación
 * - Validación de toast messages
 * - Verificación de datos en listado
 * - Detección de errores (console, network, visual)
 * - Reporte detallado con métricas
 */

test.describe('Demo CRUD Completo con Validación', () => {
  let logger: OperationLogger;
  let errorMonitor: ErrorMonitor;

  test.beforeEach(async () => {
    logger = new OperationLogger();
    errorMonitor = new ErrorMonitor();
  });

  test.afterEach(async ({}, testInfo) => {
    // Imprimir reportes
    logger.printReport();
    errorMonitor.printSummary();

    // Adjuntar reportes al test
    await testInfo.attach('operations-report.json', {
      body: logger.exportToJSON(),
      contentType: 'application/json',
    });

    await testInfo.attach('errors-report.json', {
      body: errorMonitor.generateReport(),
      contentType: 'application/json',
    });

    // Guardar reportes en archivos
    await errorMonitor.saveReport(`errors-${testInfo.title.replace(/\s+/g, '-')}.json`);

    // Fallar el test si hay operaciones fallidas críticas
    const summary = logger.getSummary();
    if (summary.failed > 0) {
      const failedOps = logger.getOperations().filter(o => !o.success);
      const criticalErrors = failedOps.filter(o => 
        o.errors.some(e => e.type === 'console' || e.type === 'network')
      );
      
      if (criticalErrors.length > 0) {
        throw new Error(
          `${criticalErrors.length} operación(es) crítica(s) fallaron. Ver reporte adjunto.`
        );
      }
    }
  });

  test('CRUD completo de Departamentos', async ({ page }) => {
    // =====================================================
    // SETUP: Autenticación y monitoreo
    // =====================================================
    console.log('\n🔐 Autenticando como ADMIN...');
    const tokens = await getAdminTokens();
    await applySession(page, tokens, '/dashboard');
    await waitForLoad(page);

    // Activar monitoreo de errores
    await errorMonitor.setup(page);
    await observe(page);

    // =====================================================
    // NAVEGACIÓN: Ir a Departamentos
    // =====================================================
    const navResult = await navigateToDepartamentos(page, logger);
    logger.addOperation(navResult);

    if (!navResult.success) {
      throw new Error('Error navegando a Departamentos');
    }

    // =====================================================
    // CREATE: Crear nuevo departamento
    // =====================================================
    const timestamp = Date.now().toString().slice(-6);
    const departamentoData: DepartamentoData = {
      nombre: `Demo CRUD ${timestamp}`,
      codigo: `DC${timestamp.slice(-4)}`,
      descripcion: 'Departamento creado por test automatizado',
      color: '#FF6B6B',
    };

    const createResult = await createDepartmentAndVerify(
      page,
      departamentoData,
      logger,
      errorMonitor
    );
    logger.addOperation(createResult);

    if (!createResult.success) {
      throw new Error('Error creando departamento');
    }

    await observe(page);

    // =====================================================
    // READ: Buscar departamento creado
    // =====================================================
    const searchResult = await searchDepartment(
      page,
      departamentoData.nombre,
      logger
    );
    logger.addOperation(searchResult);

    expect(searchResult.success).toBe(true);
    await observe(page);

    // =====================================================
    // UPDATE: Editar departamento
    // =====================================================
    const updatedData: Partial<DepartamentoData> = {
      nombre: `Demo CRUD Updated ${timestamp}`,
      descripcion: 'Descripción actualizada por test',
      color: '#4ECDC4',
    };

    const updateResult = await editDepartmentAndVerify(
      page,
      departamentoData.nombre,
      updatedData,
      logger,
      errorMonitor
    );
    logger.addOperation(updateResult);

    if (!updateResult.success) {
      throw new Error('Error editando departamento');
    }

    await observe(page);

    // =====================================================
    // DELETE: Eliminar departamento
    // =====================================================
    const deleteResult = await deleteDepartmentAndVerify(
      page,
      updatedData.nombre!,
      logger,
      errorMonitor
    );
    logger.addOperation(deleteResult);

    if (!deleteResult.success) {
      throw new Error('Error eliminando departamento');
    }

    await observe(page);

    // =====================================================
    // VALIDACIÓN FINAL
    // =====================================================
    console.log('\n✅ CRUD completo de Departamentos finalizado');

    // Verificar métricas
    const summary = logger.getSummary();
    console.log(`\n📊 Métricas:`);
    console.log(`   - Operaciones totales: ${summary.total}`);
    console.log(`   - Exitosas: ${summary.successful}`);
    console.log(`   - Fallidas: ${summary.failed}`);
    console.log(`   - Duración total: ${(summary.totalDuration / 1000).toFixed(1)}s`);

    // Aserciones finales
    expect(summary.successful).toBeGreaterThanOrEqual(5); // Navigate, Create, Read, Update, Delete
    expect(summary.failed).toBe(0);
  });

  test('CRUD Departamentos con validación de errores', async ({ page }) => {
    // =====================================================
    // SETUP
    // =====================================================
    console.log('\n🔐 Autenticando como ADMIN...');
    const tokens = await getAdminTokens();
    await applySession(page, tokens, '/dashboard');
    await waitForLoad(page);

    await errorMonitor.setup(page);

    // =====================================================
    // NAVEGACIÓN
    // =====================================================
    const navResult = await navigateToDepartamentos(page, logger);
    logger.addOperation(navResult);

    // =====================================================
    // TEST: Intentar crear departamento con código duplicado
    // =====================================================
    console.log('\n🧪 Test: Código duplicado...');
    
    // Primero crear uno válido
    const timestamp = Date.now().toString().slice(-6);
    const validData: DepartamentoData = {
      nombre: `Dept Valid ${timestamp}`,
      codigo: `DV${timestamp.slice(-4)}`,
    };

    const createResult1 = await createDepartmentAndVerify(
      page,
      validData,
      logger,
      errorMonitor
    );
    logger.addOperation(createResult1);

    // Intentar crear otro con el mismo código (debería fallar)
    const duplicateData: DepartamentoData = {
      nombre: `Dept Duplicate ${timestamp}`,
      codigo: validData.codigo, // Mismo código
    };

    const createResult2 = await createDepartmentAndVerify(
      page,
      duplicateData,
      logger,
      errorMonitor
    );
    logger.addOperation(createResult2);

    // Validar que falló por código duplicado
    const hasNetworkError = createResult2.errors.some(e => 
      e.type === 'network' && e.message.includes('4')
    );
    
    console.log(hasNetworkError 
      ? '    ✅ Error de código duplicado detectado correctamente'
      : '    ⚠️  Error de código duplicado no detectado'
    );

    // Limpiar: eliminar el departamento válido
    await deleteDepartmentAndVerify(page, validData.nombre, logger, errorMonitor);

    await observe(page);

    console.log('\n✅ Validación de errores completada');
  });

  test('CRUD múltiples Departamentos en secuencia', async ({ page }) => {
    // =====================================================
    // SETUP
    // =====================================================
    console.log('\n🔐 Autenticando como ADMIN...');
    const tokens = await getAdminTokens();
    await applySession(page, tokens, '/dashboard');
    await waitForLoad(page);

    await errorMonitor.setup(page);

    // =====================================================
    // NAVEGACIÓN
    // =====================================================
    const navResult = await navigateToDepartamentos(page, logger);
    logger.addOperation(navResult);

    // =====================================================
    // CREAR MÚLTIPLES DEPARTAMENTOS
    // =====================================================
    const departamentos: DepartamentoData[] = [
      { nombre: 'Desarrollo', codigo: 'DEV', color: '#3B82F6' },
      { nombre: 'Marketing', codigo: 'MKT', color: '#EF4444' },
      { nombre: 'Recursos Humanos', codigo: 'RRHH', color: '#10B981' },
    ];

    console.log(`\n📦 Creando ${departamentos.length} departamentos...`);

    for (const dept of departamentos) {
      const createResult = await createDepartmentAndVerify(
        page,
        dept,
        logger,
        errorMonitor
      );
      logger.addOperation(createResult);
      
      expect(createResult.success).toBe(true);
    }

    await observe(page);

    // =====================================================
    // ELIMINAR TODOS
    // =====================================================
    console.log(`\n🧹 Eliminando ${departamentos.length} departamentos...`);

    for (const dept of departamentos) {
      const deleteResult = await deleteDepartmentAndVerify(
        page,
        dept.nombre,
        logger,
        errorMonitor
      );
      logger.addOperation(deleteResult);
      
      expect(deleteResult.success).toBe(true);
    }

    await observe(page);

    // =====================================================
    // VALIDACIÓN FINAL
    // =====================================================
    const summary = logger.getSummary();
    console.log(`\n📊 Total operaciones: ${summary.total}`);
    console.log(`   ✅ Exitosas: ${summary.successful}`);
    console.log(`   ❌ Fallidas: ${summary.failed}`);

    // Debe haber 1 nav + 3 creates + 3 deletes = 7 operaciones mínimo
    expect(summary.successful).toBeGreaterThanOrEqual(7);
    expect(summary.failed).toBe(0);

    console.log('\n✅ CRUD múltiple completado exitosamente');
  });
});
