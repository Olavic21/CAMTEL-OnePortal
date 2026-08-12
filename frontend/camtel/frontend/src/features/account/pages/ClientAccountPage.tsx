import { useTranslation } from 'react-i18next';
import { User as UserIcon, ShieldCheck, Info } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Card } from '@/shared/components/Card';
import { EmptyState } from '@/shared/components/EmptyState';
import { Badge } from '@/shared/components/Badge';

// Fondations de l'espace client (roadmap V3, section 21 "Vision Enterprise").
// Accessible a tout compte authentifie (y compris "visitor", le role attribue
// par l'inscription publique) via /mon-compte. Prepare le terrain pour un
// futur suivi de souscriptions/reclamations sans remettre en cause le
// modele de comptes actuel (voir la remarque en section 21.2 : l'ajout de
// nouveaux roles/briques n'impose pas de reecrire l'existant).
export default function ClientAccountPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="container-app max-w-2xl py-10">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-3xl">
        {t('account.title')}
      </h1>

      <Card className="mt-6 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary dark:bg-primary-900/30 dark:text-primary-300">
            <UserIcon className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-neutral-900 dark:text-neutral-100">{user.username}</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">{user.email}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 border-t border-neutral-100 pt-4 dark:border-neutral-800">
          <ShieldCheck className="h-4 w-4 text-neutral-400" />
          <span className="text-sm text-neutral-500 dark:text-neutral-400">{t('account.role')} :</span>
          <Badge tone="neutral">{t(`roles.${user.role}`)}</Badge>
        </div>
      </Card>

      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          {t('account.subscriptionRequests')}
        </h2>
        {/* Fondation uniquement : la liste reelle des demandes de souscription
           necessite l'endpoint backend du module subscriptions (section 21). */}
        <EmptyState icon={Info} title={t('account.noRequests')} />
      </div>

      {user.role === 'visitor' && (
        <div className="mt-8 rounded-xl border border-primary-100 bg-primary-50 p-5 dark:border-primary-900 dark:bg-primary-950/30">
          <p className="font-medium text-primary-900 dark:text-primary-200">{t('account.wantMore')}</p>
          <p className="mt-1 text-sm text-primary-800 dark:text-primary-300">{t('account.wantMoreHint')}</p>
        </div>
      )}
    </div>
  );
}
