import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { LoginForm } from '@/components/forms/login-form';
import logoTeamHub from '@/assets/logo-teamhub.png';

export default function LoginPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <Image
            src={logoTeamHub}
            alt="TeamHub Logo"
            width={200}
            height={200}
            style={{ width: 'auto', height: 'auto' }}
            priority
          />
        </div>
        <CardDescription>
          Ingresa tus credenciales para acceder
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  );
}
