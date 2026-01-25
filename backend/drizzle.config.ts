import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  // Use tables.ts instead of index.ts to avoid issues with relations in drizzle-kit
  schema: './src/db/schema/tables.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || '',
  },
});
