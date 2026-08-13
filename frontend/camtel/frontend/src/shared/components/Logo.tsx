import { Link } from 'react-router-dom';
import { clsx } from 'clsx';

type LogoVariant = 'icon' | 'header' | 'full' | 'full-dark' | 'brand';

interface LogoProps {
  variant?: LogoVariant;
  to?: string;
  className?: string;
}

const ICON_SRC = '/logo-icon.svg';
const FULL_SRC = '/logo-full.svg';
const FULL_DARK_SRC = '/logo-full-dark.svg';

/** Logo complet en HTML/CSS — fiable sur fond clair ou sombre (pages auth). */
function BrandLogo({ className }: { className?: string }) {
  return (
    <div className={clsx('flex flex-col items-center text-center', className)}>
      <img src={ICON_SRC} alt="" className="h-16 w-16" width={64} height={64} aria-hidden />
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
  if (variant === 'brand') {
    return <BrandLogo className={className} />;
  }

  if (variant === 'full' || variant === 'full-dark') {
    return (
      <div className={clsx('flex justify-center', className)}>
        <img
          src={variant === 'full-dark' ? FULL_DARK_SRC : FULL_SRC}
          alt="CAMTEL-OnePortal — Plateforme Produits & Services"
          className="h-auto w-full max-w-[200px]"
          width={320}
          height={400}
        />
      </div>
    );
  }

  if (variant === 'icon') {
    return (
      <Link to={to} className={clsx('inline-flex shrink-0', className)} aria-label="CAMTEL-OnePortal — Accueil">
        <img src={ICON_SRC} alt="" className="h-9 w-9" width={36} height={36} />
      </Link>
    );
  }

  return (
    <Link
      to={to}
      className={clsx('flex items-center gap-2.5 transition-opacity hover:opacity-90', className)}
      aria-label="CAMTEL-OnePortal — Accueil"
    >
      <img src={ICON_SRC} alt="" className="h-9 w-9 shrink-0" width={36} height={36} />
      <span className="font-bold text-primary dark:text-primary-300">CAMTEL-OnePortal</span>
    </Link>
  );
}
