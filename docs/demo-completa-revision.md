# Revisión: Demo Completa vs prompt-demo-completa.md

Este documento compara lo descrito en `docs/prompt-demo-completa.md` con la implementación actual de la demo E2E.

---

## ✅ Lo que está implementado y alineado

| Elemento | Estado |
|----------|--------|
| **Archivo de destino** | `frontend/e2e/demo/complete-demo.spec.ts` existe |
| **Playwright demo config** | `playwright.demo.config.ts`: `video: 'on'`, viewport 1920×1080, timeout 300_000, slowMo en launchOptions, demo-report, demo-output |
| **Scripts npm** | `demo` (headed) y `demo:record` en `frontend/package.json` |
| **DemoLogger** | Clase con `log`, `step`, `success`, `error`, `getSummary`, `exportLogs`; logs adjuntos al reporte en `afterEach` |
| **DemoData** | Objeto con `departamento`, `proyecto`, `timeEntry` (y `timestamp`) |
| **Helpers demo** | `think`, `read`, `observe`, `moveAndClick`, `typeNaturally`, `typeFast`, `scrollDown`, `navigateTo`, `generateTotpCode`, `getDemoCredentials` |
| **e2e-session** | `getAdminTokens`, `applySession`, `loginViaApiWithRetry`, `getAuthApiHelper` |
| **Rutas / UI** | Dashboard, Departamentos, Empleados, Plantillas, Onboarding, Proyectos, Timetracking, Mis Tareas, Perfil existen; sidebar usa los títulos esperados |
| **Timetracking** | Tabs: "Mis Registros", "Timesheet Semanal", "Diagrama Gantt"; Gantt con SVG |
| **Test secundario** | "Demo visual con login MFA manual" hace login visual + MFA + recorrido por menús |
| **complete-demo-validated.spec.ts** | Define expectativas por pantalla y validaciones de contenido |

---

## ❌ Diferencias y lo que falta respecto al prompt

### 1. Flujo principal: login por API vs login visual MFA

- **Prompt:** Sección 1 = "Login y Autenticación MFA (ADMIN)" en la misma demo: ir a `/login`, rellenar email/contraseña, pantalla MFA, TOTP, redirección a dashboard.
- **Implementación:** El test principal usa `getAdminTokens()` + `applySession()` (login por API) para evitar rate limit. El login visual con MFA está en un **segundo test** ("Demo visual con login MFA manual").
- **Impacto:** La demo grabada no muestra el flujo de login+MFA en el video principal; solo el recorrido ya autenticado.

### 2. DemoData: falta objeto `empleado`

- **Prompt:** Incluye `DemoData.empleado` (nombre, apellido, email, dni, fechaNacimiento, fechaAlta, telefono, direccion) para crear un empleado en la Sección 4.
- **Implementación:** No existe `empleado` en `DemoData`. La Sección 4 es "Ver listado de Empleados" (solo navegación y comprobación de tabla), no creación.

**Consecuencia:** No se puede reutilizar un empleado recién creado en "Iniciar proceso de onboarding" ni en "Asignar al proyecto".

### 3. Sección 4: crear empleado

- **Prompt:** Crear nuevo empleado: botón "nuevo|crear|añadir", rellenar nombre, apellido, email, dni, departamento (el creado en paso 3), guardar, verificar email en lista.
- **Implementación:** Solo se navega a Empleados y se comprueba que hay tabla; no se abre el modal ni se crea empleado. En la app el botón es "Crear empleado".

### 4. Sección 6: iniciar proceso de onboarding

- **Prompt:** Click "iniciar|nuevo proceso", elegir empleado (el de la demo) y plantilla, iniciar, verificar texto "en curso|activo".
- **Implementación:** Solo navegación a Onboarding y comprobación de contenido; no se abre el modal "Iniciar proceso" ni se selecciona empleado/plantilla. La app tiene botón "Iniciar proceso" que abre `IniciarProcesoModal`.

### 5. Sección 7: asignar empleado al proyecto

- **Prompt:** Tras crear proyecto, click en el proyecto, "Asignar|añadir miembro", elegir empleado, guardar.
- **Implementación:** Solo creación de proyecto (con condicional si el botón "Crear" está visible); no se entra al detalle del proyecto ni se usa "Añadir asignación". En la app el detalle tiene "Añadir asignación".

### 6. Sección 8: nombres de tabs Timetracking

- **Prompt:** Tabs con nombre "weekly|semanal" y "gantt".
- **Implementación:** Se usan `tabs.nth(1)` y `tabs.nth(2)` en lugar de `getByRole('tab', { name: /.../ })`. La app tiene "Timesheet Semanal" y "Diagrama Gantt" (compatibles con el prompt si se usara el nombre).

### 7. Sección 9: completar una tarea

- **Prompt:** Ver lista de tareas, click en una, botón "completar|marcar", marcar como completada.
- **Implementación:** Solo navegación a Mis Tareas y scroll; no se interactúa con ninguna tarea ni se pulsa completar.

### 8. Secciones 11–13: cambio de rol y flujo EMPLEADO

- **Prompt:**  
  - 11: Cerrar sesión, login como empleado (email/contraseña + MFA).  
  - 12: Dashboard empleado (texto "mi progreso|mis proyectos|mi dedicación").  
  - 13: Timetracking → "nuevo|registrar", proyecto, horas, descripción, guardar, verificar "pendiente".
- **Implementación:** No existe este bloque. El test principal termina en paso 13 con "Verificación final" y "Volver al Dashboard"; no hay logout ni segundo usuario. El dashboard de empleado muestra KPIs como "Horas del mes", "Proyectos activos", "Mi ocupacion", "Tareas pendientes" (no exactamente los textos del prompt).

### 9. Verificación final: `noErrorsInPage`

- **Prompt:** `checks.noErrorsInPage` (count de `.error` o `[role="alert"][aria-live="assertive"]` === 0) y `expect(checks.noErrorsInPage).toBe(true)`.
- **Implementación:** Solo se comprueba `dashboardVisible` y `sessionActiva`; no se calcula ni se hace assert de `noErrorsInPage`.

### 10. Helpers: firma de `typeNaturally` y `moveAndClick`

- **Prompt:** Uso tipo `typeNaturally(page, text, locator)` y `moveAndClick(page, page.getByRole(...))` (segundo argumento = Locator).
- **Implementación:**  
  - `typeNaturally(page, selector: string, text: string)` (orden selector, texto).  
  - `moveAndClick(page, selector: string)`.  
  El código del prompt tal cual no es compatible con estas firmas (orden de argumentos y tipo selector vs Locator).

### 11. data-testid en UI

- **Prompt:** Uso de `[data-testid="user-nav"]` para menú de usuario.
- **Implementación:** `UserNav` no tiene `data-testid="user-nav"`. El spec usa fallbacks (p. ej. `button:has([class*="avatar"])`), por lo que funciona, pero el testid no está en la app.

### 12. Número de pasos

- **Prompt:** 14 pasos (incluyendo verificación final).
- **Implementación:** 13 pasos en el test principal (sin bloque EMPLEADO); el paso 14 del prompt equivale al 13 actual "Verificación final".

---

## Resumen ejecutivo

- **Implementado:** Configuración de demo, logger, datos de departamento/proyecto/tiempo, helpers (con firmas distintas a las del prompt), rutas y pantallas, test con login por API + recorrido completo como ADMIN, test opcional con login MFA visual, spec validado por pantalla.
- **Falta o difiere:**  
  - Login visual MFA en el flujo principal (está solo en test aparte).  
  - Objeto `DemoData.empleado` y **creación de empleado** en la demo.  
  - **Iniciar proceso de onboarding** (modal empleado + plantilla).  
  - **Asignar empleado al proyecto** en detalle de proyecto.  
  - **Completar una tarea** en Mis Tareas.  
  - **Bloque completo EMPLEADO:** logout, login empleado, dashboard empleado, **registrar horas**.  
  - Assert de `noErrorsInPage` en verificación final.  
  - Alinear helpers con el prompt (o actualizar el prompt a las firmas actuales) y, opcional, añadir `data-testid="user-nav"` para consistencia.

Si se quiere que la demo coincida al 100% con el prompt, hay que implementar los puntos de la sección "Diferencias y lo que falta" en `complete-demo.spec.ts` (y en la UI donde corresponda).
