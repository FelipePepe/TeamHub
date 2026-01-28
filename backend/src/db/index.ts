import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema/index.js';
import * as relations from './schema/relations.js';
import { config } from '../config/env.js';
import { buildSslConfig, normalizeConnectionString } from './postgres-config.js';

const sslConfig = buildSslConfig();
const connectionString = normalizeConnectionString(config.DATABASE_URL);

const pool = new Pool({
  connectionString,
  max: 10, // máximo de conexiones en el pool
  idleTimeoutMillis: 30000, // tiempo antes de cerrar conexiones inactivas
  connectionTimeoutMillis: 2000, // tiempo máximo para establecer conexión
  ssl: sslConfig,
});

// Combinar schema con relaciones para el query builder
const fullSchema = { ...schema, ...relations };

// Instancia de Drizzle con el schema completo (tablas + relaciones)
export const db = drizzle(pool, { schema: fullSchema });

// Exportar pool para operaciones directas (como triggers)
export { pool };

// Tipos útiles
export type DbClient = typeof db;

// Re-export schema para uso en servicios
export { schema };
