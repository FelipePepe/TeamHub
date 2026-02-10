/**
 * Constantes de tiempo centralizadas para evitar magic numbers.
 * Usadas en cálculos de duración, timeouts, y conversiones.
 *
 * @module shared/constants/time
 */

/**
 * Constantes de conversión de tiempo en milisegundos.
 * Facilita cálculos legibles y mantenibles.
 *
 * @example
 * ```typescript
 * const lockDuration = 30 * TIME_CONSTANTS.MS_PER_MINUTE; // 30 minutos
 * const daysOverdue = Math.floor(diff / TIME_CONSTANTS.MS_PER_DAY);
 * ```
 */
export const TIME_CONSTANTS = Object.freeze({
  MS_PER_SECOND: 1000,
  MS_PER_MINUTE: 60 * 1000,
  MS_PER_HOUR: 60 * 60 * 1000,
  MS_PER_DAY: 24 * 60 * 60 * 1000,

  /**
   * Tolerancia de reloj para validación HMAC (1 minuto).
   * Permite pequeñas diferencias de tiempo entre cliente y servidor.
   */
  HMAC_CLOCK_SKEW_MS: 60 * 1000,

  /**
   * Tiempo de expiración de firma HMAC (5 minutos).
   */
  HMAC_SIGNATURE_MAX_AGE_MS: 5 * 60 * 1000,

  /**
   * Timeout de conexiones inactivas del pool de PostgreSQL (30 segundos).
   */
  PG_IDLE_TIMEOUT_MS: 30 * 1000,

  /**
   * Intervalo de limpieza del rate limiter (10 minutos).
   */
  RATE_LIMIT_CLEANUP_INTERVAL_MS: 10 * 60 * 1000,
});
