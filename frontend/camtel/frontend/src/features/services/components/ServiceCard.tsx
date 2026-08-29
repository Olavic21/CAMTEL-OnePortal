import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Card } from '@/shared/components/Card';
import type { ServiceMeta } from '@/shared/config/services';

/** Carte d'un service (page d'accueil / bloc 4 univers). */
export function ServiceCard({ service, index = 0 }: { service: ServiceMeta; index?: number }) {
  const Icon = service.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35, delay: Math.min(index, 6) * 0.05 }}
    >
      <Link to={service.route} className="group block h-full">
        <Card className="flex h-full flex-col justify-between p-6 transition-colors group-hover:border-primary-300">
          <div>
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary dark:bg-primary-900/40 dark:text-primary-300">
              <Icon className="h-6 w-6" aria-hidden />
            </span>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{service.label}</h3>
            <p className="mt-0.5 text-sm font-medium text-primary dark:text-primary-300">{service.tagline}</p>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">{service.description}</p>
          </div>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:underline dark:text-primary-300">
            Explorer <ArrowRight className="h-4 w-4" />
          </span>
        </Card>
      </Link>
    </motion.div>
  );
}