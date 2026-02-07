# Demo Visual - TeamHub

## 🎯 Sistema de Demos Mejorado

Sistema completo de validación CRUD con:
- ✅ Capturas automáticas antes/después de operaciones
- ✅ Validación de Create → Read → Update → Delete
- ✅ Detección de errores (console, network, visual)
- ✅ Reportes JSON detallados con métricas
- ✅ Helpers reutilizables por entidad

## Ejecutar Demo con Video

### Requisitos previos

1. **Backend corriendo** en `http://localhost:3001`:
   ```bash
   cd backend && npm run dev
   ```

2. **Frontend corriendo** en `http://localhost:3000` (se inicia automáticamente):
   ```bash
   cd frontend && npm run dev
   ```

3. **Variables de entorno** configuradas en `frontend/.env.e2e`:
   ```env
   E2E_USER=admin@teamhub.com
   E2E_PASSWORD=<contraseña del admin>
   E2E_MFA_SECRET=<secreto TOTP del admin>
   NEXT_PUBLIC_API_URL=http://localhost:3001/api
   NEXT_PUBLIC_API_HMAC_SECRET=<mismo valor que API_HMAC_SECRET del backend>
   ```

4. **Base de datos con datos seed**:
   ```bash
   cd backend && npm run db:seed
   ```

### Comandos

```bash
# Desde el directorio frontend/

# Demo con ventana visible (ideal para presentaciones)
npm run demo

# Demo sin ventana (genera video automáticamente)
npm run demo:record

# Ejecutar solo un spec de demo
npx playwright test complete-demo --config=playwright.demo.config.ts --headed
npx playwright test demo-realista --config=playwright.demo.config.ts --headed
```

### Variantes de demo disponibles

| Archivo | Descripción | Flujo |
|---------|-------------|-------|
| `complete-demo.spec.ts` | Recorrido completo como ADMIN | Login API + navegar todas las secciones + crear dept/proyecto |
| `complete-demo-validated.spec.ts` | Validación con screenshots | Captura y verifica contenido de cada pantalla |
| `demo-realista.spec.ts` | Crea datos reales | Dept + Empleado + Plantilla + Onboarding + Proyecto + Timetracking |
| `full-demo.spec.ts` | Demo simplificada | Flujo básico con `test.step()` |
| **`crud-complete.spec.ts`** ⭐ | **CRUD completo con validación** | Create → Read → Update → Delete + screenshots + detección errores |

### 🆕 Nuevo: CRUD Completo con Validación

El archivo `crud-complete.spec.ts` incluye 3 tests:

1. **CRUD completo de Departamentos**: Crea, busca, edita y elimina un departamento con validación completa
2. **Validación de errores**: Prueba casos de error (ej: código duplicado) y verifica detección
3. **CRUD múltiple**: Crea y elimina 3 departamentos en secuencia

```bash
# Ejecutar solo tests CRUD
npx playwright test crud-complete --config=playwright.demo.config.ts --headed

# Ejecutar test específico
npx playwright test crud-complete -g "CRUD completo de Departamentos" --headed
```

#### Estructura de Helpers

```
e2e/demo/
├── crud.helpers.ts              # Helpers base: OperationLogger, screenshots, forms, toast
├── demo.helpers.ts              # Helpers originales: think, read, observe, moveTo
├── monitoring/
│   └── error-detection.ts       # ErrorMonitor: console, network, visual errors
├── entities/
│   └── departamentos.crud.ts    # CRUD específico: create, read, update, delete
└── crud-complete.spec.ts        # Tests completos con validación
```

### 📂 Organización de Screenshots

Los screenshots se organizan automáticamente por entidad:

```
demo-output/screenshots/
├── departamentos/
│   ├── 001-departamentos-listado-inicial-2026-02-06T23-55-00.png
│   ├── 002-departamentos-antes-crear-2026-02-06T23-55-01.png
│   ├── 003-departamentos-modal-crear-2026-02-06T23-55-02.png
│   ├── 004-departamentos-form-lleno-2026-02-06T23-55-03.png
│   ├── 005-departamentos-toast-2026-02-06T23-55-04.png
│   ├── 006-departamentos-despues-crear-2026-02-06T23-55-05.png
│   ├── 007-departamentos-antes-editar-2026-02-06T23-55-10.png
│   └── ...
├── empleados/
├── proyectos/
└── errors/
    └── error-report.json
```

### Variantes de demo disponibles (legacy)

| Archivo | Descripción | Flujo |
|---------|-------------|-------|
| `complete-demo.spec.ts` | Demo consolidada de 14 pasos | Login MFA + CRUD completo + flujo EMPLEADO + verificación |
| `complete-demo-validated.spec.ts` | Validación con screenshots | Captura y verifica contenido de cada pantalla |
| `demo-realista.spec.ts` | Referencia de datos reales | Dept + Empleado + Plantilla + Onboarding + Proyecto + Timetracking |

### Salida

Los videos se guardan en:
- `demo-output/` - Videos (.webm) y screenshots
- `demo-report/` - Reporte HTML interactivo (abrir `index.html`)

### Convertir a MP4

```bash
# Convertir webm a mp4
ffmpeg -i demo-output/video.webm -c:v libx264 -crf 20 demo.mp4

# Concatenar múltiples videos
ffmpeg -f concat -safe 0 -i videos.txt -c copy demo-completa.mp4
```

### Configuración de Calidad

En `playwright.demo.config.ts`:
- `slowMo: 100` - Ralentiza acciones (ms entre acciones)
- `viewport: { width: 1920, height: 1080 }` - Resolución Full HD
- `video: 'on'` - Siempre graba video

### Troubleshooting

| Problema | Causa | Solución |
|----------|-------|----------|
| Tests fallan inmediatamente | Backend no está corriendo | Iniciar backend: `cd backend && npm run dev` |
| Login falla con 401 | HMAC secret no coincide | Verificar que `NEXT_PUBLIC_API_HMAC_SECRET` en `.env.e2e` coincida con `API_HMAC_SECRET` en `backend/.env` |
| MFA falla | Secret TOTP incorrecto o expirado | Verificar `E2E_MFA_SECRET` en `.env.e2e` |
| Rate limit (429) | Demasiados intentos de login | Esperar 30 segundos o reiniciar backend |
| Datos duplicados | Ejecutar demo sin limpiar BD | Ejecutar `cd backend && npm run db:seed` |
