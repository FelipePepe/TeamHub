'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { getNavigationForRole, isNavItemActive } from '@/lib/navigation';
import { useAuth } from '@/hooks/use-auth';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import logoTeamHub from '@/assets/logo-teamhub-alt.png';

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Renderiza la navegación lateral en mobile usando un Sheet.
 * @param props - Estado de apertura y callback para cambios.
 * @returns Sidebar móvil con enlaces de navegación por rol.
 */
export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const navItems = getNavigationForRole(user?.rol);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0">
        <SheetHeader className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <SheetTitle>
            <Link
              href="/dashboard"
              className="flex items-center"
              onClick={() => onOpenChange(false)}
            >
              <Image
                src={logoTeamHub}
                alt="TeamHub Logo"
                width={180}
                height={45}
                style={{ width: 'auto', height: 'auto' }}
                priority
              />
            </Link>
          </SheetTitle>
        </SheetHeader>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-1" role="list">
            {navItems.map((item) => {
              const isActive = isNavItemActive(item.href, pathname);
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => onOpenChange(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-200 p-4 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">TeamHub v1.0.0</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
