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

## Vistas planificadas (no implementadas en frontend)
- Departamentos
- Empleados
- Onboarding (plantillas, procesos, mis tareas)
- Proyectos y asignaciones
- Timetracking

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

### Vistas planificadas (detalle pendiente)
Las vistas de Departamentos, Empleados, Onboarding, Proyectos y Timetracking no estan implementadas en el frontend por ahora.

### Perfil

#### Edicion de perfil
- Formulario UI para nombre y apellidos (sin integracion de guardado).
- Email solo lectura.
- UI para cambio de contraseña (sin integracion de guardado).

#### Casos de error (Perfil)
- Validaciones pendientes al integrar backend.

## Flujos Clave (implementados)
- Autenticacion y sesion (login + cambio de contraseña temporal + MFA)

## Flujos planificados (no implementados en frontend)
- Creacion y gestion de empleados
- Inicio y seguimiento de onboarding
- Creacion de proyectos y asignaciones
- Registro y aprobacion de horas

## Reglas de Negocio UI
- Restricciones por rol en menus y vistas.
- Estados visuales segun estado de entidad (activo/inactivo, aprobado/pendiente).

## Wireflows (implementados)

### Login con MFA obligatorio
1. Usuario abre /login e introduce email + password.
2. Backend devuelve mfaToken y flags (passwordChangeRequired, mfaSetupRequired o mfaRequired).
3. Si passwordChangeRequired, se fuerza cambio de contraseña.
4. Si mfaSetupRequired, se muestra QR/secret y se valida codigo TOTP.
5. Si mfaRequired, se solicita codigo TOTP.
6. Login completo y redireccion a /dashboard.

## Pendientes
- Implementar vistas planificadas y sus wireflows.
- Integrar formularios de perfil con backend.
