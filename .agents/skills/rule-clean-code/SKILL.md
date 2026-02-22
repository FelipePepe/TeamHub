---
name: rule-clean-code
description: Engineering standards for clean code, refactoring and architecture in this repo. Load this skill when implementing features, writing functions or components, refactoring existing code, or doing code review. Triggers on: implement, feature, refactor, create function, create component, code review, escribir código, implementar, refactorizar, clean code, magic number, cyclomatic complexity, frontend backend separation, pure function, business logic.
---

# Estándares de Desarrollo (Clean Code & Refactoring)

## Misión y Mindset
Actúa como un **Senior Software Engineer** enfocado en la mantenibilidad a largo plazo. Prioriza la calidad sobre la rapidez, aplicando siempre la **Boy Scout Rule**: "Deja el código mejor de como lo encontraste".

## Fuentes de Verdad (consultar en este orden)
1. **Arquitectura:** `docs/adr/` — decisiones inmutables; si cambian, se genera un nuevo ADR.
2. **Contratos de API:** `openapi.yaml` o `docs/api/` — única fuente de verdad para endpoints y esquemas.
3. **UI/Componentes:** `*.stories.tsx` (Storybook) — revisar variantes y props para evitar duplicidad.
4. **Reglas de Negocio:** `backend/src/shared/constants/business-rules.ts`.

## Reglas de Código

### Funciones Puras
Prioriza funciones determinísticas sin efectos secundarios para lógica de cálculo.

### Eliminación de Code Smells
- Sustituir **Magic Numbers** por constantes nombradas.
- Evitar **Primitive Obsession** mediante tipos específicos o hooks de formateo.
- Eliminar **Dead Code** inmediatamente; Git preserva la historia.

### Patrones Preferidos
- **Strategy** para eliminar `switch` complejos.
- **Command** para operaciones que requieran historial o "undo".

### Complejidad Ciclomática
- Mantén **< 5**. Si supera 10, es **obligatorio** refactorizar antes de continuar.

### Separación Frontend / Backend
**REGLA ABSOLUTA:** Toda la lógica de negocio reside en el **backend**. El frontend es una capa de presentación.

| ✅ Frontend PUEDE | ❌ Frontend NO PUEDE |
|------------------|---------------------|
| Formatear fechas, monedas para visualización | Transformar o calcular datos de negocio |
| Reflejar exactamente el contrato OpenAPI | Renombrar campos o invertir semántica |
| Mostrar datos que el backend devuelve | Derivar datos que debería calcular el backend |

Si el frontend necesita un dato adicional → añadirlo al endpoint del backend y actualizar OpenAPI.

### JSDoc/TSDoc obligatorio en métodos
Toda función/método debe llevar comentario `/** ... */` que explique:
- Propósito y contrato
- `@param` — parámetros de entrada
- `@returns` — valor de retorno
- `@throws` — errores/excepciones si aplica
- `@example` — cuando aporte claridad
