# Troubleshooting

Guia de solucion de problemas comunes en TeamHub.

## MFA / Autenticacion de dos factores

### Error: Codigo TOTP invalido (401 Unauthorized)

**Sintomas:**
- El codigo de Google Authenticator no es aceptado.
- Error 401 en `/api/auth/mfa/verify`.

**Causas posibles:**

1. **Reloj del servidor desincronizado**
   - TOTP requiere que servidor y cliente tengan la misma hora (±30 segundos).
   - Solucion en Linux:
     ```bash
     sudo timedatectl set-ntp true
     sudo systemctl restart systemd-timesyncd
     timedatectl status
     ```

2. **Secret incorrecto en la app**
   - Cada vez que se inicia el flujo de MFA setup, se genera un nuevo secret.
   - Si recargaste la pagina o reiniciaste el flujo, elimina la cuenta anterior de Google Authenticator y escanea el nuevo QR.

3. **Multiples cuentas en la app**
   - Verifica que estas usando el codigo de la cuenta correcta de TeamHub.

### Error: QR code no se muestra (CORB)

**Sintomas:**
- El QR code aparece como imagen rota.
- Error CORB (Cross-Origin Read Blocking) en la consola.

**Causa:**
- La generacion del QR intentaba usar un servicio externo que no soporta CORS.

**Solucion:**
- El QR se genera localmente con la libreria `qrcode`.
- Verificar que `qrcode` este instalado: `npm ls qrcode` en el directorio frontend.
- Si no esta instalado: `cd frontend && npm install`.

## Base de datos

### Error de conexion a PostgreSQL

**Verificar:**
1. PostgreSQL esta corriendo: `systemctl status postgresql`
2. La URL de conexion es correcta en `.env`
3. El usuario tiene permisos sobre la base de datos

## Frontend

### Cambios no se reflejan

**Solucion:**
```bash
cd frontend
rm -rf .next
npm run dev
```

Y en el navegador: Ctrl+Shift+R (hard refresh).

## Backend

### El servidor no inicia

**Verificar:**
1. Todas las variables de entorno estan configuradas (ver `docs/architecture/env-vars.md`)
2. La base de datos esta accesible
3. No hay errores de TypeScript: `npx tsc --noEmit`

### Error: "HMAC key data must not be empty"

**Síntoma:** El backend o frontend fallan al iniciar con el error "HMAC key data must not be empty".

**Causa:** Falta configurar `API_HMAC_SECRET` en los archivos `.env` locales.

**Solución:**

1. **Genera un secreto HMAC:**
   ```bash
   openssl rand -hex 32
   ```

2. **Configura backend** (`backend/.env`):
   ```bash
   API_HMAC_SECRET=<secreto-generado-64-caracteres>
   ```

3. **Configura frontend** (`frontend/.env`):
   ```bash
   NEXT_PUBLIC_API_HMAC_SECRET=<mismo-secreto-64-caracteres>
   ```

4. **Verifica que coincidan:** El secreto debe ser **idéntico** en backend y frontend.

5. **Reinicia los servidores:**
   ```bash
   # Backend
   cd backend && npm run dev
   
   # Frontend  
   cd frontend && npm run dev
   ```

**Nota:** Los archivos `.env.example` ya tienen la documentación, pero los valores reales NO se versionan (están en `.gitignore`).
