import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md border border-border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-slate-900 text-slate-50 shadow hover:bg-slate-900/80 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-100/90',
        secondary:
          'border-transparent bg-slate-100 text-slate-900 hover:bg-slate-100/80 dark:bg-slate-800 dark:text-slate-50 dark:hover:bg-slate-800/90',
        destructive:
          'border-transparent bg-red-600 text-slate-50 shadow hover:bg-red-600/85 dark:bg-red-500 dark:text-slate-950',
        outline: 'text-foreground',
        success:
          'border-transparent bg-emerald-600 text-slate-50 shadow hover:bg-emerald-600/85 dark:bg-emerald-500 dark:text-slate-950',
        warning:
          'border-transparent bg-amber-500 text-slate-50 shadow hover:bg-amber-500/85 dark:bg-amber-400 dark:text-slate-950',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

/**
 * Renderiza un badge con variantes de estilo accesibles para tema claro/oscuro.
 * @param props - Props HTML y variante visual.
 * @returns Badge con estilos según variante.
 */
function Badge({ className, variant, ...props }: Readonly<BadgeProps>) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
