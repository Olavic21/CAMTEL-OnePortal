import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ServiceMeta } from '@/shared/config/services';

/**
 * Carte d'un service — section « Découvrez nos services » de la homepage.
 * Principe UX : la carte ENTIÈRE est cliquable (pointer ET clavier, le <Link>
 * étant naturellement focusable) et constitue un point d'entrée direct vers
 * le catalogue du service (/services/:slug, route réelle existante).
 */
export function ServiceCard({ service, index = 0 }: { service: ServiceMeta; index?: number }) {
  const { t } = useTranslation();
  const Icon = service.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35, delay: Math.min(index, 6) * 0.06, ease: 'easeOut' }}
      className="h-full"
    >
      <Link
        to={service.route}
        aria-label={`${service.label} — ${t('home.serviceCardAction')}`}
        className="group block h-full rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950"
      >
        {/* Carte premium : soulèvement léger + ombre subtile au survol */}
        <div className="flex h-full flex-col rounded-xl border border-neutral-200 bg-white p-6 shadow-card transition-all duration-250 ease-out group-hover:-translate-y-1 group-hover:border-primary-300 group-hover:shadow-card-hover dark:border-neutral-800 dark:bg-neutral-900 dark:group-hover:border-primary-700">
          <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary transition-colors duration-250 group-hover:bg-primary group-hover:text-white dark:bg-primary-900/40 dark:text-primary-300 dark:group-hover:bg-primary dark:group-hover:text-white">
            <Icon className="h-6 w-6" aria-hidden />
          </span>

          <h3 className="text-base font-bold uppercase tracking-wide text-neutral-900 dark:text-neutral-100">
            {service.label}
          </h3>
          <p className="mt-1 text-sm font-semibold text-primary dark:text-primary-300">{service.tagline}</p>
          <p className="mt-2 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
            {service.description}
          </p>

          {/* Indicateur d'accès — pousse vers le catalogue du service */}
          <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-primary dark:text-primary-300">
            {t('home.serviceCardAction')}
            <ArrowRight
              className="h-4 w-4 transition-transform duration-250 group-hover:translate-x-1"
              aria-hidden
            />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}