import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Card } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Select } from '@/shared/components/Input';
import { useCheckEligibility } from '../hooks/useEligibility';
import type { Service } from '@/shared/types';

/**
 * Page d'eligibilite (cahier des charges section 24).
 * Permet de verifier l'eligibilite a un service via POST /api/v1/eligibility/.
 */
export default function EligibilityPage() {
  const { t } = useTranslation();
  const [service, setService] = useState<Service | ''>('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const checkEligibility = useCheckEligibility();

  function handleCheck() {
    if (!service) return;
    // Mapping service -> product_id (mock) en attente d'un endpoint service-based
    const serviceProductMap: Record<Service, number> = {
      FIXES: 1,
      MOBILES: 2,
      TRANSPORT: 3,
      DATA_CENTER: 4,
    };
    checkEligibility.mutate({ product_id: serviceProductMap[service], address, phone });
  }

  const result = checkEligibility.data;

  return (
    <div className="container-app max-w-2xl py-10">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-3xl">
        {t('eligibility.pageTitle')}
      </h1>
      <p className="mt-2 text-neutral-600 dark:text-neutral-400">
        {t('eligibility.pageSubtitle')}
      </p>

      <Card className="mt-6 p-6">
        <div className="space-y-4">
          <Select
            label={t('eligibility.service')}
            value={service}
            onChange={(e) => setService(e.target.value as Service)}
          >
            <option value="">{t('eligibility.selectService')}</option>
            <option value="FIXES">{t('services.fixes')}</option>
            <option value="MOBILES">{t('services.mobiles')}</option>
            <option value="TRANSPORT">{t('services.transport')}</option>
            <option value="DATA_CENTER">{t('services.dataCenter')}</option>
          </Select>

          <Input
            label={t('eligibility.address')}
            placeholder={t('eligibility.addressPlaceholder')}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <Input
            label={t('eligibility.phone')}
            placeholder={t('eligibility.phonePlaceholder')}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <Button
            onClick={handleCheck}
            isLoading={checkEligibility.isPending}
            disabled={!service}
          >
            {t('eligibility.check')}
          </Button>
        </div>

        {result && (
          <div
            className={`mt-6 flex items-start gap-3 rounded-lg p-4 ${
              result.eligible
                ? 'bg-accent-50 text-accent-800 dark:bg-accent-900/20 dark:text-accent-300'
                : 'bg-orange-50 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300'
            }`}
          >
            {result.eligible ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            ) : (
              <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
            )}
            <div>
              <p className="font-semibold">
                {result.eligible ? t('eligibility.eligible') : t('eligibility.notEligible')}
              </p>
              {result.reasons && result.reasons.length > 0 && (
                <ul className="mt-2 list-inside list-disc text-sm opacity-90">
                  {result.reasons.map((reason, i) => (
                    <li key={i}>{reason}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
