'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Redirige a la lista de proyectos abriendo el modal de creación.
 * @returns Vista de carga mientras se realiza la redirección.
 */
export default function CrearProyectoRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/proyectos?crear=1');
  }, [router]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}
