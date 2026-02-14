# Arquitectura del Sistema

Este documento describe la arquitectura técnica de TeamHub, incluyendo el diseño del sistema, stack tecnológico, estructura del proyecto y modelo de datos.

---

## Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENTE (Browser)                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ HTTPS
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (Vercel)                                  │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                        Next.js 15 (App Router)                         │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │ │
│  │  │   Pages      │  │  Components  │  │    Hooks     │  │   Lib      │ │ │
│  │  │  (App Dir)   │  │  (shadcn/ui) │  │(TanStack Q.) │  │  (API)     │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ REST API (JSON)
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND (Railway)                                  │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                          Hono Framework                                │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │ │
│  │  │   Routes     │  │  Services    │  │  Middleware  │  │   Types    │ │ │
│  │  │  (REST API)  │  │  (Business)  │  │ (Auth/Valid) │  │   (Zod)    │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                      │                                       │
│                                      │ Drizzle ORM                           │
│                                      ▼                                       │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         PostgreSQL 16                                  │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐         │ │
│  │  │ users   │ │ depart. │ │plantill.│ │proyectos│ │timtrack.│  ...    │ │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Flujo de Datos

```
Usuario → Frontend (Next.js) → API Client (Axios) → Backend (Hono) → Service → Drizzle → PostgreSQL
                  ↑                                                                    │
                  └──────────────────── JSON Response ─────────────────────────────────┘
```

## Capas de la Aplicación

| Capa | Responsabilidad | Tecnología |
|------|-----------------|------------|
| **Presentación** | UI, interacción usuario, estado cliente | Next.js, React, TanStack Query |
| **API** | Endpoints REST, validación, autenticación | Hono, Zod |
| **Negocio** | Lógica de dominio, reglas de negocio | Services TypeScript |
| **Datos** | Acceso a base de datos, queries | Drizzle ORM |
| **Persistencia** | Almacenamiento de datos | PostgreSQL |

---

## Stack Tecnológico

### Frontend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| React | 19.x | Biblioteca UI declarativa |
| Next.js | 15.x | Framework React con App Router y SSR |
| TypeScript | 5.7.x | Tipado estático y mejor DX |
| Tailwind CSS | 3.4.x | Estilos utility-first |
| shadcn/ui | latest | Componentes UI accesibles y personalizables |
| TanStack Query | 5.x | Gestión de estado servidor y caché |
| React Hook Form | 7.x | Gestión de formularios performante |
| Zod | 3.24.x | Validación de esquemas en runtime |
| D3.js | 7.x | Visualizaciones de datos |
| Lucide React | latest | Iconos SVG |
| Sonner | latest | Notificaciones toast |

### Backend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Node.js | 20.x | Runtime JavaScript |
| Hono | 4.6.x | Framework web ultraligero y rápido |
| TypeScript | 5.7.x | Tipado estático |
| Drizzle ORM | 0.36.x | ORM type-safe con excelente DX |
| drizzle-kit | 1.0.0-beta | CLI para migraciones |
| PostgreSQL | 16.x | Base de datos relacional robusta |
| JWT | 9.x | Autenticación stateless |
| bcryptjs | 2.x | Hashing de passwords |
| Zod | 3.24.x | Validación de entrada |
| Pino | 9.x | Logging estructurado |
| dotenv | 16.x | Variables de entorno |

### Infraestructura y Herramientas

| Tecnología | Propósito |
|------------|-----------|
| Docker (opcional) | Containerización local (ej: PostgreSQL) |
| Vercel | Despliegue frontend (edge network) |
| Railway | Despliegue backend y base de datos |
| GitHub Actions | CI/CD pipelines |
| ESLint 9 | Linting de código (flat config) |
| Vitest 3 | Testing unitario e integración |
| Playwright | Testing E2E y demo automatizada |

---

## Estructura del Proyecto

```
teamhub/
├── backend/                         # API Hono
│   ├── src/
│   │   ├── __tests__/
│   │   ├── config/
│   │   ├── db/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── shared/
│   │   ├── store/
│   │   ├── validators/
│   │   ├── app.ts
│   │   └── index.ts
│   ├── drizzle.config.ts
│   ├── package.json
│   └── .env.example
├── frontend/                        # Aplicación Next.js
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── providers/
│   │   └── types/
│   ├── e2e/                        # Tests E2E (Playwright)
│   │   ├── demo/                   # Demo automatizada
│   │   ├── explorer-bot/           # Bot explorador
│   │   └── helpers/                # Auth, session, retry
│   ├── package.json
│   └── .env.example
├── context/                         # SQL de referencia
├── docs/                            # Documentación
│   ├── adr/
│   ├── api/
│   ├── architecture/
│   ├── backend/
│   ├── frontend/
│   ├── slides/
│   ├── README.md
│   └── decisiones.md
├── .github/
│   ├── workflows/
│   └── copilot-instructions.md
├── .husky/
├── scripts/
├── openapi.yaml                     # Contrato API
├── package.json
├── package-lock.json
├── README.md
├── CONTRIBUTING.md
├── CHECKLIST.md
├── AGENTS.md
├── claude.md
└── LICENSE
```

---

## Modelo de Datos

### Diagrama Entidad-Relación

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────────┐
│     Usuario     │──────│   Departamento  │      │ PlantillaOnboarding │
├─────────────────┤ N:1  ├─────────────────┤      ├─────────────────────┤
│ id              │      │ id              │      │ id                  │
│ email           │      │ nombre          │      │ nombre              │
│ password        │      │ descripcion     │      │ descripcion         │
│ nombre          │      │ codigo          │      │ departamento_id     │◄─┐
│ apellidos       │      │ responsable_id  │──┐   │ rol_destino         │  │
│ rol             │      │ color           │  │   │ duracion_estimada   │  │
│ departamento_id │──────│ activo          │  │   │ activo              │  │
│ manager_id      │──┐   │ created_at      │  │   │ created_by          │  │
│ avatar_url      │  │   │ updated_at      │  │   │ created_at          │  │
│ activo          │  │   └─────────────────┘  │   │ updated_at          │  │
│ ultimo_acceso   │  │            ▲           │   └─────────────────────┘  │
│ created_at      │  │            │           │              │             │
│ updated_at      │  │            │           │              │ 1:N         │
└─────────────────┘  │            │           │              ▼             │
         │           │            │           │   ┌─────────────────────┐  │
         │           └────────────┼───────────┘   │   TareaPlantilla    │  │
         │ 1:N                    │               ├─────────────────────┤  │
         ▼                        │               │ id                  │  │
┌─────────────────────┐           │               │ plantilla_id        │──┘
│  ProcesoOnboarding  │           │               │ titulo              │
├─────────────────────┤           │               │ descripcion         │
│ id                  │           │               │ categoria           │
│ empleado_id         │───────────┘               │ responsable_tipo    │
│ plantilla_id        │──────────────────────────►│ responsable_id      │
│ fecha_inicio        │                           │ dias_desde_inicio   │
│ fecha_fin_esperada  │                           │ duracion_estimada   │
│ fecha_fin_real      │                           │ orden               │
│ estado              │                           │ obligatoria         │
│ progreso            │                           │ requiere_evidencia  │
│ notas               │                           │ instrucciones       │
│ iniciado_por        │                           │ recursos_url        │
│ created_at          │                           │ dependencias        │
│ updated_at          │                           └─────────────────────┘
└─────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────┐
│   TareaOnboarding   │
├─────────────────────┤
│ id                  │
│ proceso_id          │
│ tarea_plantilla_id  │
│ titulo              │
│ descripcion         │
│ categoria           │
│ responsable_id      │──────────────────────────┐
│ fecha_limite        │                          │
│ estado              │                          │
│ prioridad           │                          │
│ completada_at       │                          │
│ completada_por      │                          │
│ notas               │                          │
│ evidencia_url       │                          │
│ comentarios_rechazo │                          │
│ orden               │                          │
│ created_at          │                          │
│ updated_at          │                          │
└─────────────────────┘                          │
                                                 │
┌─────────────────┐      ┌─────────────────────┐ │  ┌─────────────────────┐
│    Proyecto     │──────│ AsignacionProyecto  │ │  │   RegistroTiempo    │
├─────────────────┤ 1:N  ├─────────────────────┤ │  ├─────────────────────┤
│ id              │      │ id                  │ │  │ id                  │
│ nombre          │      │ proyecto_id         │◄┼──│ proyecto_id         │
│ descripcion     │      │ usuario_id          │─┼──│ usuario_id          │──┘
│ codigo          │      │ rol                 │ │  │ asignacion_id       │
│ cliente         │      │ dedicacion_%        │ │  │ fecha               │
│ fecha_inicio    │      │ horas_semanales     │ │  │ horas               │
│ fecha_fin_est   │      │ fecha_inicio        │ │  │ descripcion         │
│ fecha_fin_real  │      │ fecha_fin           │ │  │ tarea               │
│ estado          │      │ tarifa_hora         │ │  │ estado              │
│ manager_id      │──┐   │ notas               │ │  │ aprobado_por        │
│ presupuesto_h   │  │   │ activo              │ │  │ aprobado_at         │
│ horas_consumid  │  │   │ created_at          │ │  │ comentario_rechazo  │
│ prioridad       │  │   │ updated_at          │ │  │ facturable          │
│ color           │  │   └─────────────────────┘ │  │ created_at          │
│ activo          │  │                           │  │ updated_at          │
│ created_at      │  │                           │  └─────────────────────┘
│ updated_at      │  └───────────────────────────┘
└─────────────────┘
```

### Enumeraciones

| Enum | Valores |
|------|---------|
| **UserRole** | ADMIN, RRHH, MANAGER, EMPLEADO |
| **TaskCategory** | DOCUMENTACION, EQUIPAMIENTO, ACCESOS, FORMACION, REUNIONES, ADMINISTRATIVO |
| **ResponsibleType** | RRHH, MANAGER, IT, EMPLEADO, CUSTOM |
| **ProcessStatus** | EN_CURSO, COMPLETADO, CANCELADO, PAUSADO |
| **TaskStatus** | PENDIENTE, EN_PROGRESO, COMPLETADA, BLOQUEADA, CANCELADA |
| **Priority** | BAJA, MEDIA, ALTA, URGENTE |
| **ProjectStatus** | PLANIFICACION, ACTIVO, PAUSADO, COMPLETADO, CANCELADO |
| **TimeEntryStatus** | PENDIENTE, APROBADO, RECHAZADO |

---

## Referencias

- [Decisiones Arquitecturales (ADRs)](decisiones/)
- [Documentación de API](api-reference.md)
- [Contrato OpenAPI](../openapi.yaml)
