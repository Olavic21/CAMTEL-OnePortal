import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { ThemeToggle } from '@/shared/components/ThemeToggle';
import { Logo } from '@/shared/components/Logo';

// Inscription publique : tout le monde peut creer un compte, qui recoit au
// minimum le role "visitor" — jamais un role plus eleve, choisi ici.
// Les promotions (editeur, gestionnaire, admin) se font ensuite depuis le
// back-office par un role habilite (voir permissions.ts / AdminUserListPage).
function buildSchema(t: TFunction) {
  return z
    .object({
      username: z.string().min(3, t('validation.minLength', { count: 3 })),
      email: z.string().email(t('validation.invalidEmail')),
      password: z.string().min(8, t('validation.minLength', { count: 8 })),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('validation.passwordMismatch'),
      path: ['confirmPassword'],
    });
}
type FormValues = z.infer<ReturnType<typeof buildSchema>>;

export default function RegisterPage() {
  const { t } = useTranslation();
  const { register: registerAccount } = useAuth();
  const navigate = useNavigate();
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
      await registerAccount(values.username, values.email, values.password);
      navigate('/', { replace: true });
    } catch {
      setServerError(t('auth.registerError'));
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-100 px-4 py-8 dark:bg-neutral-950">
      <Logo variant="brand" className="mb-8" />
      <div className="relative w-full max-w-sm rounded-xl bg-white p-8 shadow-sm dark:bg-neutral-900">
        <div className="absolute right-3 top-3">
          <ThemeToggle />
        </div>
        <div className="mb-6 flex flex-col items-center gap-2">
          <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{t('auth.registerTitle')}</h1>
          <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">{t('auth.registerSubtitle')}</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <Input
            label={t('auth.username')}
            autoComplete="username"
            error={errors.username?.message}
            {...register('username')}
          />
          <Input
            label={t('auth.email')}
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label={t('auth.password')}
            type="password"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register('password')}
          />
          <Input
            label={t('auth.confirmPassword')}
            type="password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
          {serverError && <p className="text-sm text-red-600 dark:text-red-400">{serverError}</p>}
          <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
            {t('auth.submitRegister')}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-neutral-500 dark:text-neutral-400">
          {t('auth.haveAccount')}{' '}
          <Link to="/admin/login" className="font-medium text-primary hover:underline dark:text-primary-300">
            {t('auth.signIn')}
          </Link>
        </p>
      </div>
    </div>
  );
}
