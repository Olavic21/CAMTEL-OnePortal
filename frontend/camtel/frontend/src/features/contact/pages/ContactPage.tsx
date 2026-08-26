import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useSendContactMessage } from '../hooks/useContact';
import { Input, Textarea } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { CheckCircle2, Mail, MapPin, Phone } from 'lucide-react';

function buildSchema(t: TFunction) {
  return z.object({
    full_name: z.string().min(2, t('validation.nameRequired')),
    email: z.string().email(t('validation.invalidEmail')),
    phone: z.string().optional(),
    subject: z.string().min(3, t('validation.subjectRequired')),
    message: z.string().min(10, t('validation.messageMin')),
  });
}
type FormValues = z.infer<ReturnType<typeof buildSchema>>;

export default function ContactPage() {
  const { t } = useTranslation();
  const sendMessage = useSendContactMessage();
  const schema = useMemo(() => buildSchema(t), [t]);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    await sendMessage.mutateAsync(values);
    reset();
  }

  return (
    <div className="container-app py-10">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-3xl">
        {t('contact.title')}
      </h1>
      <p className="mt-1 max-w-xl text-neutral-500 dark:text-neutral-400">{t('contact.subtitle')}</p>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <div className="flex items-start gap-3">
            <Phone className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <p className="font-medium text-neutral-900 dark:text-neutral-100">{t('contact.phone')}</p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('contact.phoneHint')}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <p className="font-medium text-neutral-900 dark:text-neutral-100">{t('contact.email')}</p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">contact@camtel.cm</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-5 w-5 text-primary" />
            <div>
              <p className="font-medium text-neutral-900 dark:text-neutral-100">{t('contact.headOffice')}</p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('contact.headOfficeValue')}</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {sendMessage.isSuccess ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-accent-200 bg-accent-50 px-6 py-16 text-center dark:border-accent-900 dark:bg-accent-950/30">
              <CheckCircle2 className="h-10 w-10 text-accent-600" />
              <p className="font-medium text-accent-800 dark:text-accent-300">{t('contact.successTitle')}</p>
              <p className="text-sm text-accent-700 dark:text-accent-400">{t('contact.successBody')}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input label={t('contact.fullName')} error={errors.full_name?.message} {...register('full_name')} />
                <Input label={t('contact.email')} type="email" error={errors.email?.message} {...register('email')} />
              </div>
              <Input label={t('contact.phoneOptional')} {...register('phone')} />
              <Input label={t('contact.subject')} error={errors.subject?.message} {...register('subject')} />
              <Textarea label={t('contact.message')} rows={5} error={errors.message?.message} {...register('message')} />
              <Button type="submit" isLoading={isSubmitting} size="lg" className="mt-2 w-fit">
                {t('contact.send')}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
