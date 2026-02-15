# Funcionalidades Principales

Este documento detalla las funcionalidades implementadas en TeamHub, organizadas por módulos.

---

## 1. Gestión de Usuarios y Autenticación

### Autenticación
- Alta interna de usuarios por ADMIN/RRHH (contraseña temporal)
- Login con JWT (access token + refresh token) y MFA obligatorio (Google Authenticator)
- Refresh automático de tokens
- Logout con invalidación de sesión
- Recuperación de contraseña por email con token
- Bloqueo tras 3 intentos fallidos (30 minutos) con desbloqueo manual por ADMIN

### Gestión de Usuarios
- CRUD completo de usuarios
- Roles: ADMIN, RRHH, MANAGER, EMPLEADO
- Soft delete (desactivación)
- Perfil editable
- Cambio de contraseña

---

## 2. Gestión de Departamentos

- CRUD de departamentos
- Asignación de responsable
- Código único por departamento
- Estadísticas: empleados por departamento
- Vista de empleados por departamento

---

## 3. Módulo de Onboarding

### Plantillas de Onboarding
- Crear plantillas reutilizables por departamento/rol
- Definir tareas con:
  - Título y descripción
  - Categoría (documentación, equipamiento, formación, accesos, reuniones)
  - Tipo de responsable (RRHH, Manager, IT, Empleado, Custom)
  - Días desde inicio para fecha límite
  - Obligatoriedad
  - Requisito de evidencia
  - Instrucciones y recursos
  - Dependencias entre tareas
- Ordenar tareas con drag & drop
- Duplicar plantillas

### Procesos de Onboarding
- Iniciar proceso para nuevo empleado basado en plantilla
- Cálculo automático de fechas límite
- Asignación automática de responsables
- Estados: En curso, Completado, Cancelado, Pausado
- Seguimiento de progreso en tiempo real
- Marcar tareas como completadas con evidencias
- Alertas de tareas vencidas
- Vista "Mis tareas" para responsables
- Vista "Mi onboarding" para empleados nuevos

---

## 4. Módulo de Proyectos y Asignaciones

### Gestión de Proyectos
- CRUD de proyectos
- Campos: nombre, descripción, cliente, fechas, presupuesto horas
- Estados: Planificación, Activo, Pausado, Completado, Cancelado
- Código automático (PRJ-001, PRJ-002, etc.)
- Asignación de manager responsable
- Estadísticas de horas consumidas vs presupuesto

### Asignaciones
- Asignar empleados a proyectos
- Definir rol en el proyecto
- Dedicación (% o horas semanales)
- Fechas de inicio y fin
- Validación: dedicación total no puede superar 100%
- Historial de asignaciones
- Vista de carga de trabajo del equipo

---

## 5. Módulo de Timetracking

### Registro de Horas
- Imputar horas por proyecto
- Vista semanal con calendario
- Campos: proyecto, fecha, horas, descripción
- Validaciones:
  - Solo proyectos asignados
  - Máximo 24h por día
  - No fechas futuras
- Copiar registros de días anteriores
- Indicador de estado de aprobación

### Aprobación de Horas
- Vista para managers de horas pendientes
- Aprobar/rechazar individual o masivamente
- Comentarios en rechazos
- Bloqueo de edición tras aprobación

---

## 6. Dashboards y Reportes

### Dashboard ADMIN
- Total usuarios activos
- Usuarios por rol y departamento
- Proyectos por estado
- Horas totales del mes
- Actividad reciente

### Dashboard RRHH
- Onboardings en curso y completados
- Tiempo medio de onboarding
- Tareas vencidas (alertas)
- Empleados por departamento
- Evolución de altas

### Dashboard Manager
- Carga del equipo (% ocupación)
- Horas pendientes de aprobar
- Distribución del equipo por proyecto
- Estado de onboardings del equipo

### Dashboard Empleado
- Mi progreso de onboarding
- Mis proyectos activos
- Mi dedicación total
- Horas del mes (por estado)
- Próximas tareas

---

## Referencias

- [Arquitectura del Sistema](architecture.md)
- [Documentación de API](api-reference.md)
- [Casos de Uso](../context/) - Scripts SQL de referencia
