# Scripts de Datos de Prueba

Este directorio contiene scripts para poblar la base de datos con datos de prueba para desarrollo y demostración.

## seed-proyectos-gantt.sql

Inserta 6 proyectos de ejemplo con diferentes estados y fechas para poder visualizar:
- **Diagrama Gantt** en Timetracking
- **Timesheet Semanal** con registros de horas

### Proyectos incluidos:

| Código | Nombre | Estado | Fechas | Progreso |
|--------|--------|--------|--------|----------|
| CLOUD-001 | Migración a la nube | COMPLETADO | 01/01 - 10/02 | 95% (305/320h) |
| MOBILE-001 | Desarrollo App Móvil | ACTIVO | 15/01 - 30/04 | 56% (450/800h) |
| CRM-001 | Implementación CRM | PLANIFICACION | 01/03 - 30/06 | 0% (0/600h) |
| WEB-001 | Rediseño Web | PAUSADO | 10/01 - 31/03 | 45% (180/400h) |
| TRANS-001 | Transformación Digital | ACTIVO | 01/02 - 31/12 | 33% (800/2400h) |
| API-002 | API Gateway v2 | ACTIVO | 15/02 - 15/05 | 10% (50/480h) |

### Uso:

#### Opción 1: Con el script bash (recomendado)

```bash
cd scripts
./seed-proyectos-gantt.sh
```

El script usa estas variables de entorno (con valores por defecto):
- `DB_HOST` (default: localhost)
- `DB_PORT` (default: 5432)
- `DB_NAME` (default: teamhub)
- `DB_USER` (default: postgres)

Ejemplo con variables personalizadas:
```bash
DB_HOST=db.example.com DB_NAME=teamhub_dev ./seed-proyectos-gantt.sh
```

#### Opción 2: Directamente con psql

```bash
psql -h localhost -U postgres -d teamhub -f seed-proyectos-gantt.sql
```

#### Opción 3: Si usas Aiven o PostgreSQL remoto

```bash
psql "postgres://avnadmin:AVNS_xxx@teamhub-xxx.a.aivencloud.com:12345/teamhub?sslmode=require" -f seed-proyectos-gantt.sql
```

### Requisitos previos:

1. Base de datos creada y migrada (tablas existentes)
2. Al menos un departamento en la tabla `departamentos`
3. Al menos un usuario admin en la tabla `usuarios` (preferiblemente `admin@example.com`)

### Qué hace el script:

1. **Inserta 6 proyectos** con diferentes estados y rangos de fechas
2. **Crea asignaciones** del usuario admin a todos los proyectos
3. **Genera registros de timetracking** para esta semana en 3 proyectos activos
4. **Muestra resumen** de los datos insertados

### Verificación:

Después de ejecutar el script:
1. Inicia sesión en TeamHub
2. Ve a **Timetracking**
3. Haz click en la pestaña **"Diagrama Gantt"**
4. Deberías ver 6 barras de proyectos con diferentes colores y estados
5. Haz click en **"Timesheet Semanal"**
6. Deberías ver horas registradas para 3 proyectos esta semana

### Limpieza:

Para eliminar los datos de prueba:

```sql
-- Eliminar registros de timetracking de prueba
DELETE FROM timetracking 
WHERE proyecto_id IN (
  SELECT id FROM proyectos 
  WHERE codigo IN ('CLOUD-001', 'MOBILE-001', 'CRM-001', 'WEB-001', 'TRANS-001', 'API-002')
);

-- Eliminar asignaciones de prueba
DELETE FROM asignaciones 
WHERE proyecto_id IN (
  SELECT id FROM proyectos 
  WHERE codigo IN ('CLOUD-001', 'MOBILE-001', 'CRM-001', 'WEB-001', 'TRANS-001', 'API-002')
);

-- Eliminar proyectos de prueba
DELETE FROM proyectos 
WHERE codigo IN ('CLOUD-001', 'MOBILE-001', 'CRM-001', 'WEB-001', 'TRANS-001', 'API-002');
```

### Personalización:

Puedes modificar el script SQL para:
- Cambiar el email del usuario (`admin@example.com`)
- Ajustar fechas de proyectos
- Modificar estados y colores
- Añadir más proyectos
- Cambiar las horas registradas

### Troubleshooting:

**Error: "relation proyectos does not exist"**
- Las migraciones no se han ejecutado. Ejecuta las migraciones primero.

**Error: "violates foreign key constraint"**
- No existe el departamento o usuario referenciado.
- Crea al menos un departamento y un usuario admin primero.

**No aparecen proyectos en el Gantt**
- Verifica que el usuario con el que te logueas sea el mismo del script (`admin@example.com`)
- Verifica que los proyectos tengan fechas: `SELECT codigo, fecha_inicio, fecha_fin_estimada FROM proyectos;`

**El Timesheet está vacío**
- El script genera registros para la semana actual (lunes a viernes)
- Si es fin de semana, navega a la semana anterior con las flechas
