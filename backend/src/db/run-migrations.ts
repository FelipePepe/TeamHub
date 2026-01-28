/**
 * Script para ejecutar migraciones SQL con drizzle-orm (sin drizzle-kit CLI).
 * Uso: npx tsx src/db/run-migrations.ts
 */
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { config } from '../config/env.js';
import { buildSslConfig, normalizeConnectionString } from './postgres-config.js';

async function runMigrations() {
  const connectionString = normalizeConnectionString(config.DATABASE_URL);
  const pool = new Pool({ connectionString, ssl: buildSslConfig() });
  const db = drizzle(pool);

  try {
    console.log('Conectando a la base de datos...');
    console.log('Ejecutando migraciones...');
    await migrate(db, { migrationsFolder: 'src/db/migrations' });
    console.log('Migraciones ejecutadas correctamente');
  } catch (error) {
    console.error('ERROR ejecutando migraciones:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
