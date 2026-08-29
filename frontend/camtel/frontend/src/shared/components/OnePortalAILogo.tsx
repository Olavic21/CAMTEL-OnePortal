import { clsx } from 'clsx';

const ICON_SRC = '/camtel-assistant-icon.svg';
const FULL_SRC = '/camtel-assistant-logo-full.svg';

type CAMTELAssistantLogoVariant = 'icon' | 'header' | 'full';

interface CAMTELAssistantLogoProps {
  variant?: CAMTELAssistantLogoVariant;
  className?: string;
  /** Variante claire pour fond sombre (header du chatbot). */
  inverted?: boolean;
}

export function CAMTELAssistantLogo({
  variant = 'header',
  className,
  inverted = false,
}: CAMTELAssistantLogoProps) {
  if (variant === 'full') {
    return (
      <img
        src={FULL_SRC}
        alt="Assistant CAMTEL — Service client en ligne"
        className={clsx('h-auto w-full max-w-[200px]', className)}
        width={320}
        height={380}
      />
    );
  }

  if (variant === 'icon') {
    return (
      <img
        src={ICON_SRC}
        alt=""
        className={clsx('shrink-0', className)}
        width={48}
        height={48}
        aria-hidden
      />
    );
  }

  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <img src={ICON_SRC} alt="" className="h-8 w-8 shrink-0" width={32} height={32} aria-hidden />
      <span
        className={clsx(
          'font-serif text-base font-bold leading-none',
          inverted ? 'text-white' : 'text-primary-800 dark:text-primary-200',
        )}
      >
        Assistant CAMTEL
      </span>
    </div>
  );
}
