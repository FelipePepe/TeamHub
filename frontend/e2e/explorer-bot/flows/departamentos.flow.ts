import { ExplorerBot } from '../bot';

/**
 * Flow de exploración: Gestión de Departamentos
 * Prueba el CRUD completo con validaciones de comportamiento
 */

export interface FlowResult {
  name: string;
  success: boolean;
  duration: number;
  actionsPerformed: number;
  errorsFound: number;
}

export async function exploreDepartamentos(bot: ExplorerBot): Promise<FlowResult> {
  const startTime = Date.now();
  let actionsPerformed = 0;
  
  console.log('\n📂 Explorando: Gestión de Departamentos');
  
  try {
    // ============================================
    // 1. NAVEGAR A DEPARTAMENTOS
    // ============================================
    await bot.navigate('/admin/departamentos');
    await bot.waitForPageLoad();
    actionsPerformed++;
    
    // ============================================
    // 2. CREAR DEPARTAMENTO
    // ============================================
    const deptName = bot.generateRandomName('Dept Test');
    const deptCode = bot.generateRandomCode(4);
    
    await bot.clickButton('Crear Departamento');
    await bot.expectModal('abierto', { timeout: 3000 });
    actionsPerformed++;
    
    await bot.fillForm({
      nombre: deptName,
      codigo: deptCode,
      descripcion: bot.generateRandomText(10),
    });
    actionsPerformed++;
    
    await bot.submitForm();
    actionsPerformed++;
    
    // Validación: Toast de éxito
    await bot.expectToast('éxito');
    await bot.expectModal('cerrado');
    actionsPerformed++;
    
    // Validación: Aparece en listado
    await bot.expectInList(deptName, {
      container: 'main',
      timeout: 5000,
    });
    actionsPerformed++;
    
    await bot.wait(1000);
    
    // ============================================
    // 3. EDITAR DEPARTAMENTO
    // ============================================
    const updatedName = deptName + ' Updated';
    
    await bot.clickRowAction(deptName, 'Editar');
    await bot.expectModal('abierto');
    actionsPerformed++;
    
    await bot.fillField('nombre', updatedName);
    await bot.submitForm();
    actionsPerformed++;
    
    // Validación: Cambios reflejados
    await bot.expectToast('éxito');
    await bot.expectInList(updatedName);
    await bot.expectNotInList(deptName); // El anterior no debe existir
    actionsPerformed++;
    
    await bot.wait(1000);
    
    // ============================================
    // 4. ELIMINAR DEPARTAMENTO
    // ============================================
    await bot.clickRowAction(updatedName, 'Eliminar');
    await bot.confirm();
    actionsPerformed++;
    
    // Validación: Ya no existe
    await bot.expectToast('éxito');
    await bot.expectNotInList(updatedName);
    actionsPerformed++;
    
    await bot.wait(1000);
    
    // ============================================
    // 5. DETECTAR ERRORES
    // ============================================
    await bot.detectAllErrors();
    
    console.log('✅ Flow Departamentos completado exitosamente');
    
    return {
      name: 'Departamentos',
      success: true,
      duration: Date.now() - startTime,
      actionsPerformed,
      errorsFound: 0, // Se contarán después
    };
    
  } catch (error) {
    console.log(`❌ Flow Departamentos falló: ${error}`);
    await bot.captureScreenshot('departamentos-error');
    
    return {
      name: 'Departamentos',
      success: false,
      duration: Date.now() - startTime,
      actionsPerformed,
      errorsFound: 0,
    };
  }
}

/**
 * Flow adicional: Validar errores de formulario
 */
export async function exploreDepartamentosEdgeCases(bot: ExplorerBot): Promise<FlowResult> {
  const startTime = Date.now();
  let actionsPerformed = 0;
  
  console.log('\n🔍 Explorando: Edge Cases de Departamentos');
  
  try {
    await bot.navigate('/admin/departamentos');
    await bot.waitForPageLoad();
    
    // ============================================
    // TEST 1: Código duplicado
    // ============================================
    console.log('  🧪 Test: Código duplicado');
    
    // Crear primer departamento
    const code = bot.generateRandomCode(4);
    await bot.clickButton('Crear Departamento');
    await bot.expectModal('abierto');
    
    await bot.fillForm({
      nombre: 'Test Duplicate 1',
      codigo: code,
    });
    await bot.submitForm();
    await bot.expectToast('éxito');
    actionsPerformed++;
    
    // Intentar crear otro con mismo código
    await bot.clickButton('Crear Departamento');
    await bot.expectModal('abierto');
    
    await bot.fillForm({
      nombre: 'Test Duplicate 2',
      codigo: code, // MISMO CÓDIGO
    });
    await bot.submitForm();
    
    // Debe mostrar error (toast o mensaje en form)
    await bot.expectToast('error').catch(() => {
      console.log('    ⚠️  No se detectó toast de error para código duplicado');
    });
    
    actionsPerformed++;
    
    // ============================================
    // TEST 2: Campos vacíos
    // ============================================
    console.log('  🧪 Test: Campos requeridos vacíos');
    
    // Limpiar modal si quedó abierto
    const modalOpen = await bot.page.locator('[role="dialog"]').count();
    if (modalOpen > 0) {
      await bot.page.keyboard.press('Escape');
      await bot.wait(500);
    }
    
    await bot.clickButton('Crear Departamento');
    await bot.expectModal('abierto');
    
    // Intentar submit sin llenar nada
    await bot.submitForm();
    
    // Form debe mostrar errores de validación
    await bot.checkBehavior([
      {
        name: 'Form validation on empty fields',
        expected: 'Debe mostrar errores de validación',
        severity: 'medium',
        validate: async (page) => {
          const hasErrors = await page.locator('[class*="error"], .text-destructive').count() > 0;
          return {
            passed: hasErrors,
            message: hasErrors 
              ? 'Errores de validación mostrados correctamente'
              : 'No se muestran errores de validación en campos vacíos',
            actual: hasErrors ? 'Errores visibles' : 'Sin errores visibles',
          };
        },
      },
    ]);
    
    actionsPerformed++;
    
    await bot.detectAllErrors();
    
    return {
      name: 'Departamentos Edge Cases',
      success: true,
      duration: Date.now() - startTime,
      actionsPerformed,
      errorsFound: 0,
    };
    
  } catch (error) {
    console.log(`❌ Flow Edge Cases falló: ${error}`);
    
    return {
      name: 'Departamentos Edge Cases',
      success: false,
      duration: Date.now() - startTime,
      actionsPerformed,
      errorsFound: 0,
    };
  }
}
