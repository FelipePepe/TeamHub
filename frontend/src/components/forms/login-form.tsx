'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, ShieldCheck, KeyRound } from 'lucide-react';
import { isAxiosError } from 'axios';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';

type LoginStep = 'login' | 'change-password' | 'mfa-setup' | 'mfa-verify';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const changePasswordSchema = z.object({
  newPassword: z
    .string()
    .min(12, 'Mínimo 12 caracteres')
    .regex(/[a-z]/, 'Debe incluir minúsculas')
    .regex(/[A-Z]/, 'Debe incluir mayúsculas')
    .regex(/[0-9]/, 'Debe incluir números')
    .regex(/[^A-Za-z0-9]/, 'Debe incluir carácter especial'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

const mfaSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Código MFA inválido'),
});

type MfaFormData = z.infer<typeof mfaSchema>;

/**
 * Devuelve un mensaje de error amigable para fallos de login.
 * @param error - Error lanzado por la llamada de login.
 * @returns Mensaje traducido para el usuario.
 */
const getLoginErrorMessage = (error: unknown): string => {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 401) {
      return 'Usuario y/o contraseña incorrectos';
    }
    if (status === 429) {
      return 'Demasiados intentos. Espera unos minutos y vuelve a intentarlo.';
    }
  }

  return 'Error al iniciar sesión';
};

export function LoginForm() {
  const router = useRouter();
  const { login, verifyMfa, changePassword, setupMfa } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<LoginStep>('login');
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [mfaSecret, setMfaSecret] = useState<string | null>(null);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const changePasswordForm = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const mfaForm = useForm<MfaFormData>({
    resolver: zodResolver(mfaSchema),
    defaultValues: { code: '' },
  });

  const resetAll = () => {
    setStep('login');
    setMfaToken(null);
    setPendingEmail(null);
    setQrCodeDataUrl(null);
    setMfaSecret(null);
    loginForm.reset();
    changePasswordForm.reset();
    mfaForm.reset();
  };

  const onLoginSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await login(data.email, data.password);

      if (!response.mfaToken) {
        throw new Error('Token de autenticación faltante');
      }

      setPendingEmail(data.email);
      setMfaToken(response.mfaToken);

      if (response.passwordChangeRequired) {
        setStep('change-password');
        changePasswordForm.reset();
        return;
      }

      if (response.mfaSetupRequired) {
        await initMfaSetup(response.mfaToken);
        return;
      }

      if (response.mfaRequired) {
        setStep('mfa-verify');
        mfaForm.reset();
        return;
      }

      if (response.user) {
        toast.success('Sesión iniciada correctamente');
        router.push('/dashboard');
      }
    } catch (error) {
      toast.error(getLoginErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const initMfaSetup = async (token: string) => {
    try {
      const mfaData = await setupMfa(token);
      let qrUrl: string | null = null;
      try {
        // ⚠️ NOTA DE SEGURIDAD: Import dinámico de qrcode
        // En Next.js App Router con Edge Runtime, no se puede usar Subresource Integrity (SRI)
        // para imports dinámicos. El módulo se carga desde node_modules local, no CDN.
        // Mantener package-lock.json actualizado y ejecutar npm audit regularmente.
        const QRCode = await import('qrcode');
        qrUrl = await QRCode.toDataURL(mfaData.otpauthUrl, { width: 192, margin: 1 });
      } catch (error) {
        console.warn('[mfa] qr generation failed, manual code available', error);
      }
      setQrCodeDataUrl(qrUrl);
      setMfaSecret(mfaData.secret);
      setStep('mfa-setup');
      mfaForm.reset();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al configurar MFA';
      toast.error(message);
    }
  };

  const onChangePasswordSubmit = async (data: ChangePasswordFormData) => {
    if (!mfaToken) return;
    setIsLoading(true);
    try {
      const response = await changePassword(mfaToken, data.newPassword);
      setMfaToken(response.mfaToken);
      toast.success('Contraseña actualizada');

      if (response.mfaSetupRequired) {
        await initMfaSetup(response.mfaToken);
        return;
      }

      if (response.mfaRequired) {
        setStep('mfa-verify');
        mfaForm.reset();
        return;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al cambiar contraseña';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const onMfaSubmit = async (data: MfaFormData) => {
    if (!mfaToken) return;
    setIsLoading(true);
    try {
      await verifyMfa(mfaToken, data.code);
      
      // Limpiar mfaSecret del state inmediatamente después de verificación exitosa
      // para prevenir extracción via XSS o React DevTools
      if (mfaSecret) {
        setMfaSecret(null);
      }
      
      toast.success('Sesión iniciada correctamente');
      router.push('/dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Código inválido';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Step: Change Password
  if (step === 'change-password') {
    const {
      register,
      handleSubmit,
      formState: { errors },
    } = changePasswordForm;

    return (
      <form onSubmit={handleSubmit(onChangePasswordSubmit)} className="space-y-4">
        <div className="flex items-center gap-2 text-amber-600 mb-4">
          <KeyRound className="h-5 w-5" />
          <span className="font-medium">Cambio de contraseña requerido</span>
        </div>

        <p className="text-sm text-slate-600 mb-4">
          Tu contraseña es temporal. Debes establecer una nueva contraseña para continuar.
        </p>

        <div className="space-y-2">
          <Label htmlFor="new-password">Nueva contraseña</Label>
          <div className="relative">
            <Input
              id="new-password"
              type={showNewPassword ? 'text' : 'password'}
              placeholder="********"
              autoComplete="new-password"
              disabled={isLoading}
              {...register('newPassword')}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              tabIndex={-1}
            >
              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.newPassword && (
            <p className="text-sm text-red-500">{errors.newPassword.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirmar contraseña</Label>
          <Input
            id="confirm-password"
            type="password"
            placeholder="********"
            autoComplete="new-password"
            disabled={isLoading}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
          )}
        </div>

        <div className="text-xs text-slate-500 space-y-1">
          <p>La contraseña debe tener:</p>
          <ul className="list-disc list-inside">
            <li>Mínimo 12 caracteres</li>
            <li>Mayúsculas y minúsculas</li>
            <li>Al menos un número</li>
            <li>Al menos un caracter especial</li>
          </ul>
        </div>

        <div className="flex flex-col gap-2">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cambiar contraseña
          </Button>
          <Button type="button" variant="ghost" className="w-full" disabled={isLoading} onClick={resetAll}>
            Cancelar
          </Button>
        </div>
      </form>
    );
  }

  // Step: MFA Setup
  if (step === 'mfa-setup') {
    const {
      register,
      handleSubmit,
      formState: { errors },
    } = mfaForm;

    return (
      <form onSubmit={handleSubmit(onMfaSubmit)} className="space-y-4">
        <div className="flex items-center gap-2 text-blue-600 mb-4">
          <ShieldCheck className="h-5 w-5" />
          <span className="font-medium">Configurar autenticación MFA</span>
        </div>

        {qrCodeDataUrl ? (
          <>
            <p className="text-sm text-slate-600 mb-4">
              Escanea el código QR con Google Authenticator u otra app compatible.
            </p>
            <div className="flex justify-center mb-4">
              <Image
                src={qrCodeDataUrl}
                alt="QR Code MFA"
                width={192}
                height={192}
                className="w-48 h-48"
                unoptimized
              />
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-600 mb-4">
            Ingresa el código en Google Authenticator u otra app compatible.
          </p>
        )}

        {mfaSecret && (
          <div className="rounded border border-transparent bg-slate-100 p-3 text-center mb-4 dark:border-slate-800 dark:bg-slate-900/70">
            <p className="text-xs text-slate-500 mb-1 dark:text-slate-400">
              {qrCodeDataUrl ? 'O ingresa este código manualmente:' : 'Código para agregar manualmente:'}
            </p>
            <code className="text-sm font-mono select-all text-slate-800 dark:text-slate-100">
              {mfaSecret}
            </code>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="mfa-code">Código de verificación</Label>
          <Input
            id="mfa-code"
            type="text"
            inputMode="numeric"
            placeholder="000000"
            autoComplete="one-time-code"
            disabled={isLoading}
            {...register('code')}
          />
          {errors.code && (
            <p className="text-sm text-red-500">{errors.code.message}</p>
          )}
        </div>

        <p className="text-xs text-slate-500">
          Ingresa el código de 6 dígitos generado por la app para verificar la configuración.
        </p>

        <div className="flex flex-col gap-2">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verificar y continuar
          </Button>
          <Button type="button" variant="ghost" className="w-full" disabled={isLoading} onClick={resetAll}>
            Cancelar
          </Button>
        </div>
      </form>
    );
  }

  // Step: MFA Verify
  if (step === 'mfa-verify') {
    const {
      register,
      handleSubmit,
      formState: { errors },
    } = mfaForm;

    return (
      <form onSubmit={handleSubmit(onMfaSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="mfa-code">Código MFA</Label>
          <Input
            id="mfa-code"
            type="text"
            inputMode="numeric"
            placeholder="000000"
            autoComplete="one-time-code"
            disabled={isLoading}
            {...register('code')}
          />
          {errors.code && (
            <p className="text-sm text-red-500">{errors.code.message}</p>
          )}
        </div>

        <p className="text-xs text-slate-500">
          Ingresa el código de autenticación generado para {pendingEmail ?? 'tu cuenta'}.
        </p>

        <div className="flex flex-col gap-2">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verificar código
          </Button>
          <Button type="button" variant="ghost" className="w-full" disabled={isLoading} onClick={resetAll}>
            Volver
          </Button>
        </div>
      </form>
    );
  }

  // Step: Login (default)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = loginForm;

  return (
    <form onSubmit={handleSubmit(onLoginSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="tu@email.com"
          autoComplete="email"
          disabled={isLoading}
          {...register('email')}
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="********"
            autoComplete="current-password"
            disabled={isLoading}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Iniciar sesión
      </Button>
    </form>
  );
}
