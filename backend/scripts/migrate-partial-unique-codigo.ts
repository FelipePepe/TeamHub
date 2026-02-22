/**
 * Script de migración manual: reemplaza el constraint único simple de
 * proyectos.codigo por un partial unique index (WHERE deleted_at IS NULL).
 * Esto permite reutilizar códigos de proyectos eliminados (soft-delete).
 *
 * Ejecutar: NODE_EXTRA_CA_CERTS=certs/ca.pem npx tsx scripts/migrate-partial-unique-codigo.ts
 */
import { Pool } from 'pg';
import { config } from '../src/config/env.js';
import { buildSslConfig, normalizeConnectionString } from '../src/db/postgres-config.js';

const connectionString = normalizeConnectionString(config.DATABASE_URL);
const pool = new Pool({ connectionString, ssl: buildSslConfig() });
const client = await pool.connect();

try {
  console.log('Applying migration: partial unique index on proyectos.codigo...');

  // 1. Drop the table-level unique constraint
  await client.query(`
    ALTER TABLE "proyectos" DROP CONSTRAINT IF EXISTS "proyectos_codigo_unique"
  `);
  console.log('✓ Dropped constraint proyectos_codigo_unique');

  // 2. Drop the full unique index
  await client.query(`
    DROP INDEX IF EXISTS "proyectos_codigo_idx"
  `);
  console.log('✓ Dropped index proyectos_codigo_idx');

  // 3. Create partial unique index (only enforces uniqueness for active projects)
  await client.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS "proyectos_codigo_active_idx"
      ON "proyectos" ("codigo")
      WHERE "deleted_at" IS NULL
  `);
  console.log('✓ Created partial unique index proyectos_codigo_active_idx');

  console.log('Migration complete!');
} catch (error) {
  console.error('Migration error:', error);
  process.exit(1);
} finally {
  client.release();
  await pool.end();
}
