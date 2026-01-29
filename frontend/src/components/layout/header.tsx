'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserNav } from './user-nav';
import { MobileSidebar } from './mobile-sidebar';

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="flex h-14 md:h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">
        <div className="flex items-center gap-3 md:gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Abrir menú de navegación"
          >
            <Menu className="h-5 w-5" />
          </Button>
          {title && (
            <h1 className="text-base md:text-lg font-semibold text-slate-900">{title}</h1>
          )}
        </div>
        <UserNav />
      </header>
      <MobileSidebar
        open={isMobileMenuOpen}
        onOpenChange={setIsMobileMenuOpen}
      />
    </>
  );
}
