# Documento Funcional - Frontend

## Objetivo
Describir el comportamiento funcional del frontend de TeamHub, sus vistas principales y los flujos de usuario.

## Alcance
- App web con Next.js (App Router).
- Roles: ADMIN, RRHH, MANAGER, EMPLEADO.

## Vistas Principales
- Login / Registro
- Dashboard por rol
- Departamentos
- Empleados
- Onboarding (plantillas, procesos, mis tareas)
- Proyectos y asignaciones
- Timetracking
- Perfil

## Detalle por Vista

### Login / Registro

#### Login
- Acceso publico.
- Campos: email + contraseña.
- MFA obligatorio para todos los usuarios (Google Authenticator).
- MFA requerido en cada login (no hay "recordar dispositivo").
- Si el usuario tiene contraseña temporal, se fuerza cambio de contraseña antes del MFA.
- Si la contraseña es correcta y el MFA valida, redirige al dashboard segun rol.
- Bloqueo por intentos fallidos: 3 intentos -> bloqueo 30 minutos (desbloqueable por ADMIN).

#### Registro (solo ADMIN)
- Ruta oculta: solo accesible para rol ADMIN.
- Alta interna con contraseña temporal.
- La contraseña temporal se muestra una sola vez al crear el usuario.
- El usuario debe cambiar la contraseña en el primer login.

#### Reset de contraseña (solo ADMIN)
- No hay flujo de autoservicio "Olvide mi contraseña".
- El ADMIN puede generar una nueva contraseña temporal desde el panel de empleados.
- La contraseña temporal se muestra una sola vez y debe comunicarse al empleado por via alternativa.
- El empleado cambia la contraseña en el siguiente login.
- Politica de contraseña fuerte:
  - Minimo 12 caracteres.
  - Mayusculas, minusculas, numero y caracter especial.

#### MFA (primer login y uso recurrente)
- Enrolamiento obligatorio en primer login (despues de cambiar contraseña temporal).
- Mostrar QR/secret para Google Authenticator y validar codigo TOTP.
- Generar y mostrar codigos de recuperacion (backup codes) tras el alta.

#### Casos de error (Login/Registro)
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

### Departamentos

#### Acceso y permisos
- Solo ADMIN y RRHH con CRUD completo.
- MANAGER y EMPLEADO no tienen acceso.

#### Listado
- Columnas: nombre, codigo, responsable, numero de empleados, estado (activo/inactivo).
- Acciones por fila: ver, editar, desactivar (soft delete).

#### Crear/Editar
- Campos: nombre, codigo, descripcion, responsable, color, estado.

#### Eliminacion
- Soft delete con confirmacion.
- No elimina datos: marca activo/visible en false.

#### Casos de error (Departamentos)
- Errores de validacion en formulario (campos obligatorios, codigo/nombre duplicado).
- Errores de servidor: mensaje generico.
- Sin permisos: mensaje claro y acciones ocultas.

### Empleados

#### Acceso y permisos
- ADMIN y RRHH: CRUD completo.
- MANAGER: ver y editar su equipo (no puede cambiar rol ni departamento).
- EMPLEADO: solo su perfil.

#### Listado
- Columnas: avatar+nombre, email, departamento, rol, manager, estado, fecha de alta.
- Filtros: departamento, rol, estado (activo/inactivo), busqueda por nombre/email.
- Acciones ADMIN desde fila:
  - Desbloquear cuenta (si esta bloqueada).
  - Resetear contraseña (genera contraseña temporal).

#### Crear/Editar
- Campos: nombre, apellidos, email, contraseña temporal, rol, departamento, manager, estado.
- Edicion por MANAGER: puede editar todos los campos salvo rol y departamento.

#### Detalle de Empleado
- Secciones: informacion personal, departamento y manager, proyectos asignados, onboarding, historial de horas, actividad reciente.
- Acciones ADMIN:
  - Desbloquear cuenta (si esta bloqueada).
  - Resetear contraseña (genera contraseña temporal que se muestra una sola vez).

#### Casos de error (Empleados)
- Errores de validacion en formulario (email duplicado, campos obligatorios, password no cumple politica).
- Sin permisos: mensaje claro y acciones ocultas.
- Reset de contraseña: mostrar contraseña temporal en modal/dialogo una sola vez; error si el usuario no existe.
- Desbloqueo de cuenta: error si la cuenta no esta bloqueada.
- Desactivacion: confirmacion antes de proceder; error si falla.

### Onboarding (plantillas, procesos, mis tareas)

#### Plantillas
- Acceso: ADMIN y RRHH (CRUD); MANAGER solo lectura.
- Acciones: crear, editar, duplicar, eliminar.

#### Procesos
- Iniciar procesos: ADMIN, RRHH y MANAGER (solo su equipo).
- Visibilidad: ADMIN y RRHH ven todos; MANAGER ve su equipo; EMPLEADO solo el suyo.

#### Tareas
- Completar tarea: responsable asignado y MANAGER del equipo.
- Evidencia opcional por tarea segun plantilla (archivo/enlace).
- Si requiere evidencia, permite rechazo con comentario y retorno a estado pendiente.

#### Mis tareas
- Vista Kanban por estado.
- Filtros: proceso, categoria, fecha limite (vencidas/proximas/todas) y busqueda por texto.

#### Casos de error (Onboarding)
- Plantillas: validacion de campos, dependencias invalidas, permisos insuficientes.
- Procesos: no iniciar si plantilla inactiva; error en asignacion de responsables; permisos insuficientes.
- Tareas: no completar si no eres responsable/manager; evidencia obligatoria faltante; rechazo requiere comentario.

### Proyectos y asignaciones

#### Proyectos
- Acceso y visibilidad: ADMIN ve todos; MANAGER ve los suyos; EMPLEADO solo los asignados.
- Crear/editar: ADMIN y MANAGER.
- Listado en cards con nombre, cliente, estado, manager y progreso de horas.
- Filtros: estado, manager, cliente, fecha y busqueda.
- Detalle de proyecto con secciones: informacion general, equipo/asignaciones, horas registradas, estadisticas.

#### Asignaciones
- Crear/editar asignaciones: ADMIN y MANAGER del proyecto.
- Campos: empleado, rol en proyecto, dedicacion (% o horas/semana), fecha inicio, fecha fin (opcional), notas.

#### Mis proyectos (empleado)
- Lista de proyectos asignados con rol y dedicacion.
- Acceso rapido a timetracking.

#### Casos de error (Proyectos y asignaciones)
- Validacion de campos obligatorios y duplicados (codigo/nombre).
- No permitir cambios si el proyecto esta completado/cancelado.
- Asignacion rechazada si la dedicacion supera 100%.
- Sin permisos: mensaje claro y acciones ocultas.

### Timetracking

#### Acceso y permisos
- Registro de horas: todos los roles (ADMIN, RRHH, MANAGER, EMPLEADO).
- Aprobacion/rechazo: solo MANAGER.

#### Vista principal
- Vista semanal por defecto.
- Navegacion entre semanas y totales por dia/semana.

#### Vistas adicionales
- Vista mensual como alternativa.
- Vista diaria/detalle desde la semana para ver y editar registros del dia.

#### Aprobacion de horas (Manager)
- Lista de registros pendientes con filtros por empleado, proyecto, rango de fechas y estado.
- Acciones: aprobar/rechazar individual y masivo (con comentario obligatorio en rechazo).

#### Registro de horas
- Campos: proyecto, fecha, horas, descripcion/tarea, facturable.
- Validaciones: solo proyectos asignados, no fechas futuras, maximo 14h por dia.

#### Casos de error (Timetracking)
- Validaciones: fecha futura, horas > 14/dia, proyecto no asignado.
- Edicion/borrado solo si estado PENDIENTE.
- Aprobacion solo por MANAGER; rechazo requiere comentario.
- Errores de servidor: mensaje generico.

### Perfil

#### Edicion de perfil
- Campos editables: nombre, apellidos, email, contraseña y avatar.

#### MFA
- Gestion de MFA desde el perfil: ver estado, regenerar QR y codigos de recuperacion.

#### Casos de error (Perfil)
- Validaciones: email duplicado y password no cumple politica.
- Error al actualizar avatar.
- Error al regenerar MFA/codigos de recuperacion: mensaje generico.

## Flujos Clave
- Autenticacion y sesion
- Creacion y gestion de empleados
- Inicio y seguimiento de onboarding
- Creacion de proyectos y asignaciones
- Registro y aprobacion de horas

## Reglas de Negocio UI
- Restricciones por rol en menus y vistas.
- Estados visuales segun estado de entidad (activo/inactivo, aprobado/pendiente).

## Wireflows generales

### Login con MFA obligatorio
1. Usuario abre /login e introduce email + password.
2. Si credenciales validas y no tiene MFA, se fuerza cambio de password si era temporal.
3. Enrolamiento MFA (QR/secret) y validacion de codigo TOTP.
4. Login completo y redireccion a dashboard segun rol.

### Reset de password (por ADMIN)
1. Empleado contacta a ADMIN solicitando reset.
2. ADMIN accede al panel de empleados y genera contraseña temporal.
3. Sistema muestra la contraseña temporal una sola vez.
4. ADMIN comunica la contraseña al empleado por via alternativa (verbal, chat interno, etc.).
5. Empleado inicia sesion con contraseña temporal.
6. Sistema fuerza cambio de contraseña (politica fuerte).
7. Login completo con MFA.

### Alta de empleado (ADMIN)
1. ADMIN crea empleado con password temporal (se muestra una sola vez).
2. ADMIN comunica la contraseña temporal al empleado por via alternativa.
3. El empleado hace primer login con la contraseña temporal.
4. Sistema fuerza cambio de contraseña (politica fuerte).
5. Sistema fuerza enrolamiento MFA (mostrar QR/secret para Google Authenticator).
6. Empleado valida codigo TOTP y recibe backup codes.
7. Login completo y redireccion a dashboard.

### Onboarding: iniciar y completar tareas
1. ADMIN/RRHH/MANAGER inicia proceso desde plantilla.
2. Sistema genera tareas con responsables.
3. Responsables completan tareas (con evidencia si aplica).
4. MANAGER puede completar tareas del equipo y revisar evidencias.
5. Proceso finaliza al completar todas las tareas.

### Timetracking: registrar y aprobar horas
1. Usuario registra horas en vista semanal/detalle.
2. Validaciones: proyecto asignado, max 14h/dia, no fechas futuras.
3. MANAGER revisa pendientes y aprueba/rechaza (comentario obligatorio en rechazo).

### Asignacion a proyecto
1. ADMIN/MANAGER crea proyecto o selecciona existente.
2. Asigna empleado con rol, dedicacion y fechas.
3. Empleado ve proyecto en "Mis proyectos".
## Pendientes
- Completar detalle por vista.
- Añadir wireflows y casos de error.
