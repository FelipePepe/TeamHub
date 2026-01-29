import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import swaggerUiDist from 'swagger-ui-dist';
import { errorHandler } from './middleware/error-handler.js';
import { hmacValidation } from './middleware/hmac-validation.js';
import { securityHeaders } from './middleware/security-headers.js';
import { createRateLimiter, getRateLimitIp } from './middleware/rate-limit.js';
import { config } from './config/env.js';
import { apiRoutes } from './routes/index.js';
import { verifyAccessToken } from './services/auth-service.js';
import type { HonoEnv } from './types/hono.js';

const app = new Hono<HonoEnv>();

const getSwaggerAssetsPath = (): string => {
  if (typeof swaggerUiDist.getAbsoluteFSPath === 'function') {
    return swaggerUiDist.getAbsoluteFSPath();
  }
  if (typeof swaggerUiDist.absolutePath === 'function') {
    return swaggerUiDist.absolutePath();
  }
  return swaggerUiDist.absolutePath;
};
const swaggerAssetsPath = getSwaggerAssetsPath();
const resolveRepoRoot = () => {
  let current = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
  while (true) {
    if (existsSync(path.join(current, 'openapi.yaml'))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
    }
    current = parent;
  }
};
const repoRoot = resolveRepoRoot();
const openApiPath = path.join(repoRoot, 'openapi.yaml');
const swaggerHtml = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>TeamHub API Docs</title>
    <link rel="stylesheet" href="/docs/assets/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="/docs/assets/swagger-ui-bundle.js"></script>
    <script src="/docs/assets/swagger-ui-standalone-preset.js"></script>
    <script src="/docs/swagger-init.js"></script>
  </body>
</html>
`;
const swaggerInitScript = `window.onload = function () {
  window.ui = SwaggerUIBundle({
    url: '/openapi.yaml',
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
    layout: 'BaseLayout',
  });
};
`;
let openApiCache: string | null = null;

const globalRateLimit = createRateLimiter({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX,
  keyGenerator: (c) => {
    const authHeader = c.req.header('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '').trim();
      try {
        const payload = verifyAccessToken(token);
        if (payload?.sub) {
          return `user:${payload.sub}`;
        }
      } catch {
        // fall back to IP-based rate limiting
      }
    }
    return `ip:${getRateLimitIp(c)}`;
  },
});

app.use('*', securityHeaders);
app.use('*', cors({ origin: config.corsOrigins }));
app.use('/api/*', hmacValidation);
app.use('/api/*', globalRateLimit);
app.onError(errorHandler);

app.get('/health', (c) => c.json({ status: 'ok' }));
app.get('/openapi.yaml', async (c) => {
  try {
    if (!openApiCache) {
      openApiCache = await readFile(openApiPath, 'utf8');
    }
    c.header('Content-Type', 'application/yaml; charset=utf-8');
    return c.text(openApiCache);
  } catch {
    return c.json({ error: 'OpenAPI spec not found' }, 404);
  }
});
app.get('/docs', (c) => c.html(swaggerHtml));
app.get('/docs/', (c) => c.html(swaggerHtml));
app.get('/docs/swagger-init.js', (c) => {
  return c.body(swaggerInitScript, 200, {
    'Content-Type': 'application/javascript; charset=utf-8',
  });
});
app.get('/docs/api/openapi/components/index.yaml', async (c) => {
  try {
    const raw = await readFile(path.join(repoRoot, 'docs/api/openapi/components/index.yaml'), 'utf8');
    const patched = raw.replaceAll(
      './schemas/',
      '/docs/api/openapi/components/schemas/'
    );
    return c.body(patched, 200, {
      'Content-Type': 'application/yaml; charset=utf-8',
    });
  } catch {
    return c.json({ error: 'OpenAPI components not found' }, 404);
  }
});
app.use(
  '/docs/assets/*',
  serveStatic({
    root: swaggerAssetsPath,
    rewriteRequestPath: (path) => path.replace(/^\/docs\/assets\/?/, ''),
  })
);
app.use(
  '/docs/api/openapi/*',
  serveStatic({
    root: repoRoot,
    rewriteRequestPath: (path) => path.replace(/^\/docs\//, 'docs/'),
  })
);

app.route('/api', apiRoutes);

export default app;
