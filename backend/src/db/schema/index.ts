// ============================================================================
// SCHEMA INDEX - Re-exports all schema definitions
// ============================================================================

// Enums
export * from './enums';

// Tables
export * from './users';
export * from './departamentos';
export * from './plantillas';
export * from './procesos';
export * from './proyectos';
export * from './timetracking';
export * from './audit';

// Relations (for Drizzle query builder with relational queries)
// Note: Relations are defined separately and imported in db/index.ts
// to avoid issues with drizzle-kit during migration generation.
// Import from './relations.js' when needed for query building.
