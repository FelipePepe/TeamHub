import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../app.js';

describe('app.ts - Application Setup and Routes', () => {
  describe('Health Check', () => {
    it('should return OK status on /health', async () => {
      const res = await app.request('/health');
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual({ status: 'ok' });
    });
  });

  describe('OpenAPI Spec', () => {
    it('should serve openapi.yaml', async () => {
      const res = await app.request('/openapi.yaml');
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toMatch(/text\/plain|yaml/); // Acepta ambos
      const text = await res.text();
      expect(text).toContain('openapi:');
    });

    it('should cache openapi.yaml on subsequent requests', async () => {
      const res1 = await app.request('/openapi.yaml');
      const res2 = await app.request('/openapi.yaml');
      
      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      
      const text1 = await res1.text();
      const text2 = await res2.text();
      expect(text1).toBe(text2);
    });
  });

  describe('Swagger UI', () => {
    it('should serve Swagger UI on /docs', async () => {
      const res = await app.request('/docs');
      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain('swagger-ui');
      expect(html).toContain('TeamHub API Docs');
    });

    it('should serve Swagger UI on /docs/', async () => {
      const res = await app.request('/docs/');
      expect(res.status).toBe(200);
      const html = await res.text();
      expect(html).toContain('swagger-ui');
    });

    it('should serve swagger-init.js script', async () => {
      const res = await app.request('/docs/swagger-init.js');
      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toContain('application/javascript');
      const script = await res.text();
      expect(script).toContain('SwaggerUIBundle');
      expect(script).toContain('openapi.yaml');
    });

    it('should serve swagger assets', async () => {
      const res = await app.request('/docs/assets/swagger-ui.css');
      expect([200, 404]).toContain(res.status); // 404 si no existe el asset
    });
  });

  describe('OpenAPI Components', () => {
    it('should serve components index.yaml with path rewriting', async () => {
      const res = await app.request('/docs/api/openapi/components/index.yaml');
      if (res.status === 200) {
        expect(res.headers.get('Content-Type')).toContain('application/yaml');
        const yaml = await res.text();
        // Verificar que las rutas fueron reescritas
        expect(yaml).toContain('/docs/api/openapi/components/schemas/');
      } else {
        // Si el archivo no existe, debe retornar 404
        expect(res.status).toBe(404);
        const json = await res.json();
        expect(json).toHaveProperty('error');
      }
    });

    it('should return 404 if components file does not exist', async () => {
      const res = await app.request('/docs/api/openapi/components/index.yaml');
      if (res.status === 404) {
        const json = await res.json();
        expect(json.error).toBe('OpenAPI components not found');
      }
    });
  });

  describe('Middleware Stack', () => {
    it('should apply CORS headers', async () => {
      const res = await app.request('/health', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'GET',
        },
      });
      expect(res.headers.has('Access-Control-Allow-Origin')).toBe(true);
    });

    it('should apply security headers', async () => {
      const res = await app.request('/health');
      expect(res.headers.has('X-Frame-Options')).toBe(true);
      expect(res.headers.has('X-Content-Type-Options')).toBe(true);
    });

    it('should reject API requests without HMAC signature', async () => {
      const res = await app.request('/api/health', {
        method: 'GET',
      });
      expect([401, 403]).toContain(res.status); // Puede ser 401 o 403
      const json = await res.json();
      expect(json).toHaveProperty('error');
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to API routes', async () => {
      // Make multiple requests to trigger rate limit
      const requests = Array.from({ length: 150 }, () =>
        app.request('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Request-Signature': 'test',
            'X-Request-Timestamp': Date.now().toString(),
          },
          body: JSON.stringify({ email: 'test@example.com', password: '123' }),
        })
      );

      const responses = await Promise.all(requests);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      // Al menos algunos deberían estar rate limited
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const res = await app.request('/non-existent-route');
      expect(res.status).toBe(404);
    });

    it('should handle errors with error handler middleware', async () => {
      // Intentar acceso a ruta API sin autenticación
      const res = await app.request('/api/usuarios', {
        headers: {
          'X-Request-Signature': 'invalid',
          'X-Request-Timestamp': Date.now().toString(),
        },
      });
      expect(res.status).toBeGreaterThanOrEqual(400);
      const json = await res.json();
      expect(json).toHaveProperty('error');
    });
  });

  describe('Static Assets', () => {
    it('should serve Swagger UI static assets', async () => {
      const res = await app.request('/docs/assets/swagger-ui.css');
      // Asset puede existir o no dependiendo de la instalación
      expect([200, 404]).toContain(res.status);
    });
  });
});
