import pino from 'pino';
import { config } from '../config/env';

export const logger = pino({
  level: config.LOG_LEVEL,
});

export const logRequestError = (err: Error, context: Record<string, unknown>) => {
  logger.error({ err, ...context }, 'Request failed');
};
