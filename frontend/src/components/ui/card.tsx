import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Renderiza un contenedor de tarjeta con estilos temáticos (borde, fondo y texto).
 * @param className - Clases CSS adicionales para personalizar el contenedor.
 * @param props - Props estándar de un div, incluyendo children y manejadores.
 * @returns Contenedor de tarjeta con ref reenviado.
 */
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-xl border border-border bg-card text-card-foreground shadow',
      className
    )}
    {...props}
  />
));
Card.displayName = 'Card';

/**
 * Renderiza el header de una tarjeta con espaciado y layout vertical.
 * @param className - Clases CSS adicionales para el header.
 * @param props - Props estándar de un div para el header.
 * @returns Header de tarjeta con ref reenviado.
 */
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

/**
 * Renderiza el título de una tarjeta.
 * @param className - Clases CSS adicionales para el título.
 * @param props - Props estándar de un div para el título.
 * @returns Título de tarjeta con ref reenviado.
 */
const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('font-semibold leading-none tracking-tight', className)}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

/**
 * Renderiza la descripción secundaria de una tarjeta con tono atenuado.
 * @param className - Clases CSS adicionales para la descripción.
 * @param props - Props estándar de un div para la descripción.
 * @returns Descripción de tarjeta con ref reenviado.
 */
const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

/**
 * Renderiza el contenido principal de una tarjeta.
 * @param className - Clases CSS adicionales para el contenido.
 * @param props - Props estándar de un div para el contenido.
 * @returns Contenido de tarjeta con ref reenviado.
 */
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

/**
 * Renderiza el footer de una tarjeta con layout horizontal.
 * @param className - Clases CSS adicionales para el footer.
 * @param props - Props estándar de un div para el footer.
 * @returns Footer de tarjeta con ref reenviado.
 */
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
