import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';

type LogoVariant = 'icon' | 'header' | 'full' | 'full-dark' | 'brand';

interface LogoProps {
  variant?: LogoVariant;
  to?: string;
  className?: string;
}

/**
 * SOURCE UNIQUE DU LOGO (regle #26/#27 du cahier des charges).
 * Le nouveau logo officiel vit en un seul endroit : /logo-new.png
 * (fichier remplacable sans toucher au code — voir aussi scripts/make_favicon.py).
 * Le query `?v=` force le navigateur a recharger le logo a chaque mise a jour
 * (jamais d'ancien logo en cache apres un refresh — regle #27).
 */
const BRAND_LOGO_SRC = '/logo-new.png?v=20260830a1';

/** Pastille blanche : le PNG officiel a un fond blanc ; sur fond sombre on le
 * pose sur une carte blanche arrondie pour rester propre et lisible. */
const PIC_CLS = 'inline-flex items-center justify-center rounded-xl bg-white p-1 shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-700';

/** Logo complet en HTML/CSS — fiable sur fond clair ou sombre (pages auth). */
function BrandLogo({ className }: { className?: string }) {
  return (
    <div className={clsx('flex flex-col items-center text-center', className)}>
      <span className="inline-flex items-center justify-center rounded-2xl bg-white p-2 shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-700">
        <img src={BRAND_LOGO_SRC} alt="" className="h-20 w-20 object-contain" width={80} height={80} aria-hidden />
      </span>
      <p className="mt-3 font-serif text-2xl font-bold leading-tight text-primary-800 dark:text-primary-100">
        CAMTEL-OnePortal
      </p>
      <p className="mt-1 text-[10px] font-medium tracking-[0.22em] text-neutral-500 dark:text-neutral-400">
        PLATEFORME PRODUITS &amp; SERVICES
      </p>
      <div className="my-2 h-px w-16 bg-neutral-200 dark:bg-neutral-700" aria-hidden />
      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        by <span className="font-semibold text-primary dark:text-primary-300">CAMTEL</span>
      </p>
    </div>
  );
}

export function Logo({ variant = 'header', to = '/', className }: LogoProps) {
  const { t } = useTranslation();

  if (variant === 'brand') {
    return <BrandLogo className={className} />;
  }

  if (variant === 'full' || variant === 'full-dark') {
    // Les deux variantes utilisent la meme source ; la pastille blanche garantit
    // une lisibilite parfaite sur fond clair comme sur fond sombre.

    return (
      <div className={clsx('flex justify-center', className)}>
        <span className={PIC_CLS}>
          <img
            src={BRAND_LOGO_SRC}
            alt="CAMTEL-OnePortal — Plateforme Produits &amp; Services"
            className="h-auto w-full max-w-[180px] object-contain"
            width={180}
            height={180}
          />
        </span>
      </div>
    );
  }

  if (variant === 'icon') {
    return (
      <Link to={to} className={clsx('inline-flex shrink-0', className)} aria-label={`CAMTEL-OnePortal — ${t('common.a11y.homeLink')}`}>
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white p-0.5 shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-700">
          <img src={BRAND_LOGO_SRC} alt="" className="h-full w-full object-contain" width={36} height={36} />
        </span>
      </Link>
    );
  }

  return (
    <Link
      to={to}
      className={clsx('flex items-center gap-2.5 transition-opacity hover:opacity-90', className)}
      aria-label={`CAMTEL-OnePortal — ${t('common.a11y.homeLink')}`}
    >
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white p-1 shadow-sm ring-1 ring-neutral-200 dark:ring-neutral-700">
        <img src={BRAND_LOGO_SRC} alt="" className="h-full w-full object-contain" width={40} height={40} />
      </span>
      <span className="font-bold text-primary dark:text-primary-300">CAMTEL-OnePortal</span>
    </Link>
  );
}
