/**
 * Configuración centralizada de TanStack Query.
 * Define estrategias de caché y tiempos de stale según la volatilidad de los datos.
 *
 * @see https://tanstack.com/query/latest/docs/framework/react/guides/caching
 */

/**
 * Tiempos de stale para diferentes tipos de datos.
 *
 * - SHORT (30s): Datos volátiles que cambian frecuentemente (ej: pendientes de aprobación, notificaciones)
 * - MEDIUM (2min): Datos que se actualizan con frecuencia media (ej: timetracking, tareas, mi onboarding)
 * - LONG (5min): Datos relativamente estables (ej: proyectos, usuarios, departamentos, plantillas)
 *
 * Estos valores equilibran freshness vs. carga del servidor según Vercel React Best Practices.
 */
export const STALE_TIME = Object.freeze({
  SHORT: 30 * 1000, // 30 segundos
  MEDIUM: 2 * 60 * 1000, // 2 minutos
  LONG: 5 * 60 * 1000, // 5 minutos
});

/**
 * Configuración por defecto para QueryClient.
 * Usado en providers/query-provider.tsx
 */
export const DEFAULT_QUERY_CONFIG = {
  staleTime: STALE_TIME.LONG,
  retry: 1,
  refetchOnWindowFocus: false,
} as const;
