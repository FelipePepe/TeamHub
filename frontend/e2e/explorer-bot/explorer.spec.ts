import { test } from '@playwright/test';
import { getAdminTokens, applySession } from '../helpers/e2e-session';
import { AdvancedErrorDetector } from './detector';
import { ExplorerBot } from './bot';
import { exploreDepartamentos, exploreDepartamentosEdgeCases } from './flows/departamentos.flow';
import { exploreChaos } from './flows/chaos.flow';
import type { FlowResult } from './flows/departamentos.flow';

/**
 * EXPLORER BOT - Testing Exploratorio Automatizado
 * 
 * Este sistema explora la aplicación como un usuario real:
 * - Ejecuta flujos de usuario completos
 * - Detecta 5 tipos de errores automáticamente
 * - Genera reportes detallados con screenshots
 * - Puede ejecutar exploración caótica (chaos testing)
 */

test.describe('Explorer Bot - Testing Exploratorio', () => {
  let detector: AdvancedErrorDetector;
  let bot: ExplorerBot;
  const flowResults: FlowResult[] = [];

  test.beforeEach(async ({ page }) => {
    // Crear detector y bot
    detector = new AdvancedErrorDetector(page, {
      javascript: true,
      network: true,
      visual: true,
      behavior: true,
      performance: true,
    });
    
    bot = new ExplorerBot(page, detector, {
      baseURL: 'http://localhost:3000',
      timeout: 10000,
      screenshotOnError: true,
      verbose: true,
    });
    
    // Autenticación
    console.log('\n🔐 Autenticando como ADMIN...');
    const tokens = await getAdminTokens();
    await applySession(page, tokens, '/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Activar detector
    await detector.setup();
    
    console.log('✅ Bot listo para explorar\n');
  });

  test.afterEach(async ({}, testInfo) => {
    // Generar reporte de errores
    const errors = detector.getErrors();
    const summary = detector.getSummary();
    
    console.log('\n' + '='.repeat(70));
    console.log('               REPORTE DE EXPLORACIÓN');
    console.log('='.repeat(70));
    console.log(`Flows ejecutados: ${flowResults.length}`);
    console.log(`Errores totales encontrados: ${summary.total}`);
    console.log(`  - JavaScript:  ${summary.byType.javascript}`);
    console.log(`  - Network:     ${summary.byType.network}`);
    console.log(`  - Visual:      ${summary.byType.visual}`);
    console.log(`  - Behavior:    ${summary.byType.behavior}`);
    console.log(`  - Performance: ${summary.byType.performance}`);
    console.log('');
    console.log('Por severidad:');
    console.log(`  - Críticos: ${summary.bySeverity.critical}`);
    console.log(`  - Altos:    ${summary.bySeverity.high}`);
    console.log(`  - Medios:   ${summary.bySeverity.medium}`);
    console.log(`  - Bajos:    ${summary.bySeverity.low}`);
    console.log('='.repeat(70));
    
    // Mostrar errores críticos y altos
    const criticalErrors = detector.getErrorsBySeverity('critical');
    const highErrors = detector.getErrorsBySeverity('high');
    
    if (criticalErrors.length > 0) {
      console.log('\n💥 ERRORES CRÍTICOS:');
      criticalErrors.forEach((err, i) => {
        console.log(`\n${i + 1}. [${err.type}] ${err.message}`);
        console.log(`   URL: ${err.context.url}`);
        console.log(`   Acción: ${err.context.userAction}`);
        if (err.suggestedFix) {
          console.log(`   💡 Fix sugerido: ${err.suggestedFix}`);
        }
      });
    }
    
    if (highErrors.length > 0) {
      console.log('\n🔴 ERRORES ALTOS:');
      highErrors.slice(0, 5).forEach((err, i) => { // Solo primeros 5
        console.log(`\n${i + 1}. [${err.type}] ${err.message.slice(0, 100)}`);
        console.log(`   URL: ${err.context.url}`);
      });
    }
    
    // Adjuntar reportes
    await testInfo.attach('explorer-errors.json', {
      body: JSON.stringify({
        summary,
        flows: flowResults,
        errors: errors.map(e => ({
          ...e,
          // Limitar tamaño de stackTrace
          stackTrace: e.stackTrace?.slice(0, 500),
        })),
      }, null, 2),
      contentType: 'application/json',
    });
    
    // Fallar el test si hay errores críticos
    if (criticalErrors.length > 0) {
      throw new Error(
        `${criticalErrors.length} error(es) crítico(s) encontrado(s) durante la exploración`
      );
    }
  });

  /**
   * TEST 1: Flujo completo de Departamentos
   */
  test('Explorar: Gestión de Departamentos', async () => {
    const result = await exploreDepartamentos(bot);
    flowResults.push(result);
    
    // Actualizar contador de errores
    result.errorsFound = detector.getErrors().length;
    
    if (!result.success) {
      throw new Error('Flow de Departamentos falló');
    }
  });

  /**
   * TEST 2: Edge cases de Departamentos
   */
  test('Explorar: Edge Cases de Departamentos', async () => {
    const result = await exploreDepartamentosEdgeCases(bot);
    flowResults.push(result);
    
    result.errorsFound = detector.getErrors().length;
    
    if (!result.success) {
      throw new Error('Flow de Edge Cases falló');
    }
  });

  /**
   * TEST 3: Exploración caótica (clicks aleatorios)
   */
  test('Explorar: Chaos Mode (30 acciones aleatorias)', async () => {
    const result = await exploreChaos(bot, {
      actions: 30,
      maxDepth: 5,
    });
    flowResults.push(result);
    
    result.errorsFound = detector.getErrors().length;
    
    // Chaos mode no falla si encuentra errores, solo los reporta
    console.log(`\n✅ Chaos Mode completado (errores: ${result.errorsFound})`);
  });

  /**
   * TEST 4: Suite completa (todos los flows)
   */
  test('Explorar: Suite Completa', async () => {
    console.log('\n🚀 Iniciando exploración completa de TeamHub\n');
    
    // Flow 1: Departamentos
    const dept = await exploreDepartamentos(bot);
    dept.errorsFound = detector.getErrors().length;
    flowResults.push(dept);
    
    detector.clear(); // Limpiar para próximo flow
    
    // Flow 2: Edge Cases
    const edgeCases = await exploreDepartamentosEdgeCases(bot);
    edgeCases.errorsFound = detector.getErrors().length;
    flowResults.push(edgeCases);
    
    detector.clear();
    
    // Flow 3: Chaos limitado (10 acciones)
    const chaos = await exploreChaos(bot, { actions: 10, maxDepth: 3 });
    chaos.errorsFound = detector.getErrors().length;
    flowResults.push(chaos);
    
    // Resumen de flows
    console.log('\n' + '─'.repeat(70));
    console.log('RESUMEN DE FLOWS EJECUTADOS');
    console.log('─'.repeat(70));
    
    flowResults.forEach((flow, i) => {
      const status = flow.success ? '✅' : '❌';
      const duration = (flow.duration / 1000).toFixed(1);
      console.log(
        `${i + 1}. ${status} ${flow.name} (${duration}s, ${flow.actionsPerformed} acciones, ${flow.errorsFound} errores)`
      );
    });
    
    const totalErrors = flowResults.reduce((sum, f) => sum + f.errorsFound, 0);
    const totalActions = flowResults.reduce((sum, f) => sum + f.actionsPerformed, 0);
    const successRate = (flowResults.filter(f => f.success).length / flowResults.length) * 100;
    
    console.log('─'.repeat(70));
    console.log(`Total acciones: ${totalActions}`);
    console.log(`Total errores: ${totalErrors}`);
    console.log(`Tasa de éxito: ${successRate.toFixed(0)}%`);
    console.log('─'.repeat(70));
  });
});
