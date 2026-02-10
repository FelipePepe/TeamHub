// Sentry must be imported first for proper error tracking
import './instrument.js';
import 'dotenv/config';
import { serve } from '@hono/node-server';
import app from './app.js';
import { config } from './config/env.js';

const port = config.PORT;

serve({ fetch: app.fetch, port });

console.log(`API listening on http://localhost:${port}`);
