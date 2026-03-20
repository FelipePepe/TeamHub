# TeamHub

**Plataforma de Onboarding y Gestión de Asignaciones de Empleados**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB.svg)](https://reactjs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.x-black.svg)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.x-336791.svg)](https://www.postgresql.org/)
[![Hono](https://img.shields.io/badge/Hono-4.6-orange.svg)](https://hono.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🎯 Pruébalo en 2 minutos

Sin instalar nada. La app está desplegada en producción.

**→ [teamhub-tfm.vercel.app](https://teamhub-tfm.vercel.app)**

Las credenciales de demo están en: [**FelipePepe/teamhub-setup**](https://github.com/FelipePepe/teamhub-setup) *(repo privado del evaluador)*.

**Elige el rol que quieres explorar:**

| Rol | Qué verás en 2 minutos |
|-----|------------------------|
| **RRHH** | Dashboard con KPIs → *Onboarding* → iniciar proceso para un empleado y ver su progreso en tiempo real |
| **MANAGER** | Dashboard con carga del equipo → *Proyectos* → asignar empleado respetando el límite del 100% de dedicación |
| **EMPLEADO** | Widget *Mi Onboarding* en el dashboard → completar una tarea → registrar horas en *Timetracking* |
| **ADMIN** | Vista global de usuarios, roles, actividad reciente y métricas del sistema |

> 💡 **Ruta recomendada:** empieza como **RRHH** — crea una plantilla de onboarding, inicia un proceso y observa cómo avanzan las tareas. Luego cambia a **EMPLEADO** para ver el mismo proceso desde el otro lado.


---

## Tabla de Contenidos

- [Pruébalo en 2 minutos](#-pruébalo-en-2-minutos)
- [Descripción General](#descripción-general)
- [Estado del Proyecto](#-estado-del-proyecto)
- [Quick Start](#-quick-start)
- [Documentación](#-documentación)
- [URLs de Producción](#-urls-de-producción)
- [Features Principales](#-features-principales)
- [Tecnologías](#-tecnologías)
- [Contribuir](#contribuir)
- [Autor](#autor)
- [Licencia](#licencia)

---

## Descripción General

TeamHub es una solución integral para gestionar el ciclo de vida del empleado desde su incorporación hasta su operatividad completa en proyectos. La plataforma unifica los procesos de **onboarding**, **asignación a proyectos** y **registro de horas** de trabajo en una única herramienta.

### Problema que Resuelve

Las empresas enfrentan múltiples desafíos al incorporar nuevos empleados:

- **Procesos fragmentados**: Onboardings gestionados en hojas de cálculo dispersas
- **Falta de visibilidad**: Imposibilidad de conocer el estado real del proceso de incorporación
- **Gestión por email**: Asignaciones a proyectos comunicadas sin sistema formal
- **Sistemas desconectados**: Registro de horas en herramientas separadas
- **Métricas inexistentes**: Sin datos para medir tiempo hasta productividad

TeamHub centraliza toda esta información proporcionando **visibilidad en tiempo real** a RRHH, managers y empleados.

### Propuesta de Valor

| Rol | Beneficios |
|-----|------------|
| **RRHH** | Visibilidad completa del estado de onboardings, identificación de cuellos de botella, métricas de tiempo hasta productividad |
| **Managers** | Control de la carga de trabajo del equipo, gestión de asignaciones a proyectos, aprobación de horas registradas |
| **Empleados** | Claridad sobre sus tareas de incorporación, visibilidad de proyectos asignados, registro sencillo de dedicación |

---

## 📊 Estado del Proyecto

> **Última actualización:** 20 de marzo de 2026 | **Versión:** v1.7.2

### ✅ Progreso General: 100%

| Componente | Estado | Tests |
|------------|--------|-------|
| **Backend** | ✅ Completo | 663/663 ✅ |
| **Frontend** | ✅ Completo | 383/383 ✅ |
| **Total Tests** | ✅ Pasando | **1,046/1,046** ✅ |

### 📈 Métricas de Calidad

| Métrica | Backend | Frontend | Estado |
|---------|---------|----------|--------|
| **Coverage** | 81.01% | 90.07% | ✅ Objetivo cumplido |
| **SonarQube Bugs** | 0 | 0 | ✅ Clean |
| **Vulnerabilities** | 0 | 0 | ✅ Secure |
| **Linting Warnings** | 49 | 0 | ⚠️ Only `any` in tests |

### 🎯 Features Completas

✅ **Autenticación & Seguridad**
- Login JWT + MFA obligatorio (TOTP)
- Backup codes MFA y recuperación de contraseña
- HMAC authentication para API
- Rate limiting y RBAC granular

✅ **Gestión de Usuarios y Departamentos**
- CRUD completo usuarios (ADMIN/RRHH/MANAGER/EMPLEADO)
- Gestión departamentos con responsables

✅ **Módulo de Onboarding**
- Plantillas de onboarding reutilizables
- Procesos de onboarding con tareas automatizadas
- Seguimiento de progreso en tiempo real

✅ **Proyectos y Asignaciones**
- CRUD de proyectos con estados
- **N:M Proyectos ↔ Departamentos** (proyectos pueden pertenecer a múltiples departamentos)
- Asignación de empleados a proyectos con **filtro por departamentos del proyecto**
- Validación de carga de trabajo (máx 100%)

✅ **Timetracking**
- Registro de horas por proyecto
- Aprobación/rechazo por managers
- Resúmenes y reportes

✅ **Dashboards por Rol**
- Admin, RRHH, Manager y Empleado
- KPIs y métricas en tiempo real
- Gráficos D3.js interactivos

Ver detalles completos en [docs/features.md](docs/features.md) y [docs/releases.md](docs/releases.md).

---

## 🚀 Quick Start

### Prerrequisitos

- Node.js 20.x o superior
- PostgreSQL 16.x
- npm 10.x o superior

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/FelipePepe/TeamHub.git
cd TeamHub

# Configurar variables de entorno
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
# Editar .env con tus credenciales

# Backend
cd backend
npm install
npm run db:migrate
npm run db:triggers
npm run db:seed
npm run dev

# Frontend (en otra terminal)
cd frontend
npm install
npm run dev
```

Accede a:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **Swagger UI**: http://localhost:3001/docs

Ver guía completa de instalación en [docs/deployment.md](docs/deployment.md).

---

## 📚 Documentación

La documentación está modularizada para facilitar su navegación:

| Documento | Descripción |
|-----------|-------------|
| **[Arquitectura](docs/architecture.md)** | Diagrama del sistema, stack tecnológico, estructura del proyecto, modelo de datos |
| **[Features](docs/features.md)** | Funcionalidades principales detalladas por módulo |
| **[API Reference](docs/api-reference.md)** | Endpoints, autenticación, respuestas de error, Swagger |
| **[Seguridad](docs/security.md)** | Autenticación JWT+MFA, HMAC, headers, OWASP coverage, Husky hooks |
| **[Testing](docs/testing.md)** | Estrategia de testing, cobertura, E2E con Playwright, quality gates |
| **[Deployment](docs/deployment.md)** | Instalación local, variables de entorno, despliegue en Vercel/Railway, CI/CD |
| **[Development](docs/development.md)** | Checklist de fases, troubleshooting, debugging, logs |
| **[Roadmap](docs/roadmap.md)** | Mejoras futuras planificadas (v1.7, v2.0, v3.0+) |
| **[Releases](docs/releases.md)** | Historial de versiones y cambios |
| **[Decisiones](docs/decisiones/)** | ADRs y evolución arquitectural del proyecto |

### Documentación Adicional

- **[CHECKLIST.md](CHECKLIST.md)**: Detalle completo de todas las tareas del proyecto
- **[CONTRIBUTING.md](CONTRIBUTING.md)**: Guía de contribución y convenciones
- **[AGENTS.md](AGENTS.md)**: Manual de operaciones para agentes de IA

---

## 🌐 URLs de Producción

| Servicio | URL | Estado |
|----------|-----|--------|
| **Frontend** | https://teamhub-tfm.vercel.app | ✅ Desplegado |
| **Backend API** | https://teamhub-bxi0.onrender.com | ✅ Desplegado |
| **Swagger UI** | https://teamhub-bxi0.onrender.com/docs | ✅ Disponible |
| **Base de Datos** | Aiven PostgreSQL (managed) | ✅ Activo |

---

## ✨ Features Principales

### 1. Autenticación y Usuarios
- Login con JWT (access + refresh tokens)
- **MFA obligatorio** (Google Authenticator)
- Recuperación de contraseña por email
- Gestión de usuarios con 4 roles: ADMIN, RRHH, MANAGER, EMPLEADO

### 2. Módulo de Onboarding
- Creación de **plantillas de onboarding** reutilizables por departamento/rol
- Tareas con dependencias, responsables y fechas límite
- Procesos de onboarding automatizados
- Seguimiento de progreso en tiempo real
- Alertas de tareas vencidas

### 3. Proyectos y Asignaciones
- CRUD de proyectos con estados (Planificación, Activo, Pausado, Completado)
- **Proyectos multi-departamento:** relación N:M con tabla pivote `proyectos_departamentos`
- Asignación de empleados filtrada por departamentos del proyecto
- Validación: dedicación total no puede superar 100%
- Vista de carga de trabajo del equipo

### 4. Timetracking
- Registro de horas por proyecto
- Vista semanal con calendario
- Aprobación/rechazo de horas por managers
- Indicadores de estado (Pendiente, Aprobado, Rechazado)

### 5. Dashboards por Rol
- **ADMIN**: Usuarios, proyectos, horas totales, actividad reciente
- **RRHH**: Onboardings, tiempo medio, tareas vencidas
- **MANAGER**: Carga del equipo, horas pendientes de aprobar
- **EMPLEADO**: Progreso de onboarding, proyectos, horas del mes

Ver lista completa en [docs/features.md](docs/features.md).

---

## 🛠 Tecnologías

### Frontend
- **React 19** + **Next.js 15** (App Router)
- **TypeScript 5.7** con tipado estricto
- **Tailwind CSS** + **shadcn/ui** (componentes accesibles)
- **TanStack Query 5** (gestión de estado servidor)
- **D3.js** (visualizaciones de datos)
- **Zod** (validación de esquemas)

### Backend
- **Node.js 20** + **Hono 4.6** (framework ultraligero)
- **TypeScript 5.7**
- **Drizzle ORM** (type-safe con PostgreSQL 16)
- **JWT** + **bcrypt** (autenticación y hashing)
- **Zod** (validación de entrada)
- **Pino** (logging estructurado)

### Infraestructura
- **Vercel** (frontend deployment)
- **Railway** (backend deployment)
- **Aiven PostgreSQL** (base de datos managed)
- **GitHub Actions** (CI/CD)
- **Vitest** + **Playwright** (testing)

Ver stack completo en [docs/architecture.md](docs/architecture.md).

---

## Contribuir

Ver [CONTRIBUTING.md](CONTRIBUTING.md) para guías de contribución.

### Proceso
1. Fork del repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de cambios (`git commit -m 'feat: añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

### Convenciones de Commits
Seguimos [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` Nueva funcionalidad
- `fix:` Corrección de bug
- `docs:` Documentación
- `style:` Formateo, sin cambios de código
- `refactor:` Refactorización
- `test:` Tests
- `chore:` Mantenimiento

---

## Autor

**Felipe Jose Perez Gomez**

Trabajo de Fin de Máster - Máster en Desarrollo con IA  
BIG School  
Febrero 2026

---

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

```
MIT License

Copyright (c) 2026 FelipePepe

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
