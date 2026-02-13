# Opciones para Resolver Cold Start en Render

## 📊 Contexto del Problema

**Situación actual:**
- Backend en Render free tier se apaga tras 15 minutos de inactividad (spin down)
- Al despertar (cold start) tarda ~30-60 segundos en estar operativo
- Frontend tiene timeout de **10 segundos** (`timeout: 10000` en `api.ts`)
- Rate limiter de login: **5 intentos por minuto** por IP
- Al fallar por timeout, usuarios reintenta → se bloquea la cuenta

**Configuración actual:**
```typescript
// frontend/src/lib/api.ts
timeout: 10000  // 10 segundos

// backend rate limits
LOGIN_RATE_LIMIT_MAX: 5         // 5 intentos
LOGIN_RATE_LIMIT_WINDOW_MS: 60000  // 1 minuto
```

---

## 🎯 Opciones de Solución

### **Opción 1: Keep-Alive con Cron Job (Gratis, Fácil)**

**Concepto:** Hacer ping al backend cada 10-14 minutos para mantenerlo despierto.

**Implementación:**
1. Crear endpoint `/health` (ya existe)
2. Usar servicio externo gratuito:
   - [UptimeRobot](https://uptimerobot.com) - Ping cada 5 min (gratis)
   - [Cron-job.org](https://cron-job.org) - Cron flexible (gratis)
   - GitHub Actions Scheduled Workflow

**Pros:**
- ✅ Gratis
- ✅ Fácil de configurar (5 minutos)
- ✅ No requiere cambios en código
- ✅ Mantiene el backend activo 24/7

**Contras:**
- ⚠️ Usa recursos incluso sin tráfico real
- ⚠️ Render puede detectarlo como "artificial usage" (riesgo bajo)
- ⚠️ Si el servicio de ping falla, backend se apaga

**Esfuerzo:** 🟢 Bajo (1-2 horas)
**Costo:** 💰 Gratis

**Recomendación:** ✅ **Implementar primero** como quick-win.

---

### **Opción 2: Aumentar Timeouts + Loading UI (Intermedia)**

**Concepto:** Aceptar cold starts pero manejarlos gracefully.

**Implementación:**
1. Aumentar timeout frontend a 60s en primera request
2. Añadir UI de loading con mensaje: "Despertando servidor..."
3. Implementar retry inteligente con backoff exponencial
4. Excluir cold start requests del rate limiter

**Código:**
```typescript
// frontend/src/lib/api.ts
timeout: 60000,  // 60s para primera request

// Interceptor para retry en cold start
api.interceptors.response.use(null, async (error) => {
  if (error.code === 'ECONNABORTED' && !error.config._retryCount) {
    error.config._retryCount = 1;
    error.config.timeout = 90000; // 90s en retry
    return api.request(error.config);
  }
  throw error;
});

// backend: Skip rate limit si es primera request después de wake-up
const skipRateLimitForColdStart = (c) => {
  const uptime = process.uptime();
  return uptime < 120; // Skip primeros 2 minutos
};
```

**Pros:**
- ✅ Gratis
- ✅ Mejor UX (usuario sabe que está pasando)
- ✅ No depende de servicios externos
- ✅ Reduce bloqueos de cuenta

**Contras:**
- ⚠️ Primera request sigue siendo lenta (30-60s)
- ⚠️ Requiere cambios en frontend y backend
- ⚠️ No elimina el problema, solo lo hace más tolerable

**Esfuerzo:** 🟡 Medio (4-6 horas)
**Costo:** 💰 Gratis

**Recomendación:** ✅ **Combinar con Opción 1** para cobertura completa.

---

### **Opción 3: Migrar a Render Paid ($7/mes)**

**Concepto:** Pagar por instancia que nunca se apaga.

**Plan:** Render Starter - $7/mes
- Sin spin down (24/7 activo)
- 512 MB RAM (vs 256 MB free)
- Prioridad en recursos

**Pros:**
- ✅ Elimina completamente cold starts
- ✅ Mejor rendimiento general
- ✅ Más RAM (reduce OOM crashes)
- ✅ Soporte prioritario

**Contras:**
- ❌ Costo mensual ($7/mes = $84/año)
- ⚠️ Solo soluciona Render, no otros problemas

**Esfuerzo:** 🟢 Bajo (click en UI)
**Costo:** 💰 $7/mes

**Recomendación:** ⚠️ **Solo si presupuesto lo permite** o si es crítico para producción.

---

### **Opción 4: Migrar a Railway (Gratis con límites)**

**Concepto:** Cambiar de proveedor cloud.

**Plan:** Railway Hobby - $5 free credit/mes
- Sin spin down automático
- Pay-as-you-go después de crédito
- ~500 horas/mes gratis

**Pros:**
- ✅ Sin cold starts (siempre activo)
- ✅ Mejor DX que Render
- ✅ Deploy automático desde GitHub
- ✅ PostgreSQL incluido en mismo plan

**Contras:**
- ⚠️ Requiere migración completa
- ⚠️ Crédito gratis se puede agotar (~21 días uptime)
- ⚠️ Después de crédito: ~$5-10/mes

**Esfuerzo:** 🔴 Alto (1-2 días)
**Costo:** 💰 Gratis (5 credit/mes) → ~$5-10/mes después

**Recomendación:** ⚠️ **Considerar para MVP serio**, pero alto esfuerzo.

---

### **Opción 5: Serverless (Vercel Functions o AWS Lambda)**

**Concepto:** Backend serverless que escala a 0 pero despierta en <1s.

**Implementación:**
- Migrar a Vercel Edge Functions o AWS Lambda
- Cold start: 500ms-2s (vs 30-60s Render)
- DB connection pooling con Prisma Data Proxy o PgBouncer

**Pros:**
- ✅ Cold start ultra-rápido (<2s)
- ✅ Escala automáticamente
- ✅ Pay-per-use (más barato con poco tráfico)
- ✅ Vercel frontend + backend en mismo provider

**Contras:**
- ❌ Refactor completo del backend (no soporta HTTP long-lived connections)
- ❌ Limitaciones serverless (timeouts 10-60s, no stateful)
- ❌ DB connections complejas (necesita connection pooler)
- ❌ Requiere repensar arquitectura

**Esfuerzo:** 🔴 Muy Alto (1-2 semanas)
**Costo:** 💰 Variable (~$0-20/mes según tráfico)

**Recomendación:** ❌ **No para este proyecto** (sobre-ingeniería para el caso de uso).

---

### **Opción 6: Hybrid: Keep-Alive + Graceful Degradation**

**Concepto:** Combinar múltiples estrategias defensivas.

**Implementación:**
1. **Keep-alive con UptimeRobot** (mantener activo)
2. **Aumentar timeout en frontend** (60s) con UI de loading
3. **Skip rate limit** en primeros 2 minutos de uptime
4. **Retry inteligente** con exponential backoff
5. **Health check** que precaliente pool de DB

**Código:**
```typescript
// backend: Health check que precalienta DB
app.get('/health', async (c) => {
  const startTime = process.uptime();
  
  // Si estamos "cold", precalentar DB
  if (startTime < 60) {
    try {
      await db.select().from(usuarios).limit(1);
    } catch (e) {
      // Log pero no fallar health check
    }
  }
  
  return c.json({ 
    status: 'ok', 
    uptime: startTime,
    coldStart: startTime < 120 
  });
});

// frontend: Retry con backoff
const retryWithBackoff = async (fn, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      if (error.code === 'ECONNABORTED') {
        await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
      }
    }
  }
};
```

**Pros:**
- ✅ Gratis
- ✅ Múltiples capas de defensa
- ✅ Mejor UX incluso si algo falla
- ✅ Reduce bloqueos a casi 0

**Contras:**
- ⚠️ Más código a mantener
- ⚠️ Complejidad media

**Esfuerzo:** 🟡 Medio (6-8 horas)
**Costo:** 💰 Gratis

**Recomendación:** ✅ **MEJOR OPCIÓN para producción real sin presupuesto**.

---

## 📊 Comparativa Rápida

| Opción | Esfuerzo | Costo | Efectividad | Recomendación |
|--------|----------|-------|-------------|---------------|
| 1. Keep-Alive (UptimeRobot) | 🟢 Bajo | 💰 Gratis | ⭐⭐⭐ | ✅ Quick win |
| 2. Timeouts + UI | 🟡 Medio | 💰 Gratis | ⭐⭐⭐⭐ | ✅ Combinar con #1 |
| 3. Render Paid | 🟢 Bajo | 💰 $7/mes | ⭐⭐⭐⭐⭐ | ⚠️ Si hay presupuesto |
| 4. Railway | 🔴 Alto | 💰 ~$5-10/mes | ⭐⭐⭐⭐⭐ | ⚠️ Para MVP serio |
| 5. Serverless | 🔴 Muy Alto | 💰 Variable | ⭐⭐⭐⭐ | ❌ Sobre-ingeniería |
| 6. Hybrid (1+2) | 🟡 Medio | 💰 Gratis | ⭐⭐⭐⭐⭐ | ✅ **MEJOR** |

---

## 🎯 Recomendación Final

### **Para TFM/Desarrollo:**
Implementar **Opción 6 (Hybrid)** paso a paso:

**Fase 1 (Hoy, 30 min):**
- Configurar UptimeRobot con ping cada 10 min

**Fase 2 (Esta semana, 4-6 horas):**
- Aumentar timeouts frontend (60s)
- Añadir UI "Despertando servidor..." si demora >5s
- Skip rate limit en primeros 2 min de uptime

**Fase 3 (Opcional, 2 horas):**
- Retry inteligente con backoff
- Health check que precalienta DB

### **Para Producción Real:**
- Si presupuesto $0: **Opción 6 completa**
- Si presupuesto $7/mes: **Opción 3** (Render Paid) + keep-alive de respaldo
- Si presupuesto $10+/mes: **Opción 4** (Railway) + monitoreo

---

## 📝 Configuración de Rate Limit Recomendada

```bash
# .env backend (ajustar para cold starts)

# Rate limit general (mantener)
RATE_LIMIT_WINDOW_MS=60000  # 1 minuto
RATE_LIMIT_MAX=100          # 100 requests/min

# Rate limit de login (AUMENTAR para cold starts)
LOGIN_RATE_LIMIT_WINDOW_MS=300000  # 5 minutos (era 1 min)
LOGIN_RATE_LIMIT_MAX=10            # 10 intentos (era 5)

# Alternativamente: skip rate limit en cold start (ver código Opción 6)
```

---

## 🔍 Detección de Cold Start

Añadir header para que frontend sepa si backend está "frío":

```typescript
// backend/src/middleware/cold-start-detector.ts
export const coldStartDetector = (): MiddlewareHandler => {
  return async (c, next) => {
    const uptime = process.uptime();
    if (uptime < 120) {
      c.header('X-Cold-Start', 'true');
      c.header('X-Uptime', uptime.toString());
    }
    await next();
  };
};

// frontend: UI condicional
if (response.headers.get('X-Cold-Start') === 'true') {
  showToast('El servidor se está despertando, esto puede tomar unos segundos...');
}
```

---

## 🚀 Implementación Inmediata (15 minutos)

### 1. Configurar UptimeRobot

1. Ir a https://uptimerobot.com (registro gratis)
2. Add New Monitor:
   - Monitor Type: HTTP(s)
   - URL: `https://tu-backend.onrender.com/health`
   - Monitoring Interval: **10 minutes**
3. Guardar

✅ Listo, backend nunca se dormirá.

### 2. Aumentar Timeout Frontend (Temporal)

```diff
// frontend/src/lib/api.ts
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
- timeout: 10000,
+ timeout: 60000,  // 60s para tolerar cold starts
  withCredentials: true,
});
```

Commit, push, deploy.

---

## 📞 ¿Qué Opción Elegimos?

Responde estas preguntas para decidir:

1. **¿Hay presupuesto?**
   - No → Opción 6 (Hybrid gratis)
   - Sí ($7/mes) → Opción 3 (Render Paid)
   - Sí ($10+/mes) → Opción 4 (Railway)

2. **¿Cuánto tiempo tienes?**
   - <1 hora → Opción 1 (Keep-alive solo)
   - 4-8 horas → Opción 6 (Hybrid)
   - 1-2 días → Opción 4 (Railway)

3. **¿Importa la UX en cold start?**
   - Sí → Opción 2 o 6 (UI de loading)
   - No → Opción 1 (keep-alive y ya)

4. **¿Es para TFM o producción?**
   - TFM → Opción 1 o 6 (gratis)
   - Producción → Opción 3 o 4 (paid)

---

## ✅ Checklist de Implementación

Una vez elijas, seguir este checklist:

- [ ] Configurar UptimeRobot para keep-alive
- [ ] Aumentar timeout frontend a 60s
- [ ] Añadir UI de loading con mensaje "Despertando..."
- [ ] Ajustar rate limits (10 intentos en 5 min)
- [ ] Implementar skip de rate limit en cold start
- [ ] Añadir header X-Cold-Start en responses
- [ ] Probar apagando Render manualmente y esperando wake-up
- [ ] Monitorear logs de errores de timeout durante 1 semana
- [ ] Documentar en README la estrategia elegida

---

**¿Necesitas ayuda con la implementación de alguna opción específica?**
