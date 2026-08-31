import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, CheckCircle2, Compass, RotateCcw } from 'lucide-react';
import { Breadcrumbs } from '@/shared/components/Breadcrumbs';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Input } from '@/shared/components/Input';
import { Skeleton } from '@/shared/components/Skeleton';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import { Alert } from '@/shared/components/Alert';
import { ServiceBadge } from '@/shared/components/ServiceBadge';
import { SegmentBadge } from '@/shared/components/SegmentBadge';
import { PriceDisplay } from '@/shared/components/PriceDisplay';
import { SERVICES } from '@/shared/config/services';
import { SEGMENTS } from '@/shared/config/segments';
import { useFindSolution } from '../hooks/useFindSolution';
import type { Service, Segment, ProductV2 } from '@/shared/types';

/**
 * « Trouver ma solution » (/find-solution) — cahier des charges section 14.
 * Parcours guide en 4 etapes : besoin (service) -> profil (segment) ->
 * contraintes -> recommandations. La recommandation finale est calculee par
 * l'API (POST /recommendations/, moteur de scoring serveur) ; en cas de
 * panne reseau uniquement, un tri local du catalogue prend le relais
 * (moteur affiche honnetement).
 */

interface Criteria {
  service: Service | null;
  segment: Segment | null;
  budget: string;
  min_speed: string;
  min_storage: string;
  users: string;
  location: string;
}

const STEPS = ['need', 'profile', 'constraints', 'results'] as const;

function toPayload(c: Criteria) {
  const num = (v: string) => (v.trim() === '' ? null : Number(v));
  return {
    service: c.service ?? undefined,
    segment: c.segment ?? undefined,
    budget: num(c.budget),
    min_speed: num(c.min_speed),
    min_storage: num(c.min_storage),
    users: num(c.users),
    location: c.location.trim() || undefined,
  };
}

export default function FindSolutionPage() {
  const { t } = useTranslation();
  const [step, setStep] = useState<(typeof STEPS)[number]>('need');
  const [criteria, setCriteria] = useState<Criteria>({
    service: null,
    segment: null,
    budget: '',
    min_speed: '',
    min_storage: '',
    users: '',
    location: '',
  });

  const { recommend, reset, isLoading, result, error } = useFindSolution();

  function update<K extends keyof Criteria>(key: K, value: Criteria[K]) {
    setCriteria((c) => ({ ...c, [key]: value }));
  }

  function goToResults() {
    setStep('results');
    reset();
    recommend(toPayload(criteria));
  }

  function restart() {
    setCriteria({ service: null, segment: null, budget: '', min_speed: '', min_storage: '', users: '', location: '' });
    reset();
    setStep('need');
  }

  const stepIndex = STEPS.indexOf(step);

  return (
    <div className="container-app max-w-4xl py-10">
      <Breadcrumbs items={[{ label: t('nav.home'), to: '/' }, { label: t('findSolution.title') }]} />

      <div className="mt-4 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary dark:bg-primary-900/30 dark:text-primary-300">
          <Compass className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{t('findSolution.title')}</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('findSolution.subtitle')}</p>
        </div>
      </div>

      {/* Fil d'etapes */}
      <ol className="mt-8 flex items-center gap-2" aria-label={t('findSolution.progress')}>
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-1 items-center gap-2" aria-current={s === step ? 'step' : undefined}>
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                i <= stepIndex ? 'bg-primary text-white' : 'bg-neutral-200 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
              }`}
            >
              {i + 1}
            </span>
            <span className={`hidden text-xs font-medium sm:block ${i <= stepIndex ? 'text-primary dark:text-primary-300' : 'text-neutral-400'}`}>
              {t(`findSolution.steps.${s}`)}
            </span>
            {i < STEPS.length - 1 && <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700" aria-hidden />}
          </li>
        ))}
      </ol>

      <Card className="mt-6 p-6">
        {step === 'need' && (
          <fieldset>
            <legend className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{t('findSolution.q1')}</legend>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {SERVICES.map((s) => (
                <button
                  key={s.service}
                  type="button"
                  onClick={() => {
                    update('service', s.service);
                    setStep('profile');
                  }}
                  className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
                    criteria.service === s.service
                      ? 'border-primary bg-primary-50 dark:border-primary-300 dark:bg-primary-900/20'
                      : 'border-neutral-200 hover:border-primary-300 dark:border-neutral-700 dark:hover:border-primary-300/50'
                  }`}
                >
                  <s.icon className="h-5 w-5 text-primary dark:text-primary-300" aria-hidden />
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">{s.label}</span>
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {step === 'profile' && (
          <fieldset>
            <legend className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{t('findSolution.q2')}</legend>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {SEGMENTS.map((s) => (
                <button
                  key={s.segment}
                  type="button"
                  onClick={() => {
                    update('segment', s.segment);
                    setStep('constraints');
                  }}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    criteria.segment === s.segment
                      ? 'border-primary bg-primary-50 dark:border-primary-300 dark:bg-primary-900/20'
                      : 'border-neutral-200 hover:border-primary-300 dark:border-neutral-700 dark:hover:border-primary-300/50'
                  }`}
                >
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">{s.label}</span>
                  <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{s.description}</p>
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {step === 'constraints' && (
          <fieldset>
            <legend className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{t('findSolution.q3')}</legend>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-neutral-700 dark:text-neutral-300">{t('findSolution.constraints.budget')}</span>
                <Input type="number" min={0} value={criteria.budget} onChange={(e) => update('budget', e.target.value)} placeholder="50000" />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-neutral-700 dark:text-neutral-300">{t('findSolution.constraints.speed')}</span>
                <Input type="number" min={0} value={criteria.min_speed} onChange={(e) => update('min_speed', e.target.value)} placeholder="10" />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-neutral-700 dark:text-neutral-300">{t('findSolution.constraints.storage')}</span>
                <Input type="number" min={0} value={criteria.min_storage} onChange={(e) => update('min_storage', e.target.value)} placeholder="100" />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-neutral-700 dark:text-neutral-300">{t('findSolution.constraints.users')}</span>
                <Input type="number" min={1} value={criteria.users} onChange={(e) => update('users', e.target.value)} placeholder="5" />
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 block font-medium text-neutral-700 dark:text-neutral-300">{t('findSolution.constraints.location')}</span>
                <Input value={criteria.location} onChange={(e) => update('location', e.target.value)} placeholder={t('findSolution.constraints.locationPlaceholder')} />
              </label>
            </div>
          </fieldset>
        )}

        {step === 'results' && (
          <ResultsPanel
            isLoading={isLoading}
            error={error}
            products={result?.products ?? []}
            engine={result?.engine}
            onRestart={restart}
          />
        )}
      </Card>

      {/* Navigation entre etapes */}
      {step !== 'need' && step !== 'results' && (
        <div className="mt-6 flex items-center justify-between">
          <Button variant="tertiary" onClick={() => setStep(STEPS[stepIndex - 1])}>
            <ArrowLeft className="h-4 w-4" /> {t('findSolution.back')}
          </Button>
          {step === 'constraints' && (
            <Button onClick={goToResults} disabled={!criteria.service}>
              {t('findSolution.seeRecommendations')} <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function ResultsPanel({
  isLoading,
  error,
  products,
  engine,
  onRestart,
}: {
  isLoading: boolean;
  error: unknown;
  products: ProductV2[];
  engine?: 'API' | 'LOCAL';
  onRestart: () => void;
}) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="space-y-3" role="status" aria-live="polite">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('findSolution.loading')}</p>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title={t('findSolution.errorTitle')}
        onRetry={onRestart}
      />
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        icon={Compass}
        title={t('findSolution.noResults')}
        description={t('findSolution.noResultsHint')}
        action={
          <Button variant="tertiary" onClick={onRestart}>
            <RotateCcw className="h-4 w-4" /> {t('findSolution.restart')}
          </Button>
        }
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{t('findSolution.q4')}</p>
        <Button variant="tertiary" onClick={onRestart}>
          <RotateCcw className="h-4 w-4" /> {t('findSolution.restart')}
        </Button>
      </div>

      {engine === 'LOCAL' && (
        <Alert tone="info" className="mb-4">
          {t('findSolution.localEngineNotice')}
        </Alert>
      )}

      <ul className="space-y-3">
        {products.map((p) => (
          <li key={String(p.id)}>
            <Link to={`/produits/${p.slug}`} className="block rounded-xl border border-neutral-200 p-4 transition-colors hover:border-primary-300 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:border-primary-300/50 dark:hover:bg-neutral-900">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">{p.name}</span>
                    <ServiceBadge service={p.service} />
                    <SegmentBadge segment={p.segment} />
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-neutral-500 dark:text-neutral-400">{p.shortDescription || p.description}</p>

                  {/* Justification : pourquoi cette offre est recommandee */}
                  <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-600 dark:text-neutral-300">
                    <li className="flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden />
                      {t('findSolution.match.service')}
                    </li>
                    {p.availability === 'AVAILABLE' && (
                      <li className="flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden />
                        {t('availability.AVAILABLE')}
                      </li>
                    )}
                  </ul>
                </div>
                <div className="shrink-0 sm:text-right">
                  <PriceDisplay pricing={p.pricing} />
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}