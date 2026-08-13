import { clsx } from 'clsx';

const ICON_SRC = '/oneportal-ai-icon.svg';
const FULL_SRC = '/oneportal-ai-logo-full.svg';

type OnePortalAILogoVariant = 'icon' | 'header' | 'full';

interface OnePortalAILogoProps {
  variant?: OnePortalAILogoVariant;
  className?: string;
  /** Variante claire pour fond sombre (header du chatbot). */
  inverted?: boolean;
}

export function OnePortalAILogo({
  variant = 'header',
  className,
  inverted = false,
}: OnePortalAILogoProps) {
  if (variant === 'full') {
    return (
      <img
        src={FULL_SRC}
        alt="OnePortal AI — Assistant intelligent by CAMTEL"
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
      <div className="flex items-center gap-1.5">
        <span
          className={clsx(
            'font-serif text-base font-bold leading-none',
            inverted ? 'text-white' : 'text-primary-800 dark:text-primary-200',
          )}
        >
          OnePortal
        </span>
        <span className="rounded-full bg-gradient-to-br from-[#1E5FA8] to-[#3B82D9] px-2 py-0.5 text-[10px] font-bold leading-none text-white">
          AI
        </span>
      </div>
    </div>
  );
}
