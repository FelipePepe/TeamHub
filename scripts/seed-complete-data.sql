-- Script completo de datos de prueba para TeamHub
-- Incluye: departamentos, usuarios con diferentes roles, proyectos, asignaciones, timetracking

-- ============================================
-- 1. DEPARTAMENTOS (6 departamentos)
-- ============================================
INSERT INTO departamentos (id, nombre, codigo, descripcion)
VALUES
  (gen_random_uuid(), 'Desarrollo', 'DEV', 'Equipo de desarrollo de software'),
  (gen_random_uuid(), 'Recursos Humanos', 'RRHH', 'Gestión de personal y talento'),
  (gen_random_uuid(), 'Marketing', 'MKT', 'Marketing digital y contenidos'),
  (gen_random_uuid(), 'Ventas', 'SALES', 'Equipo comercial'),
  (gen_random_uuid(), 'Finanzas', 'FIN', 'Contabilidad y finanzas'),
  (gen_random_uuid(), 'Soporte', 'SUP', 'Atención al cliente y soporte técnico')
ON CONFLICT (codigo) DO NOTHING;

-- ============================================
-- 2. USUARIOS CON DIFERENTES ROLES (12 usuarios)
-- ============================================
-- ⚠️ SEGURIDAD: Password para todos los usuarios de seed: Test123!
-- 
-- ⚠️ ACCIÓN OBLIGATORIA: Cambiar TODOS los passwords inmediatamente después
-- de poblar la base de datos. Estos hashes bcrypt son públicos en el repositorio
-- y cualquier persona con acceso puede usarlos para autenticarse.
-- 
-- Para cambiar passwords en bulk:
-- UPDATE users SET password_hash = '$2a$10$TU_NUEVO_HASH_AQUI', must_change_password = true
-- WHERE email LIKE '%@teamhub.com';
--

-- ADMIN
INSERT INTO users (id, email, nombre, apellidos, password_hash, rol)
SELECT 
  gen_random_uuid(),
  'admin@teamhub.com',
  'María',
  'González Admin',
  '$2a$10$mNNDB34M4LPm9cYWFQmiNOLgk5Pr6FqO2RQr3dEoJNbPt.S66bmYW', -- Test123!
  'ADMIN'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@teamhub.com');

-- RRHH (2 usuarios)
INSERT INTO users (id, email, nombre, apellidos, password_hash, rol, departamento_id)
SELECT 
  gen_random_uuid(),
  'rrhh1@teamhub.com',
  'Ana',
  'Martínez',
  '$2a$10$mNNDB34M4LPm9cYWFQmiNOLgk5Pr6FqO2RQr3dEoJNbPt.S66bmYW',
  'RRHH',
  (SELECT id FROM departamentos WHERE codigo = 'RRHH' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'rrhh1@teamhub.com');

INSERT INTO users (id, email, nombre, apellidos, password_hash, rol, departamento_id)
SELECT 
  gen_random_uuid(),
  'rrhh2@teamhub.com',
  'Carlos',
  'Ruiz',
  '$2a$10$mNNDB34M4LPm9cYWFQmiNOLgk5Pr6FqO2RQr3dEoJNbPt.S66bmYW',
  'RRHH',
  (SELECT id FROM departamentos WHERE codigo = 'RRHH' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'rrhh2@teamhub.com');

-- MANAGER (3 usuarios de diferentes departamentos)
INSERT INTO users (id, email, nombre, apellidos, password_hash, rol, departamento_id)
SELECT 
  gen_random_uuid(),
  'manager.dev@teamhub.com',
  'Pedro',
  'López Manager',
  '$2a$10$mNNDB34M4LPm9cYWFQmiNOLgk5Pr6FqO2RQr3dEoJNbPt.S66bmYW',
  'MANAGER',
  (SELECT id FROM departamentos WHERE codigo = 'DEV' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'manager.dev@teamhub.com');

INSERT INTO users (id, email, nombre, apellidos, password_hash, rol, departamento_id)
SELECT 
  gen_random_uuid(),
  'manager.mkt@teamhub.com',
  'Laura',
  'Sánchez Manager',
  '$2a$10$mNNDB34M4LPm9cYWFQmiNOLgk5Pr6FqO2RQr3dEoJNbPt.S66bmYW',
  'MANAGER',
  (SELECT id FROM departamentos WHERE codigo = 'MKT' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'manager.mkt@teamhub.com');

INSERT INTO users (id, email, nombre, apellidos, password_hash, rol, departamento_id)
SELECT 
  gen_random_uuid(),
  'manager.sales@teamhub.com',
  'Javier',
  'Torres Manager',
  '$2a$10$mNNDB34M4LPm9cYWFQmiNOLgk5Pr6FqO2RQr3dEoJNbPt.S66bmYW',
  'MANAGER',
  (SELECT id FROM departamentos WHERE codigo = 'SALES' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'manager.sales@teamhub.com');

-- EMPLEADOS (6 usuarios)
INSERT INTO users (id, email, nombre, apellidos, password_hash, rol, departamento_id)
SELECT 
  gen_random_uuid(),
  'dev1@teamhub.com',
  'Luis',
  'García Dev',
  '$2a$10$mNNDB34M4LPm9cYWFQmiNOLgk5Pr6FqO2RQr3dEoJNbPt.S66bmYW',
  'EMPLEADO',
  (SELECT id FROM departamentos WHERE codigo = 'DEV' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'dev1@teamhub.com');

INSERT INTO users (id, email, nombre, apellidos, password_hash, rol, departamento_id)
SELECT 
  gen_random_uuid(),
  'dev2@teamhub.com',
  'Elena',
  'Fernández Dev',
  '$2a$10$mNNDB34M4LPm9cYWFQmiNOLgk5Pr6FqO2RQr3dEoJNbPt.S66bmYW',
  'EMPLEADO',
  (SELECT id FROM departamentos WHERE codigo = 'DEV' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'dev2@teamhub.com');

INSERT INTO users (id, email, nombre, apellidos, password_hash, rol, departamento_id)
SELECT 
  gen_random_uuid(),
  'admin@teamhub.example.com',
  'Felipe',
  'Pepe',
  '$2a$10$mNNDB34M4LPm9cYWFQmiNOLgk5Pr6FqO2RQr3dEoJNbPt.S66bmYW',
  'EMPLEADO',
  (SELECT id FROM departamentos WHERE codigo = 'DEV' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@teamhub.example.com');

INSERT INTO users (id, email, nombre, apellidos, password_hash, rol, departamento_id)
SELECT 
  gen_random_uuid(),
  'mkt1@teamhub.com',
  'Sofía',
  'Moreno Marketing',
  '$2a$10$mNNDB34M4LPm9cYWFQmiNOLgk5Pr6FqO2RQr3dEoJNbPt.S66bmYW',
  'EMPLEADO',
  (SELECT id FROM departamentos WHERE codigo = 'MKT' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'mkt1@teamhub.com');

INSERT INTO users (id, email, nombre, apellidos, password_hash, rol, departamento_id)
SELECT 
  gen_random_uuid(),
  'sales1@teamhub.com',
  'Miguel',
  'Jiménez Sales',
  '$2a$10$mNNDB34M4LPm9cYWFQmiNOLgk5Pr6FqO2RQr3dEoJNbPt.S66bmYW',
  'EMPLEADO',
  (SELECT id FROM departamentos WHERE codigo = 'SALES' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'sales1@teamhub.com');

INSERT INTO users (id, email, nombre, apellidos, password_hash, rol, departamento_id)
SELECT 
  gen_random_uuid(),
  'fin1@teamhub.com',
  'Isabel',
  'Romero Finanzas',
  '$2a$10$mNNDB34M4LPm9cYWFQmiNOLgk5Pr6FqO2RQr3dEoJNbPt.S66bmYW',
  'EMPLEADO',
  (SELECT id FROM departamentos WHERE codigo = 'FIN' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'fin1@teamhub.com');

INSERT INTO users (id, email, nombre, apellidos, password_hash, rol, departamento_id)
SELECT 
  gen_random_uuid(),
  'sup1@teamhub.com',
  'Diego',
  'Vargas Soporte',
  '$2a$10$mNNDB34M4LPm9cYWFQmiNOLgk5Pr6FqO2RQr3dEoJNbPt.S66bmYW',
  'EMPLEADO',
  (SELECT id FROM departamentos WHERE codigo = 'SUP' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'sup1@teamhub.com');

-- ============================================
-- 3. PROYECTOS (10 proyectos adicionales)
-- ============================================

INSERT INTO proyectos (id, nombre, codigo, descripcion, fecha_inicio, fecha_fin_estimada, fecha_fin_real, estado, presupuesto_horas, horas_consumidas, manager_id, color)
SELECT
  gen_random_uuid(),
  'Plataforma E-commerce',
  'ECOM-001',
  'Nueva plataforma de comercio electrónico con integración de pagos',
  '2026-02-01',
  '2026-07-31',
  NULL,
  'ACTIVO',
  1200,
  350,
  (SELECT id FROM users WHERE email = 'manager.dev@teamhub.com' LIMIT 1),
  '#16a34a'
WHERE NOT EXISTS (SELECT 1 FROM proyectos WHERE codigo = 'ECOM-001');

INSERT INTO proyectos (id, nombre, codigo, descripcion, fecha_inicio, fecha_fin_estimada, fecha_fin_real, estado, presupuesto_horas, horas_consumidas, manager_id, color)
SELECT
  gen_random_uuid(),
  'Campaña Redes Sociales Q1',
  'MKT-001',
  'Campaña de marketing digital primer trimestre',
  '2026-01-15',
  '2026-03-31',
  NULL,
  'ACTIVO',
  240,
  120,
  (SELECT id FROM users WHERE email = 'manager.mkt@teamhub.com' LIMIT 1),
  '#d946ef'
WHERE NOT EXISTS (SELECT 1 FROM proyectos WHERE codigo = 'MKT-001');

INSERT INTO proyectos (id, nombre, codigo, descripcion, fecha_inicio, fecha_fin_estimada, fecha_fin_real, estado, presupuesto_horas, horas_consumidas, manager_id, color)
SELECT
  gen_random_uuid(),
  'Expansión LATAM',
  'SALES-001',
  'Plan de expansión comercial en Latinoamérica',
  '2026-01-01',
  '2026-12-31',
  NULL,
  'ACTIVO',
  800,
  200,
  (SELECT id FROM users WHERE email = 'manager.sales@teamhub.com' LIMIT 1),
  '#f59e0b'
WHERE NOT EXISTS (SELECT 1 FROM proyectos WHERE codigo = 'SALES-001');

INSERT INTO proyectos (id, nombre, codigo, descripcion, fecha_inicio, fecha_fin_estimada, fecha_fin_real, estado, presupuesto_horas, horas_consumidas, manager_id, color)
SELECT
  gen_random_uuid(),
  'Dashboard Analytics',
  'DATA-001',
  'Panel de analíticas y business intelligence',
  '2026-01-20',
  '2026-04-30',
  NULL,
  'ACTIVO',
  450,
  180,
  (SELECT id FROM users WHERE email = 'manager.dev@teamhub.com' LIMIT 1),
  '#3b82f6'
WHERE NOT EXISTS (SELECT 1 FROM proyectos WHERE codigo = 'DATA-001');

INSERT INTO proyectos (id, nombre, codigo, descripcion, fecha_inicio, fecha_fin_estimada, fecha_fin_real, estado, presupuesto_horas, horas_consumidas, manager_id, color)
SELECT
  gen_random_uuid(),
  'Certificación ISO 27001',
  'SEC-001',
  'Proceso de certificación de seguridad ISO 27001',
  '2026-01-10',
  '2026-06-30',
  NULL,
  'PLANIFICACION',
  320,
  40,
  (SELECT id FROM users WHERE email = 'admin@teamhub.com' LIMIT 1),
  '#6366f1'
WHERE NOT EXISTS (SELECT 1 FROM proyectos WHERE codigo = 'SEC-001');

INSERT INTO proyectos (id, nombre, codigo, descripcion, fecha_inicio, fecha_fin_estimada, fecha_fin_real, estado, presupuesto_horas, horas_consumidas, manager_id, color)
SELECT
  gen_random_uuid(),
  'Optimización Base Datos',
  'DB-OPT-001',
  'Optimización y refactorización de base de datos',
  '2025-12-15',
  '2026-02-28',
  '2026-02-20',
  'COMPLETADO',
  200,
  195,
  (SELECT id FROM users WHERE email = 'manager.dev@teamhub.com' LIMIT 1),
  '#10b981'
WHERE NOT EXISTS (SELECT 1 FROM proyectos WHERE codigo = 'DB-OPT-001');

INSERT INTO proyectos (id, nombre, codigo, descripcion, fecha_inicio, fecha_fin_estimada, fecha_fin_real, estado, presupuesto_horas, horas_consumidas, manager_id, color)
SELECT
  gen_random_uuid(),
  'Rediseño Branding',
  'BRAND-001',
  'Renovación de identidad corporativa y branding',
  '2026-02-01',
  '2026-05-31',
  NULL,
  'ACTIVO',
  360,
  90,
  (SELECT id FROM users WHERE email = 'manager.mkt@teamhub.com' LIMIT 1),
  '#ec4899'
WHERE NOT EXISTS (SELECT 1 FROM proyectos WHERE codigo = 'BRAND-001');

INSERT INTO proyectos (id, nombre, codigo, descripcion, fecha_inicio, fecha_fin_estimada, fecha_fin_real, estado, presupuesto_horas, horas_consumidas, manager_id, color)
SELECT
  gen_random_uuid(),
  'Sistema Tickets Soporte',
  'SUP-TICKET-001',
  'Sistema de gestión de tickets para soporte',
  '2026-01-25',
  '2026-04-15',
  NULL,
  'ACTIVO',
  280,
  85,
  (SELECT id FROM users WHERE email = 'manager.dev@teamhub.com' LIMIT 1),
  '#06b6d4'
WHERE NOT EXISTS (SELECT 1 FROM proyectos WHERE codigo = 'SUP-TICKET-001');

INSERT INTO proyectos (id, nombre, codigo, descripcion, fecha_inicio, fecha_fin_estimada, fecha_fin_real, estado, presupuesto_horas, horas_consumidas, manager_id, color)
SELECT
  gen_random_uuid(),
  'Auditoría Financiera',
  'FIN-AUDIT-001',
  'Auditoría interna sistemas financieros',
  '2026-01-05',
  '2026-03-15',
  NULL,
  'PAUSADO',
  150,
  60,
  (SELECT id FROM users WHERE email = 'admin@teamhub.com' LIMIT 1),
  '#f97316'
WHERE NOT EXISTS (SELECT 1 FROM proyectos WHERE codigo = 'FIN-AUDIT-001');

INSERT INTO proyectos (id, nombre, codigo, descripcion, fecha_inicio, fecha_fin_estimada, fecha_fin_real, estado, presupuesto_horas, horas_consumidas, manager_id, color)
SELECT
  gen_random_uuid(),
  'Portal Empleados',
  'PORTAL-001',
  'Portal interno de autoservicio para empleados',
  '2026-02-10',
  '2026-06-30',
  NULL,
  'ACTIVO',
  520,
  130,
  (SELECT id FROM users WHERE email = 'manager.dev@teamhub.com' LIMIT 1),
  '#8b5cf6'
WHERE NOT EXISTS (SELECT 1 FROM proyectos WHERE codigo = 'PORTAL-001');

-- ============================================
-- 4. ASIGNACIONES (múltiples empleados por proyecto)
-- ============================================

-- ECOM-001: 3 desarrolladores
INSERT INTO asignaciones (id, proyecto_id, usuario_id, fecha_inicio, rol, dedicacion_porcentaje, horas_semanales)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM proyectos WHERE codigo = 'ECOM-001' LIMIT 1),
  u.id,
  '2026-02-01',
  'Desarrollador Full Stack',
  80,
  32
FROM users u
WHERE u.email IN ('dev1@teamhub.com', 'dev2@teamhub.com', 'admin@teamhub.example.com')
ON CONFLICT (proyecto_id, usuario_id, fecha_inicio) DO NOTHING;

-- MKT-001: 2 marketing
INSERT INTO asignaciones (id, proyecto_id, usuario_id, fecha_inicio, rol, dedicacion_porcentaje, horas_semanales)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM proyectos WHERE codigo = 'MKT-001' LIMIT 1),
  u.id,
  '2026-01-15',
  'Marketing Specialist',
  100,
  40
FROM users u
WHERE u.email IN ('mkt1@teamhub.com', 'manager.mkt@teamhub.com')
ON CONFLICT (proyecto_id, usuario_id, fecha_inicio) DO NOTHING;

-- DATA-001: 2 desarrolladores
INSERT INTO asignaciones (id, proyecto_id, usuario_id, fecha_inicio, rol, dedicacion_porcentaje, horas_semanales)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM proyectos WHERE codigo = 'DATA-001' LIMIT 1),
  u.id,
  '2026-01-20',
  'Data Engineer',
  60,
  24
FROM users u
WHERE u.email IN ('dev1@teamhub.com', 'admin@teamhub.example.com')
ON CONFLICT (proyecto_id, usuario_id, fecha_inicio) DO NOTHING;

-- PORTAL-001: 2 desarrolladores
INSERT INTO asignaciones (id, proyecto_id, usuario_id, fecha_inicio, rol, dedicacion_porcentaje, horas_semanales)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM proyectos WHERE codigo = 'PORTAL-001' LIMIT 1),
  u.id,
  '2026-02-10',
  'Frontend Developer',
  50,
  20
FROM users u
WHERE u.email IN ('dev2@teamhub.com', 'admin@teamhub.example.com')
ON CONFLICT (proyecto_id, usuario_id, fecha_inicio) DO NOTHING;

-- SUP-TICKET-001: 2 personas (1 dev + 1 soporte)
INSERT INTO asignaciones (id, proyecto_id, usuario_id, fecha_inicio, rol, dedicacion_porcentaje, horas_semanales)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM proyectos WHERE codigo = 'SUP-TICKET-001' LIMIT 1),
  u.id,
  '2026-01-25',
  CASE WHEN u.email = 'dev1@teamhub.com' THEN 'Backend Developer' ELSE 'Support Lead' END,
  50,
  20
FROM users u
WHERE u.email IN ('dev1@teamhub.com', 'sup1@teamhub.com')
ON CONFLICT (proyecto_id, usuario_id, fecha_inicio) DO NOTHING;

-- ============================================
-- 5. TIMETRACKING (registros variados)
-- ============================================

-- Registros de esta semana para admin@teamhub.example.com en varios proyectos
INSERT INTO timetracking (id, usuario_id, proyecto_id, fecha, horas, descripcion, estado, facturable)
SELECT 
  gen_random_uuid(),
  (SELECT id FROM users WHERE email = 'admin@teamhub.example.com' LIMIT 1),
  p.id,
  CURRENT_DATE - (EXTRACT(DOW FROM CURRENT_DATE)::integer) + offset_days,
  CASE 
    WHEN offset_days = 0 THEN 4
    WHEN offset_days = 1 THEN 5
    WHEN offset_days = 2 THEN 4
    WHEN offset_days = 3 THEN 5
    WHEN offset_days = 4 THEN 3
    ELSE 0
  END,
  'Desarrollo funcionalidad ' || p.codigo,
  'APROBADO'::time_entry_status,
  true
FROM proyectos p
CROSS JOIN generate_series(0, 4) AS offset_days
WHERE p.codigo IN ('ECOM-001', 'DATA-001', 'PORTAL-001')
AND p.estado = 'ACTIVO'
ON CONFLICT DO NOTHING;

-- Registros para otros desarrolladores
INSERT INTO timetracking (id, usuario_id, proyecto_id, fecha, horas, descripcion, estado, facturable)
SELECT 
  gen_random_uuid(),
  u.id,
  p.id,
  CURRENT_DATE - (EXTRACT(DOW FROM CURRENT_DATE)::integer) + offset_days,
  CASE 
    WHEN offset_days IN (0, 2, 4) THEN 8
    ELSE 7
  END,
  'Trabajo en ' || p.nombre,
  CASE 
    WHEN offset_days < 3 THEN 'APROBADO'::time_entry_status
    ELSE 'PENDIENTE'::time_entry_status
  END,
  true
FROM users u
CROSS JOIN proyectos p
CROSS JOIN generate_series(0, 4) AS offset_days
WHERE u.email IN ('dev1@teamhub.com', 'dev2@teamhub.com')
AND p.codigo IN ('ECOM-001', 'SUP-TICKET-001')
AND EXISTS (
  SELECT 1 FROM asignaciones a 
  WHERE a.usuario_id = u.id AND a.proyecto_id = p.id
)
ON CONFLICT DO NOTHING;

-- Registros de marketing
INSERT INTO timetracking (id, usuario_id, proyecto_id, fecha, horas, descripcion, estado, facturable)
SELECT 
  gen_random_uuid(),
  u.id,
  p.id,
  CURRENT_DATE - (EXTRACT(DOW FROM CURRENT_DATE)::integer) + offset_days,
  6,
  'Campaña redes sociales',
  'APROBADO'::time_entry_status,
  true
FROM users u
CROSS JOIN proyectos p
CROSS JOIN generate_series(0, 4) AS offset_days
WHERE u.email = 'mkt1@teamhub.com'
AND p.codigo = 'MKT-001'
ON CONFLICT DO NOTHING;

-- ============================================
-- 6. VERIFICACIÓN
-- ============================================

SELECT 'Departamentos creados:' as tipo, COUNT(*) as total FROM departamentos WHERE deleted_at IS NULL
UNION ALL
SELECT 'Usuarios creados:', COUNT(*) FROM users WHERE deleted_at IS NULL
UNION ALL
SELECT 'Proyectos creados:', COUNT(*) FROM proyectos WHERE deleted_at IS NULL
UNION ALL
SELECT 'Asignaciones creadas:', COUNT(*) FROM asignaciones WHERE deleted_at IS NULL
UNION ALL
SELECT 'Registros timetracking:', COUNT(*) FROM timetracking;

-- Resumen por rol
SELECT 
  'Usuarios por rol:' as info,
  rol,
  COUNT(*) as cantidad
FROM users
WHERE deleted_at IS NULL
GROUP BY rol
ORDER BY rol;

-- Proyectos por estado
SELECT 
  'Proyectos por estado:' as info,
  estado,
  COUNT(*) as cantidad
FROM proyectos
WHERE deleted_at IS NULL
GROUP BY estado
ORDER BY estado;
