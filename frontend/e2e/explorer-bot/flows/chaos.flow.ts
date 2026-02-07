import { ExplorerBot } from '../bot';
import type { FlowResult } from './departamentos.flow';

/**
 * Flow de Exploración Caótica (Chaos Testing)
 * Hace clicks aleatorios y busca bugs inesperados
 */

export async function exploreChaos(
  bot: ExplorerBot,
  options: { actions?: number; maxDepth?: number } = {}
): Promise<FlowResult> {
  const actions = options.actions || 30;
  const maxDepth = options.maxDepth || 5;
  
  const startTime = Date.now();
  let actionsPerformed = 0;
  let errorsFoundDuringExploration = 0;
  
  console.log(`\n🎲 Explorando: Chaos Mode (${actions} acciones)`);
  
  try {
    // Empezar en dashboard
    await bot.navigate('/dashboard');
    await bot.waitForPageLoad();
    
    const visitedPages = new Set<string>();
    let currentDepth = 0;
    
    for (let i = 0; i < actions; i++) {
      try {
        console.log(`\n  🎯 Acción ${i + 1}/${actions}`);
        
        // Detectar si nos perdimos
        const isLost = await bot.isLost();
        if (isLost) {
          console.log('    ⚠️  Página de error detectada, volviendo a estado seguro');
          await bot.navigateToSafeState();
          currentDepth = 0;
          continue;
        }
        
        // Registrar página actual
        const currentURL = bot.page.url();
        visitedPages.add(currentURL);
        
        // Si alcanzamos profundidad máxima, volver atrás
        if (currentDepth >= maxDepth) {
          console.log('    ↩️  Profundidad máxima alcanzada, volviendo atrás');
          await bot.page.goBack();
          currentDepth--;
          await bot.wait(500);
          continue;
        }
        
        // Elegir acción aleatoria
        const actionType = Math.random();
        
        if (actionType < 0.6) {
          // 60%: Click en elemento clickable aleatorio
          const clickable = await bot.findRandomClickable();
          const text = await clickable.textContent().catch(() => 'unknown');
          console.log(`    🖱️  Click aleatorio: "${text}"`);
          
          await bot.click(clickable);
          actionsPerformed++;
          currentDepth++;
          
        } else if (actionType < 0.8) {
          // 20%: Navegar a página aleatoria conocida
          const pages = [
            '/dashboard',
            '/admin/departamentos',
            '/admin/empleados',
            '/proyectos',
            '/timetracking',
            '/mis-tareas',
            '/perfil',
          ];
          const randomPage = pages[Math.floor(Math.random() * pages.length)];
          console.log(`    🔀 Navegación aleatoria: ${randomPage}`);
          
          await bot.navigate(randomPage);
          actionsPerformed++;
          currentDepth = 1;
          
        } else {
          // 20%: Hacer scroll aleatorio
          console.log('    📜 Scroll aleatorio');
          const scrollAmount = Math.floor(Math.random() * 500) + 200;
          await bot.page.mouse.wheel(0, scrollAmount);
          await bot.wait(300);
          actionsPerformed++;
        }
        
        // Esperar un poco
        await bot.wait(500);
        
        // Detectar errores después de cada acción
        await bot.detectAllErrors();
        
        // Si encontramos errores nuevos, capturar screenshot
        const currentErrors = await bot.page.evaluate(() => {
          return window.console.error.length || 0;
        }).catch(() => 0);
        
        if (currentErrors > errorsFoundDuringExploration) {
          console.log(`    🐛 Errores detectados después de acción ${i + 1}`);
          await bot.captureScreenshot(`chaos-error-action-${i + 1}`);
          errorsFoundDuringExploration = currentErrors;
        }
        
      } catch (error) {
        console.log(`    ⚠️  Error en acción ${i + 1}: ${error}`);
        await bot.captureScreenshot(`chaos-exception-action-${i + 1}`);
        
        // Intentar recuperarse
        await bot.navigateToSafeState();
        currentDepth = 0;
      }
    }
    
    console.log(`\n📊 Exploración caótica completada:`);
    console.log(`   - Páginas visitadas: ${visitedPages.size}`);
    console.log(`   - Acciones realizadas: ${actionsPerformed}`);
    console.log(`   - Errores encontrados: ${errorsFoundDuringExploration}`);
    
    return {
      name: 'Chaos Exploration',
      success: true,
      duration: Date.now() - startTime,
      actionsPerformed,
      errorsFound: errorsFoundDuringExploration,
    };
    
  } catch (error) {
    console.log(`❌ Flow Chaos falló: ${error}`);
    
    return {
      name: 'Chaos Exploration',
      success: false,
      duration: Date.now() - startTime,
      actionsPerformed,
      errorsFound: errorsFoundDuringExploration,
    };
  }
}

/**
 * Versión enfocada: Chaos en una sola página
 */
export async function explorerChaosOnPage(
  bot: ExplorerBot,
  page: string,
  actions = 20
): Promise<FlowResult> {
  const startTime = Date.now();
  let actionsPerformed = 0;
  
  console.log(`\n🎲 Chaos en página: ${page}`);
  
  try {
    await bot.navigate(page);
    await bot.waitForPageLoad();
    
    for (let i = 0; i < actions; i++) {
      try {
        const clickable = await bot.findRandomClickable();
        await bot.click(clickable);
        actionsPerformed++;
        
        await bot.wait(300);
        await bot.detectAllErrors();
        
      } catch {
        console.log(`    ⚠️  Error en acción ${i + 1}`);
        // Continuar con siguiente acción
      }
    }
    
    return {
      name: `Chaos on ${page}`,
      success: true,
      duration: Date.now() - startTime,
      actionsPerformed,
      errorsFound: 0,
    };
    
  } catch {
    return {
      name: `Chaos on ${page}`,
      success: false,
      duration: Date.now() - startTime,
      actionsPerformed,
      errorsFound: 0,
    };
  }
}
