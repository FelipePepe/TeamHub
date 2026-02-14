# Slides - Outline (TeamHub)

Estructura para entrega asincrona: cada diapositiva debe ser autoexplicativa y entendible sin presentador.

## 1. Portada
- Titulo del TFM
- Autor, programa, fecha
- Subtitulo de objetivo: "Plataforma para gestionar onboarding, proyectos y timetracking con foco en seguridad y calidad"

## 2. Resumen ejecutivo
- Problema inicial (3 bullets)
- Solucion construida (3 bullets)
- Resultado final (3 bullets con metricas)
- Caja "si solo lees una diapositiva, lee esta"

## 3. Problema y contexto
- Estado inicial del proceso (onboarding/proyectos/horas)
- Riesgos operativos detectados
- Impacto en negocio (tiempo, errores, trazabilidad)
- Mini diagrama "antes"

## 4. Objetivo y alcance del TFM
- Objetivo general
- Objetivos especificos
- Alcance incluido / no incluido
- Criterios de exito

## 5. Arquitectura de la solucion
- Diagrama de alto nivel
- Componentes y responsabilidades
- Flujo principal de datos
- Decisiones de diseño con trade-offs

## 6. Seguridad y autenticacion
- MFA obligatorio y flujo
- JWT/cookies/httpOnly y hardening
- Rate limiting + HMAC
- Tabla "riesgo mitigado -> control aplicado"

## 7. API y contratos (OpenAPI)
- OpenAPI como fuente de verdad
- Coherencia frontend/backend
- Ejemplo de endpoint + esquema
- Beneficio: menos ambiguedad y menos regresiones

## 8. Funcionalidad implementada (evidencias)
- Auth/Perfil
- Onboarding/Tareas
- Proyectos/Dedicaciones
- Timetracking/Aprobaciones
- Capturas + estado final por modulo

## 9. Calidad y testing
- Estrategia de pruebas (frontend/backend)
- Tipos de tests y cobertura
- Quality gates (lint, tests, hooks)
- Resultado y gaps abiertos

## 10. SonarQube y calidad de codigo
- Baseline inicial vs estado actual
- Reglas criticas tratadas
- Deuda tecnica remanente priorizada
- Evidencias (issues/PRs)

## 11. DevOps y flujo de trabajo
- GitFlow aplicado
- CI/CD y validaciones
- Trazabilidad (ADR + Issues)
- Beneficio operativo

## 12. Resultados e impacto
- Impacto tecnico (mantenibilidad, seguridad, calidad)
- Impacto de negocio (fiabilidad, tiempos, riesgo)
- Tabla comparativa antes/despues

## 13. Riesgos, limitaciones y trabajo futuro
- Riesgos abiertos con mitigacion
- Limitaciones actuales
- Roadmap priorizado (corto/medio plazo)

## 14. Conclusiones
- Que se consiguio
- Que queda pendiente
- Valor global del TFM
