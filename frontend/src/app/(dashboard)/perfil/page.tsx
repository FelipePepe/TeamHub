'use client';

import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function PerfilPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Mi perfil</h1>
        <p className="text-slate-500">Gestiona tu informacion personal</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile card */}
        <Card className="lg:col-span-1">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-slate-200 text-2xl font-semibold text-slate-600">
              {user?.nombre.charAt(0)}
              {user?.apellidos?.charAt(0)}
            </div>
            <CardTitle className="mt-4">
              {user?.nombre} {user?.apellidos}
            </CardTitle>
            <CardDescription>{user?.email}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Badge>{user?.rol}</Badge>
            <p className="mt-4 text-xs text-slate-500">
              Estado: {user?.activo ? 'Activo' : 'Inactivo'}
            </p>
          </CardContent>
        </Card>

        {/* Edit form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Informacion personal</CardTitle>
            <CardDescription>
              Actualiza tu informacion de perfil
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input id="nombre" defaultValue={user?.nombre} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellidos">Apellidos</Label>
                <Input id="apellidos" defaultValue={user?.apellidos || ''} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue={user?.email} disabled />
              <p className="text-xs text-slate-500">
                El email no se puede cambiar
              </p>
            </div>
            <Button>Guardar cambios</Button>

            <Separator className="my-6" />

            <div>
              <h3 className="text-lg font-medium">Cambiar contrasena</h3>
              <p className="text-sm text-slate-500 mb-4">
                Actualiza tu contrasena de acceso
              </p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Contrasena actual</Label>
                  <Input id="current-password" type="password" />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nueva contrasena</Label>
                    <Input id="new-password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmar contrasena</Label>
                    <Input id="confirm-password" type="password" />
                  </div>
                </div>
                <Button variant="outline">Cambiar contrasena</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
