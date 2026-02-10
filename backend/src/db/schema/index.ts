// ============================================================================
// SCHEMA INDEX - Re-exports all schema definitions
// ============================================================================

// Enums
export * from './enums.js';

// Tables
export * from './users.js';
export * from './departamentos.js';
export * from './plantillas.js';
export * from './procesos.js';
export * from './proyectos.js';
export * from './timetracking.js';
export * from './tareas.js';
export * from './error-logs.js';
export * from './audit.js';

// Relations (for Drizzle query builder with relational queries)
// Note: Relations are defined separately and imported in db/index.ts
// to avoid issues with drizzle-kit during migration generation.
// Import from './relations.js' when needed for query building.
