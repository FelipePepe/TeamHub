'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, ShieldCheck, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';

type LoginStep = 'login' | 'change-password' | 'mfa-setup' | 'mfa-verify';

const loginSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(1, 'La contrasena es requerida'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const changePasswordSchema = z.object({
  newPassword: z
    .string()
    .min(12, 'Minimo 12 caracteres')
    .regex(/[a-z]/, 'Debe incluir minusculas')
    .regex(/[A-Z]/, 'Debe incluir mayusculas')
    .regex(/[0-9]/, 'Debe incluir numeros')
    .regex(/[^A-Za-z0-9]/, 'Debe incluir caracter especial'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contrasenas no coinciden',
  path: ['confirmPassword'],
});

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

const mfaSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Codigo MFA invalido'),
});

type MfaFormData = z.infer<typeof mfaSchema>;

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
        throw new Error('Token de autenticacion faltante');
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
        toast.success('Sesion iniciada correctamente');
        router.push('/dashboard');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al iniciar sesion';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const initMfaSetup = async (token: string) => {
    try {
      const mfaData = await setupMfa(token);
      // Use Google Charts API to generate QR code
      const qrUrl = `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(mfaData.otpauthUrl)}`;
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
      toast.success('Contrasena actualizada');

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
      const message = error instanceof Error ? error.message : 'Error al cambiar contrasena';
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
      toast.success('Sesion iniciada correctamente');
      router.push('/dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Codigo invalido';
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
          <span className="font-medium">Cambio de contrasena requerido</span>
        </div>

        <p className="text-sm text-slate-600 mb-4">
          Tu contrasena es temporal. Debes establecer una nueva contrasena para continuar.
        </p>

        <div className="space-y-2">
          <Label htmlFor="new-password">Nueva contrasena</Label>
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
          <Label htmlFor="confirm-password">Confirmar contrasena</Label>
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
          <p>La contrasena debe tener:</p>
          <ul className="list-disc list-inside">
            <li>Minimo 12 caracteres</li>
            <li>Mayusculas y minusculas</li>
            <li>Al menos un numero</li>
            <li>Al menos un caracter especial</li>
          </ul>
        </div>

        <div className="flex flex-col gap-2">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cambiar contrasena
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
          <span className="font-medium">Configurar autenticacion MFA</span>
        </div>

        <p className="text-sm text-slate-600 mb-4">
          Escanea el codigo QR con Google Authenticator u otra app compatible.
        </p>

        {qrCodeDataUrl && (
          <div className="flex justify-center mb-4">
            <img src={qrCodeDataUrl} alt="QR Code MFA" className="w-48 h-48" />
          </div>
        )}

        {mfaSecret && (
          <div className="bg-slate-100 p-3 rounded text-center mb-4">
            <p className="text-xs text-slate-500 mb-1">O ingresa este codigo manualmente:</p>
            <code className="text-sm font-mono select-all">{mfaSecret}</code>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="mfa-code">Codigo de verificacion</Label>
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
          Ingresa el codigo de 6 digitos generado por la app para verificar la configuracion.
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
          <Label htmlFor="mfa-code">Codigo MFA</Label>
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
          Ingresa el codigo de autenticacion generado para {pendingEmail ?? 'tu cuenta'}.
        </p>

        <div className="flex flex-col gap-2">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verificar codigo
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
        <Label htmlFor="password">Contrasena</Label>
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
        Iniciar sesion
      </Button>
    </form>
  );
}
