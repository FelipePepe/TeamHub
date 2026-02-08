'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { getNavigationForRole, isNavItemActive } from '@/lib/navigation';
import { useAuth } from '@/hooks/use-auth';
import logoTeamHub from '@/assets/logo-teamhub-alt.png';

/**
 * Renderiza la barra lateral principal con navegación según el rol.
 * @returns Sidebar con enlaces de navegación y estado activo.
 */
export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const navItems = getNavigationForRole(user?.rol);

  return (
    <aside className="hidden md:flex h-screen w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-slate-200 px-6 dark:border-slate-800">
        <Link href="/dashboard" className="flex items-center">
          <Image
            src={logoTeamHub}
            alt="TeamHub Logo"
            width={180}
            height={45}
            style={{ width: 'auto', height: 'auto' }}
            priority
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4" aria-label="Navegación principal">
        <ul className="space-y-1" role="list">
          {navItems.map((item) => {
            const isActive = isNavItemActive(item.href, pathname);
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-slate-50'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-900 dark:hover:text-slate-50'
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
    </aside>
  );
}
