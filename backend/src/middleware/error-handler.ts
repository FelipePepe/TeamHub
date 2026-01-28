import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { ZodError } from 'zod';
import { logRequestError } from '../services/logger.js';

const formatZodDetails = (error: ZodError) =>
  error.errors.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));

const statusToCode = (status: number) => {
  switch (status) {
    case 400:
      return 'SOLICITUD_INVALIDA';
    case 401:
      return 'NO_AUTORIZADO';
    case 403:
      return 'ACCESO_DENEGADO';
    case 404:
      return 'NO_ENCONTRADO';
    case 409:
      return 'CONFLICTO';
    case 429:
      return 'LIMITE_EXCEDIDO';
    default:
      return 'ERROR_HTTP';
  }
};

export function errorHandler(err: Error, c: Context) {
  const status = err instanceof HTTPException ? err.status : err instanceof ZodError ? 400 : 500;
  const user = c.get('user') as { id?: string; email?: string } | undefined;
  logRequestError(err, {
    path: c.req.path,
    method: c.req.method,
    status,
    userId: user?.id,
    userEmail: user?.email,
  });

  if (err instanceof ZodError) {
    return c.json(
      {
        error: 'Datos de entrada invalidos',
        code: 'ERROR_VALIDACION',
        details: formatZodDetails(err),
      },
      400
    );
  }

  if (err instanceof HTTPException) {
    return c.json(
      { error: err.message, code: statusToCode(err.status) },
      err.status
    );
  }

  return c.json({ error: 'Error interno del servidor', code: 'ERROR_INTERNO' }, 500);
}
