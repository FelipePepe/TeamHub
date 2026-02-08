# Documento Funcional - Frontend

## Objetivo
Describir el comportamiento funcional del frontend de TeamHub, sus vistas principales y los flujos de usuario.

## Alcance
- App web con Next.js (App Router).
- Roles: ADMIN, RRHH, MANAGER, EMPLEADO.

## Vistas Principales (implementadas)
- Login
- Dashboard por rol
- Perfil

## Vistas implementadas (100%)
- Departamentos (listado, crear/editar)
- Empleados (listado, crear/editar, detalle)
- Onboarding (plantillas, procesos, mis tareas, mi onboarding)
- Proyectos y asignaciones (listado, crear/editar, detalle, asignaciones)
- Timetracking (mis registros, weekly timesheet, Gantt chart, aprobación)

## Detalle por Vista

### Login

#### Login
- Acceso publico.
- Campos: email + contraseña.
- MFA obligatorio para todos los usuarios (Google Authenticator).
- MFA requerido en cada login (no hay "recordar dispositivo").
- Si el usuario tiene contraseña temporal, se fuerza cambio de contraseña antes del MFA.
- Si la contraseña es correcta y el MFA valida, redirige al dashboard segun rol.
- Bloqueo por intentos fallidos: 3 intentos -> bloqueo 30 minutos (desbloqueable por ADMIN).

#### Reset de contraseña
- Backend expone autoservicio con `/auth/forgot-password` y `/auth/reset-password` (UI no implementada).
- ADMIN/RRHH pueden generar contraseña temporal con `/usuarios/:id/reset-password` (UI no implementada).
- La contraseña temporal se muestra una sola vez y debe comunicarse al empleado por via alternativa.
- El empleado cambia la contraseña en el siguiente login.
- Politica de contraseña fuerte:
  - Minimo 12 caracteres.
  - Mayusculas, minusculas, numero y caracter especial.

#### MFA (primer login y uso recurrente)
- Enrolamiento obligatorio en primer login (despues de cambiar contraseña temporal).
- Mostrar QR/secret para Google Authenticator y validar codigo TOTP.
- MFA requerido en cada login (no hay "recordar dispositivo").

#### Casos de error (Login)
- Credenciales invalidas: mensaje generico para el usuario.
- Cuenta bloqueada: mensaje especifico de bloqueo temporal (sin confirmar existencia).
- MFA invalido: mensaje generico; permitir reintento.
- Reset de contraseña por ADMIN: error si el usuario no existe o esta inactivo.
- Detalles especificos solo en logs.

### Dashboard por rol

#### Admin
- KPIs: usuarios activos, altas del mes, proyectos activos, horas del mes, onboardings en curso, tareas vencidas.
- Graficos: usuarios por rol, usuarios por departamento, proyectos por estado, horas por estado.
- Listas: actividad reciente y alertas criticas.

#### RRHH
- KPIs: onboardings en curso, completados del mes, tiempo medio de onboarding, tareas vencidas.
- Secciones: lista de onboardings en curso con progreso, alertas de tareas vencidas/estancadas.
- Graficos: empleados por departamento y evolucion de altas.
- Graficos con D3.js.

#### Manager
- KPIs: miembros del equipo, carga promedio, horas pendientes de aprobar, proyectos activos.
- Secciones: lista de equipo con ocupacion y bloque de horas por aprobar.
- Graficos: distribucion del equipo por proyecto y horas del equipo esta semana.
- Graficos con D3.js.

#### Empleado
- KPIs: horas del mes, proyectos activos, mi ocupacion, tareas pendientes.
- Secciones: mi onboarding con progreso y proximas tareas, mis proyectos con rol/dedicacion.
- Resumen de horas por semana/estado y accesos rapidos (imputar horas, ver mis tareas).

#### Casos de error (Dashboard)
- Errores por widget: cada KPI/grafico muestra error y boton de reintentar sin bloquear el resto.
- Si fallan todas las metricas, mostrar banner global con opcion de reintentar todo.

#### Visualizaciones en Dashboards
Los dashboards utilizan gráficos simples implementados con HTML/CSS:
- **Bar Chart**: gráficos de barras verticales para distribuciones (usuarios por rol, proyectos por estado).
- **Line Chart**: gráficos de líneas para evolución temporal (altas de usuarios, horas por mes).
- **Diseño responsive**: adaptación automática a móvil y desktop.
- **Pendiente**: migración a D3.js para mayor interactividad (ADR-063, ADR-065).

### Departamentos
- Listado con búsqueda y acciones (crear, editar, eliminar).
- Formulario modal con React Hook Form + Zod.
- Select de responsables integrado con hook useDepartamentos.
- Permisos: ADMIN y RRHH.

### Empleados
- Listado con búsqueda, filtros y acciones (ver detalle, editar, eliminar).
- Formulario modal para crear/editar con validaciones robustas.
- Vista detalle con información personal y organizacional.
- Generación automática de contraseñas temporales seguras.
- Permisos: ADMIN y RRHH.

### Onboarding

#### Plantillas
- Listado con búsqueda y acciones (crear, editar, duplicar, eliminar).
- Editor completo con tareas configurables y dependencias.
- Drag & drop para reordenar tareas.
- Validación de dependencias circulares.
- Permisos: ADMIN y RRHH.

#### Procesos
- Listado con filtros por estado y empleado.
- Vista detalle con progreso visual y timeline.
- Modal para iniciar nuevo proceso desde plantilla.
- Vista "Mis Tareas" para empleados y responsables.
- Widget "Mi Onboarding" en dashboard empleado.
- Estados: en_curso, completado, cancelado.
- Permisos: Todos los roles (según contexto).

### Proyectos y Asignaciones
- Listado con vista cards y tabla intercambiable.
- Filtros por estado (planificado, en_curso, completado, cancelado).
- Formulario crear/editar con fechas y cliente.
- Vista detalle con:
  - Estadísticas del proyecto (empleados, horas, completitud).
  - Gestión de asignaciones de equipo.
  - Validación de dedicación total ≤ 100%.
- Permisos: ADMIN, RRHH, MANAGER.

### Timetracking

#### Vista Principal - Tabs Navigation
El módulo de timetracking incluye 3 vistas principales accesibles mediante tabs:

**1. My Records (Mis Registros)**
- Listado de registros personales con búsqueda y filtros.
- Resumen semanal/mensual de horas.
- Formulario para crear/editar registros con validaciones.
- Estados visuales: pendiente, aprobado, rechazado.
- Acciones: editar, eliminar (solo pendientes).

**2. Weekly Timesheet (Vista Semanal)**
- **Grid editable interactivo** con proyectos en filas y días de la semana en columnas.
- Navegación entre semanas (anterior/siguiente).
- Input inline para editar horas directamente en el grid.
- **Feature "Copiar Semana"**: duplica registros de una semana a otra.
- Cálculo automático de totales por proyecto y por día.
- Guardado automático en tiempo real (debounced).
- Ideal para registro rápido de horas recurrentes.

**3. Gantt Chart (Visualización Temporal)**
- **Visualización D3.js avanzada** de timeline de registros por proyecto.
- **Zoom controls interactivos**:
  - Fit to screen (ajustar a ventana).
  - Zoom in/out con controles visuales.
  - Zoom con scroll del mouse.
- **Tooltips interactivos** al hover con información detallada:
  - Proyecto y fecha del registro.
  - Horas registradas y estado.
  - Descripción si existe.
- **Progress bars por proyecto** con colores según estado:
  - Verde: aprobado.
  - Amarillo: pendiente.
  - Rojo: rechazado.
- Responsive design adaptativo.
- Ideal para visualizar carga de trabajo temporal.

#### Panel de Aprobación (Managers)
- Vista exclusiva para MANAGER, RRHH y ADMIN.
- Listado de registros pendientes de aprobación del equipo.
- Filtros por empleado, proyecto y rango de fechas.
- **Aprobación individual** con confirmación.
- **Aprobación masiva** de múltiples registros.
- **Rechazo** con motivo obligatorio.
- Notificación visual de cambios de estado.

#### Características Técnicas de Visualizaciones
- **D3.js 7.x** para renderizado de gráficos avanzados.
- **Interactividad completa**: zoom, pan, hover, click.
- **Responsive design**: adaptación automática a tamaño de pantalla.
- **Performance optimizada**: debouncing en inputs, memoización de cálculos.
- **Accesibilidad**: ARIA labels, navegación por teclado.
- **Tipos TypeScript** estrictos para datos de visualización.

#### Permisos
- Empleados: solo sus propios registros.
- Managers: registros de su equipo + aprobación.
- RRHH/ADMIN: todos los registros + aprobación global.

### Perfil

#### Edicion de perfil
- Formulario UI para nombre y apellidos (sin integracion de guardado).
- Email solo lectura.
- UI para cambio de contraseña (sin integracion de guardado).

#### Casos de error (Perfil)
- Validaciones pendientes al integrar backend.

## Flujos Clave (implementados)
- Autenticacion y sesion (login + cambio de contraseña temporal + MFA)
- Gestion de departamentos (crear, editar, eliminar)
- Gestion de empleados (crear, editar, ver detalle, eliminar)
- Gestion de plantillas de onboarding (crear, editar, duplicar)
- Gestion de procesos de onboarding (iniciar, seguir tareas, completar)
- Gestion de proyectos (crear, editar, asignar equipo, finalizar)
- Registro de tiempo (crear registros, weekly timesheet, visualización Gantt)
- Aprobacion de horas (aprobar/rechazar individual y masivo)

## Flujos planificados (completados)
✅ Todas las funcionalidades planificadas están implementadas:
- ✅ Creacion y gestion de empleados
- ✅ Inicio y seguimiento de onboarding
- ✅ Creacion de proyectos y asignaciones
- ✅ Registro y aprobacion de horas

## Reglas de Negocio UI
- Restricciones por rol en menus y vistas.
- Estados visuales segun estado de entidad (activo/inactivo, aprobado/pendiente).
- **Nunca exponer IDs (UUID) al usuario**: todas las referencias a entidades relacionadas se muestran con nombres legibles (ej: nombre del departamento, nombre del manager). Si el nombre no está disponible, se muestra "Sin asignar" o "Usuario desconocido".
- **Dark mode completo**: todas las pantallas soportan modo oscuro. Se usan tokens semánticos de shadcn/ui en vez de colores hardcodeados (ver doc técnico).

## Wireflows (implementados)

### Login con MFA obligatorio
1. Usuario abre /login e introduce email + password.
2. Backend devuelve mfaToken y flags (passwordChangeRequired, mfaSetupRequired o mfaRequired).
3. Si passwordChangeRequired, se fuerza cambio de contraseña.
4. Si mfaSetupRequired, se muestra QR/secret y se valida codigo TOTP.
5. Si mfaRequired, se solicita codigo TOTP.
6. Login completo y redireccion a /dashboard.

### Weekly Timesheet (Registro Rápido de Horas)
1. Usuario navega a Timetracking > Weekly Timesheet tab.
2. Sistema muestra grid con proyectos asignados y días de la semana actual.
3. Usuario hace clic en celda y escribe horas directamente.
4. Sistema guarda automáticamente (debounced 1s).
5. Usuario puede navegar entre semanas con botones anterior/siguiente.
6. Usuario puede copiar registros de una semana a otra con modal "Copiar Semana".

### Gantt Chart (Visualización Temporal)
1. Usuario navega a Timetracking > Gantt Chart tab.
2. Sistema renderiza timeline D3.js con registros de tiempo.
3. Usuario puede hacer zoom in/out con controles o scroll del mouse.
4. Usuario hace hover sobre barra para ver tooltip con detalles.
5. Colores indican estado: verde (aprobado), amarillo (pendiente), rojo (rechazado).
6. Usuario puede hacer clic en "Fit" para ajustar vista a ventana.

### Aprobación de Horas (Manager)
1. Manager navega a Timetracking > Aprobación (si tiene permiso).
2. Sistema muestra registros pendientes del equipo.
3. Manager puede filtrar por empleado, proyecto o fechas.
4. Manager selecciona registros con checkboxes para aprobación masiva.
5. Manager hace clic en "Aprobar seleccionados" o rechaza individual con motivo.
6. Sistema actualiza estados y notifica cambios.

## Pendientes
- Migrar gráficos de dashboards (bar-chart, line-chart) a D3.js para mayor interactividad (ADR-065).
- Tests E2E completos para flujos críticos.
- Optimizaciones de performance (lazy loading, code splitting).
- Migrar valores hardcodeados (roles de asignación, estados, categorías) a tablas configurables en BD.
