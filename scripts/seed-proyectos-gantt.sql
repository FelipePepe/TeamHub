-- Script para poblar proyectos con fechas para el Diagrama Gantt
-- Ejecutar después de tener departamentos y usuarios

-- Insertar proyectos de ejemplo con fechas
INSERT INTO proyectos (id, nombre, codigo, descripcion, fecha_inicio, fecha_fin_estimada, fecha_fin_real, estado, presupuesto_horas, horas_consumidas, manager_id, color)
VALUES
  -- Proyecto completado
  (
    gen_random_uuid(),
    'Migración a la nube',
    'CLOUD-001',
    'Migración de infraestructura on-premise a AWS',
    '2026-01-01',
    '2026-02-15',
    '2026-02-10',
    'COMPLETADO',
    320,
    305,
    (SELECT id FROM users WHERE rol = 'ADMIN' LIMIT 1),
    '#10b981'
  ),
  -- Proyecto activo (en progreso)
  (
    gen_random_uuid(),
    'Desarrollo App Móvil',
    'MOBILE-001',
    'Aplicación móvil nativa para iOS y Android',
    '2026-01-15',
    '2026-04-30',
    NULL,
    'ACTIVO',
    800,
    450,
    (SELECT id FROM users WHERE rol = 'ADMIN' LIMIT 1),
    '#3b82f6'
  ),
  -- Proyecto en planificación (futuro)
  (
    gen_random_uuid(),
    'Implementación CRM',
    'CRM-001',
    'Implementación y personalización de Salesforce',
    '2026-03-01',
    '2026-06-30',
    NULL,
    'PLANIFICACION',
    600,
    0,
    (SELECT id FROM users WHERE rol = 'ADMIN' LIMIT 1),
    '#8b5cf6'
  ),
  -- Proyecto pausado
  (
    gen_random_uuid(),
    'Rediseño Web Corporativo',
    'WEB-001',
    'Nuevo diseño responsive del sitio web',
    '2026-01-10',
    '2026-03-31',
    NULL,
    'PAUSADO',
    400,
    180,
    (SELECT id FROM users WHERE rol = 'ADMIN' LIMIT 1),
    '#f59e0b'
  ),
  -- Proyecto activo de larga duración
  (
    gen_random_uuid(),
    'Transformación Digital',
    'TRANS-001',
    'Programa integral de transformación digital',
    '2026-02-01',
    '2026-12-31',
    NULL,
    'ACTIVO',
    2400,
    800,
    (SELECT id FROM users WHERE rol = 'ADMIN' LIMIT 1),
    '#ec4899'
  ),
  -- Proyecto recién iniciado
  (
    gen_random_uuid(),
    'API Gateway v2',
    'API-002',
    'Nueva versión del API Gateway con GraphQL',
    '2026-02-15',
    '2026-05-15',
    NULL,
    'ACTIVO',
    480,
    50,
    (SELECT id FROM users WHERE rol = 'ADMIN' LIMIT 1),
    '#06b6d4'
  );

-- Crear asignaciones para el usuario actual en estos proyectos
-- (Asumiendo que el usuario ya existe - ajustar el WHERE según tu caso)
INSERT INTO asignaciones (id, proyecto_id, usuario_id, fecha_inicio, rol)
SELECT 
  gen_random_uuid(),
  p.id,
  (SELECT id FROM users WHERE email = 'admin@teamhub.example.com' LIMIT 1),
  p.fecha_inicio,
  'Desarrollador'
FROM proyectos p
WHERE p.codigo IN ('CLOUD-001', 'MOBILE-001', 'CRM-001', 'WEB-001', 'TRANS-001', 'API-002');

-- Insertar algunos registros de timetracking para que el Weekly Timesheet también muestre datos
INSERT INTO timetracking (id, usuario_id, proyecto_id, fecha, horas, descripcion, estado, facturable)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM users WHERE email = 'admin@teamhub.example.com' LIMIT 1),
  p.id,
  CURRENT_DATE - (EXTRACT(DOW FROM CURRENT_DATE)::integer) + offset_days, -- Lunes de esta semana + offset
  CASE 
    WHEN offset_days = 0 THEN 8  -- Lunes
    WHEN offset_days = 1 THEN 7  -- Martes
    WHEN offset_days = 2 THEN 6  -- Miércoles
    WHEN offset_days = 3 THEN 8  -- Jueves
    WHEN offset_days = 4 THEN 5  -- Viernes
    ELSE 0
  END,
  'Desarrollo y testing',
  'APROBADO',
  true
FROM proyectos p
CROSS JOIN generate_series(0, 4) AS offset_days
WHERE p.codigo IN ('MOBILE-001', 'TRANS-001', 'API-002')
AND p.estado = 'ACTIVO';

-- Verificar los datos insertados
SELECT 
  codigo,
  nombre,
  estado,
  fecha_inicio,
  fecha_fin_estimada,
  fecha_fin_real,
  presupuesto_horas,
  horas_consumidas,
  ROUND(100.0 * COALESCE(horas_consumidas, 0) / NULLIF(presupuesto_horas, 0), 1) as progreso_pct
FROM proyectos
WHERE codigo IN ('CLOUD-001', 'MOBILE-001', 'CRM-001', 'WEB-001', 'TRANS-001', 'API-002')
ORDER BY fecha_inicio;

SELECT 
  COUNT(*) as total_asignaciones,
  COUNT(DISTINCT proyecto_id) as proyectos_con_asignaciones
FROM asignaciones
WHERE usuario_id = (SELECT id FROM users WHERE email = 'admin@teamhub.example.com' LIMIT 1);

SELECT 
  p.codigo,
  DATE(t.fecha) as fecha,
  SUM(t.horas) as horas_totales
FROM timetracking t
JOIN proyectos p ON t.proyecto_id = p.id
WHERE t.usuario_id = (SELECT id FROM users WHERE email = 'admin@teamhub.example.com' LIMIT 1)
AND t.fecha >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY p.codigo, DATE(t.fecha)
ORDER BY fecha, p.codigo;
