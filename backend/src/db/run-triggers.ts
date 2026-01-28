/**
 * Script para ejecutar los triggers SQL después de las migraciones.
 * Uso: npx tsx src/db/run-triggers.ts
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';
import { config } from '../config/env.js';
import { buildSslConfig, normalizeConnectionString } from './postgres-config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function runTriggers() {
  const connectionString = normalizeConnectionString(config.DATABASE_URL);
  const pool = new Pool({ connectionString, ssl: buildSslConfig() });

  try {
    console.log('🔄 Conectando a la base de datos...');
    const client = await pool.connect();

    console.log('📄 Leyendo archivo de triggers...');
    const triggersPath = join(__dirname, 'triggers.sql');
    const triggersSql = readFileSync(triggersPath, 'utf-8');

    console.log('⚡ Ejecutando triggers...');
    await client.query(triggersSql);

    console.log('✅ Triggers ejecutados correctamente');

    // Verificar triggers creados
    const { rows: triggers } = await client.query(`
      SELECT trigger_name, event_object_table, action_timing, event_manipulation
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
      ORDER BY event_object_table, trigger_name
    `);

    console.log('\n📋 Triggers activos:');
    console.log('─'.repeat(70));
    for (const trigger of triggers) {
      console.log(
        `  ${trigger.trigger_name.padEnd(30)} │ ${trigger.event_object_table.padEnd(25)} │ ${trigger.action_timing} ${trigger.event_manipulation}`
      );
    }
    console.log('─'.repeat(70));
    console.log(`Total: ${triggers.length} triggers\n`);

    client.release();
  } catch (error) {
    console.error('❌ Error ejecutando triggers:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runTriggers();
