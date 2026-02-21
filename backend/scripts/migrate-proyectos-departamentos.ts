/**
 * Script de migración manual para crear la tabla proyectos_departamentos.
 * Ejecutar: NODE_EXTRA_CA_CERTS=certs/ca.pem npx tsx scripts/migrate-proyectos-departamentos.ts
 */
import { Pool } from 'pg';
import { config } from '../src/config/env.js';
import { buildSslConfig, normalizeConnectionString } from '../src/db/postgres-config.js';

async function runMigration() {
  const connectionString = normalizeConnectionString(config.DATABASE_URL);
  const pool = new Pool({ connectionString, ssl: buildSslConfig() });
  const client = await pool.connect();

  try {
    console.log('Applying migration: proyectos_departamentos...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS proyectos_departamentos (
        proyecto_id uuid NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
        departamento_id uuid NOT NULL REFERENCES departamentos(id) ON DELETE CASCADE,
        created_at timestamp with time zone NOT NULL DEFAULT now(),
        PRIMARY KEY (proyecto_id, departamento_id)
      )
    `);
    console.log('✓ Table proyectos_departamentos created');

    await client.query(`
      CREATE INDEX IF NOT EXISTS proyectos_departamentos_proyecto_idx
        ON proyectos_departamentos (proyecto_id)
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS proyectos_departamentos_departamento_idx
        ON proyectos_departamentos (departamento_id)
    `);
    console.log('✓ Indexes created');
    console.log('Migration complete!');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
