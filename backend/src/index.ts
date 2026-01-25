import 'dotenv/config';
import { serve } from '@hono/node-server';
import app from './app';
import { config } from './config/env';

const port = config.PORT;

serve({ fetch: app.fetch, port });

console.log(`API listening on http://localhost:${port}`);
