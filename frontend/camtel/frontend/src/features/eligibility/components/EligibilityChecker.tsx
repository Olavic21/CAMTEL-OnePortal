import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle, MapPin } from 'lucide-react';
import { useCheckEligibility } from '../hooks/useEligibility';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';

// Section 28 mission : widget d'eligibilite embarque sur la fiche offre.
// Le backend expose une abstraction (EligibilityProvider / MockEligibilityProvider,
// jamais un faux systeme CAMTEL reel — voir apps/core/v2_services.py), donc
// le resultat est explicable mais indicatif, pas une confirmation officielle.
export function EligibilityChecker({ productId }: { productId: number }) {
  const { t } = useTranslation();
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const checkEligibility = useCheckEligibility();

  function handleCheck() {
    checkEligibility.mutate({ product_id: productId, address, phone });
  }

  const result = checkEligibility.data;

  return (
    <Card className="p-5">
      <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
        <MapPin className="h-4 w-4" /> {t('eligibility.title')}
      </h3>
      <p className="mb-4 text-xs text-neutral-500 dark:text-neutral-400">{t('eligibility.hint')}</p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder={t('eligibility.addressPlaceholder')}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="flex-1"
        />
        <Input
          placeholder={t('eligibility.phonePlaceholder')}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="sm:w-40"
        />
        <Button onClick={handleCheck} isLoading={checkEligibility.isPending} variant="secondary">
          {t('eligibility.check')}
        </Button>
      </div>

      {result && (
        <div className="mt-4">
          {/* P1-3: Show provider mock disclaimer */}
          {result.provider === 'mock' && (
            <div className="mb-3 rounded-md bg-amber-50 p-2 text-xs text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
              ⚠️ {t('eligibility.mockDisclaimer', 'Simulation — aucune transaction réelle n\'est effectuée.')}
            </div>
          )}
          
          <div
            className={`flex items-start gap-2 rounded-lg p-3 text-sm ${
              result.eligible
                ? 'bg-accent-50 text-accent-800 dark:bg-accent-900/20 dark:text-accent-300'
                : 'bg-orange-50 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300'
            }`}
          >
            {result.eligible ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <div>
              <p className="font-medium">
                {result.eligible ? t('eligibility.eligible') : t('eligibility.notEligible')}
              </p>
              <ul className="mt-1 list-inside list-disc text-xs opacity-90">
                {result.reasons.map((reason, i) => (
                  <li key={i}>{reason}</li>
                ))}
              </ul>
              {result.status && (
                <p className="mt-2 text-xs opacity-75">
                  {t('eligibility.status')}: {result.status}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
