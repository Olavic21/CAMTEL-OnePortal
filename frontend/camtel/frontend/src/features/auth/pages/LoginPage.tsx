import { useForm } from 'react-hook-form';
import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { KeyRound } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { ThemeToggle } from '@/shared/components/ThemeToggle';
import { Logo } from '@/shared/components/Logo';
import { mockAuthStore } from '@/shared/lib/mockAuthStore';

function buildSchema(t: TFunction) {
  return z.object({
    username: z.string().min(1, t('validation.usernameRequired')),
    password: z.string().min(1, t('validation.passwordRequired')),
  });
}
type FormValues = z.infer<ReturnType<typeof buildSchema>>;

export default function LoginPage() {
  const { t } = useTranslation();
  const { login, isDemoMode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);
  const schema = useMemo(() => buildSchema(t), [t]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      const me = await login(values.username, values.password);
      // Un simple visiteur n'a pas acces au back-office : on le renvoie
      // vers le site public plutot que vers /admin (qui le bloquerait).
      const defaultDestination = me.role === 'visitor' ? '/' : '/admin';
      const from = (location.state as { from?: Location })?.from?.pathname ?? defaultDestination;
      navigate(from, { replace: true });
    } catch {
      setServerError(t('auth.invalidCredentials'));
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-100 px-4 py-8 dark:bg-neutral-950">
      <Logo variant="brand" className="mb-8" />
      <div className="w-full max-w-sm">
        {isDemoMode && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-900 dark:bg-amber-950/40">
            <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="text-amber-900 dark:text-amber-200">
              <p className="font-semibold">{t('auth.demoFirstLogin')}</p>
              <p className="mt-1">
                {t('auth.demoUsernameLabel')} : <code className="font-mono">{mockAuthStore.bootstrapCredentials.username}</code>
                <br />
                {t('auth.demoPasswordLabel')} : <code className="font-mono">{mockAuthStore.bootstrapCredentials.password}</code>
              </p>
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">{t('auth.demoHint')}</p>
            </div>
          </div>
        )}

        <div className="relative rounded-xl bg-white p-8 shadow-sm dark:bg-neutral-900">
          <div className="absolute right-3 top-3">
            <ThemeToggle />
          </div>
          <div className="mb-6 flex flex-col items-center gap-2">
            <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{t('auth.loginTitle')}</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('auth.loginSubtitle')}</p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
            <Input
              label={t('auth.username')}
              autoComplete="username"
              error={errors.username?.message}
              {...register('username')}
            />
            <Input
              label={t('auth.password')}
              type="password"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register('password')}
            />
            {serverError && <p className="text-sm text-red-600 dark:text-red-400">{serverError}</p>}
            <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
              {t('auth.submitLogin')}
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-neutral-500 dark:text-neutral-400">
            {t('auth.noAccount')}{' '}
            <Link to="/inscription" className="font-medium text-primary hover:underline dark:text-primary-300">
              {t('auth.signUp')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
