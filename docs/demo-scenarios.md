# Demo Visual - TeamHub

## Configuración Playwright para Video

```typescript
// playwright.config.ts - añadir estas opciones
use: {
  video: 'on', // Graba siempre
  // video: 'retain-on-failure', // Solo si falla
  // video: 'on-first-retry', // Solo en reintentos
}
```

---

## Escenarios de Demo

### Escena 1: Autenticación con MFA
| Campo | Valor |
|-------|-------|
| **Ruta** | `/login` |
| **Duración estimada** | 30-45s |
| **Actor** | Usuario ADMIN |
| **Descripción** | Login completo con verificación MFA (TOTP) |

**Pasos:**
1. Navegar a `/login`
2. Ingresar credenciales (email + password)
3. Mostrar pantalla de verificación MFA
4. Ingresar código TOTP (6 dígitos)
5. Redirección automática a `/dashboard`

**Capturas clave:**
- Formulario de login vacío
- Formulario con credenciales
- Pantalla de MFA con input de código
- Dashboard tras login exitoso

---

### Escena 2: Dashboard Admin - KPIs y Gráficos
| Campo | Valor |
|-------|-------|
| **Ruta** | `/dashboard` |
| **Duración estimada** | 20-30s |
| **Actor** | Usuario ADMIN |
| **Descripción** | Mostrar panel principal con métricas y visualizaciones D3.js |

**Pasos:**
1. Mostrar sección de KPIs (6 tarjetas)
2. Scroll suave a gráficos
3. Hover sobre gráfico de usuarios por rol (pie chart)
4. Hover sobre gráfico de proyectos por estado (bar chart)
5. Mostrar tabla de actividad reciente

**Capturas clave:**
- Vista completa de KPIs
- Gráfico pie con tooltip
- Gráfico bar con tooltip
- Tabla de actividad

---

### Escena 3: Gestión de Empleados
| Campo | Valor |
|-------|-------|
| **Ruta** | `/admin/empleados` |
| **Duración estimada** | 40-50s |
| **Actor** | Usuario ADMIN o RRHH |
| **Descripción** | CRUD de usuarios con roles y departamentos |

**Pasos:**
1. Navegar a `/admin/empleados`
2. Mostrar listado con filtros
3. Click en "Crear usuario"
4. Completar formulario (nombre, email, rol, departamento)
5. Guardar y mostrar contraseña temporal
6. Cerrar modal y ver usuario en lista
7. Click en usuario para ver detalle

**Capturas clave:**
- Listado de empleados
- Modal de creación
- Formulario completado
- Contraseña temporal generada
- Detalle de empleado

---

### Escena 4: Editor de Plantillas Onboarding (Highlight)
| Campo | Valor |
|-------|-------|
| **Ruta** | `/admin/plantillas/crear` |
| **Duración estimada** | 60-90s |
| **Actor** | Usuario ADMIN o RRHH |
| **Descripción** | Crear plantilla de onboarding con editor visual drag & drop |

**Pasos:**
1. Navegar a `/admin/plantillas`
2. Click en "Crear plantilla"
3. Completar nombre y descripción
4. Seleccionar departamento y rol destino
5. Agregar tarea 1: "Firmar contrato" (DOCUMENTACION, RRHH, día 1)
6. Agregar tarea 2: "Entregar laptop" (EQUIPAMIENTO, IT, día 1)
7. Agregar tarea 3: "Configurar accesos" (ACCESOS, IT, día 2)
8. Establecer dependencia: tarea 3 depende de tarea 2
9. Demostrar drag & drop para reordenar
10. Guardar plantilla

**Capturas clave:**
- Editor vacío
- Formulario de tarea
- Lista de tareas con dependencias visuales
- Drag & drop en acción
- Plantilla guardada

---

### Escena 5: Iniciar Proceso de Onboarding
| Campo | Valor |
|-------|-------|
| **Ruta** | `/onboarding` |
| **Duración estimada** | 30-40s |
| **Actor** | Usuario ADMIN o RRHH |
| **Descripción** | Iniciar onboarding para un empleado nuevo |

**Pasos:**
1. Navegar a `/onboarding`
2. Click en "Iniciar proceso"
3. Seleccionar plantilla creada
4. Seleccionar empleado
5. Establecer fecha de inicio
6. Confirmar inicio
7. Ver proceso creado con tareas asignadas

**Capturas clave:**
- Listado de procesos
- Modal de inicio
- Selección de plantilla y empleado
- Proceso activo con barra de progreso

---

### Escena 6: Completar Tareas de Onboarding
| Campo | Valor |
|-------|-------|
| **Ruta** | `/onboarding/[id]` y `/mis-tareas` |
| **Duración estimada** | 40-50s |
| **Actor** | Responsables (RRHH, IT, Manager) |
| **Descripción** | Completar tareas del proceso y ver progreso |

**Pasos:**
1. Ir a `/mis-tareas` como responsable
2. Ver tareas pendientes asignadas
3. Click en tarea "Firmar contrato"
4. Marcar como completada
5. Adjuntar evidencia (URL)
6. Ver progreso actualizado
7. Ir a `/onboarding/[id]` para ver vista general

**Capturas clave:**
- Lista de mis tareas
- Detalle de tarea
- Formulario de completar con evidencia
- Barra de progreso actualizada

---

### Escena 7: Gestión de Proyectos
| Campo | Valor |
|-------|-------|
| **Ruta** | `/proyectos` |
| **Duración estimada** | 40-50s |
| **Actor** | Usuario MANAGER o ADMIN |
| **Descripción** | Crear proyecto y asignar equipo |

**Pasos:**
1. Navegar a `/proyectos`
2. Click en "Crear proyecto"
3. Completar: nombre, cliente, fechas, presupuesto horas
4. Guardar proyecto
5. Ir al detalle del proyecto
6. Click en "Asignar empleado"
7. Seleccionar empleado, rol, % dedicación
8. Guardar asignación
9. Ver equipo asignado con porcentajes

**Capturas clave:**
- Listado de proyectos (cards o tabla)
- Formulario de creación
- Detalle de proyecto
- Modal de asignación
- Equipo con dedicaciones

---

### Escena 8: Weekly Timesheet (Highlight)
| Campo | Valor |
|-------|-------|
| **Ruta** | `/timetracking` |
| **Duración estimada** | 50-60s |
| **Actor** | Usuario EMPLEADO |
| **Descripción** | Registrar horas en grid semanal editable |

**Pasos:**
1. Navegar a `/timetracking`
2. Seleccionar tab "Weekly Timesheet"
3. Ver grid: proyectos en filas, días en columnas
4. Click en celda lunes/Proyecto1: ingresar 8h
5. Click en celda martes/Proyecto1: ingresar 4h
6. Click en celda martes/Proyecto2: ingresar 4h
7. Navegar a semana anterior (flecha ←)
8. Click en "Copiar semana" para rellenar automático
9. Ver totales por día y por proyecto

**Capturas clave:**
- Grid vacío
- Grid con horas ingresadas
- Navegación semanal
- Función copiar semana
- Totales calculados

---

### Escena 9: Gantt Chart (Highlight)
| Campo | Valor |
|-------|-------|
| **Ruta** | `/timetracking` (tab Gantt) |
| **Duración estimada** | 30-40s |
| **Actor** | Usuario EMPLEADO o MANAGER |
| **Descripción** | Visualización temporal de proyectos con D3.js |

**Pasos:**
1. En `/timetracking`, seleccionar tab "Gantt Chart"
2. Ver timeline con proyectos como barras
3. Hover sobre barra para ver tooltip (fechas, progreso)
4. Usar controles de zoom (mes/trimestre/año)
5. Scroll horizontal para navegar en el tiempo

**Capturas clave:**
- Vista Gantt completa
- Tooltip con detalles
- Diferentes niveles de zoom
- Barras de progreso coloridas

---

### Escena 10: Aprobación de Horas (Manager)
| Campo | Valor |
|-------|-------|
| **Ruta** | `/timetracking/aprobacion` |
| **Duración estimada** | 30-40s |
| **Actor** | Usuario MANAGER |
| **Descripción** | Aprobar/rechazar registros de horas del equipo |

**Pasos:**
1. Navegar a `/timetracking/aprobacion`
2. Ver registros pendientes del equipo
3. Revisar detalle de un registro
4. Aprobar registro individual
5. Seleccionar múltiples registros (checkbox)
6. Click en "Aprobar seleccionados" (masivo)
7. Ver registros actualizados a "Aprobado"

**Capturas clave:**
- Tabla de registros pendientes
- Botones aprobar/rechazar
- Selección múltiple
- Estados actualizados

---

## Orden Recomendado para Demo Completa

| # | Escena | Duración | Impacto Visual |
|---|--------|----------|----------------|
| 1 | Autenticación MFA | 30-45s | ⭐⭐⭐⭐ |
| 2 | Dashboard Admin | 20-30s | ⭐⭐⭐⭐ |
| 3 | Gestión Empleados | 40-50s | ⭐⭐⭐ |
| 4 | Editor Plantillas | 60-90s | ⭐⭐⭐⭐⭐ |
| 5 | Iniciar Onboarding | 30-40s | ⭐⭐⭐⭐ |
| 6 | Completar Tareas | 40-50s | ⭐⭐⭐ |
| 7 | Gestión Proyectos | 40-50s | ⭐⭐⭐ |
| 8 | Weekly Timesheet | 50-60s | ⭐⭐⭐⭐⭐ |
| 9 | Gantt Chart | 30-40s | ⭐⭐⭐⭐⭐ |
| 10 | Aprobación Horas | 30-40s | ⭐⭐⭐ |

**Duración total estimada: 6-8 minutos**

---

## Datos de Prueba Requeridos

### Usuarios
| Email | Rol | Password | MFA Secret |
|-------|-----|----------|------------|
| admin@teamhub.com | ADMIN | Admin123! | (configurado) |
| rrhh@teamhub.com | RRHH | Rrhh123! | (configurado) |
| manager@teamhub.com | MANAGER | Manager123! | (configurado) |
| empleado@teamhub.com | EMPLEADO | Empleado123! | (configurado) |

### Departamentos
- Desarrollo
- Recursos Humanos
- Marketing
- IT

### Proyectos
- PRJ-001: Plataforma E-commerce (ACTIVO)
- PRJ-002: App Móvil v2 (PLANIFICACION)
- PRJ-003: Migración Cloud (ACTIVO)

### Plantillas Onboarding
- Backend Developer Onboarding (8 tareas)
- Frontend Developer Onboarding (7 tareas)
- General Employee Onboarding (5 tareas)

---

## Configuración de Playwright para Demo

```typescript
// demo.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/demo',
  timeout: 120000, // 2 min por escena
  use: {
    baseURL: 'http://localhost:3000',
    video: 'on',
    viewport: { width: 1920, height: 1080 },
    launchOptions: {
      slowMo: 500, // Ralentiza acciones para mejor visualización
    },
  },
  reporter: [
    ['html', { outputFolder: 'demo-report' }],
  ],
  outputDir: 'demo-videos',
});
```

---

## Comandos para Ejecutar Demo

```bash
# Ejecutar demo completa con video
npx playwright test --config=demo.config.ts --headed

# Ejecutar escena específica
npx playwright test demo-auth.spec.ts --config=demo.config.ts --headed

# Generar video sin interfaz (más rápido)
npx playwright test --config=demo.config.ts
```

---

## Notas de Producción

1. **Resolución**: Grabar en 1920x1080 para calidad profesional
2. **slowMo**: Usar 300-500ms para que las acciones sean visibles
3. **Datos limpios**: Usar base de datos con seed específico para demo
4. **Sin errores**: Verificar que todos los endpoints estén funcionando
5. **Post-producción**: Los videos se pueden editar/concatenar después
