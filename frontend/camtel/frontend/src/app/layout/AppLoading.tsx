import { Logo } from '@/shared/components/Logo';

// Splash premium CAMTEL — remplace le cercle générique.
// Le logo reste l'élément central, avec halo lumineux subtil et barre discrète.
// Utilisé pour Suspense (lazy chunks) et RequireAuth (bootstrap auth) —
// le logo est donc visible dès le premier paint, même après F5.
export function AppLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary-50 via-white to-blue-50 dark:from-[#0a1020] dark:via-[#0f1a33] dark:to-[#0a1020] px-4">
      {/* Halo radial subtil */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl dark:bg-primary/10" />
        <div className="absolute left-1/2 top-[45%] h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-400/5 blur-3xl dark:bg-blue-500/10" />
      </div>

      <div className="relative flex flex-col items-center">
        {/* Logo avec glow */}
        <div className="relative">
          <div aria-hidden className="absolute inset-0 rounded-3xl bg-primary/20 blur-2xl dark:bg-primary/25" />
          <div className="relative animate-[pulse_2.5s_ease-in-out_infinite]">
            <Logo variant="brand" />
          </div>
        </div>

        {/* Barre de progression discrète */}
        <div className="mt-10 h-1 w-32 overflow-hidden rounded-full bg-neutral-200 dark:bg-white/10">
          <div className="h-full w-1/2 animate-[shimmer_1.2s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-primary to-blue-500 dark:from-primary-400 dark:to-blue-400" />
        </div>
        <p className="mt-3 text-xs tracking-[0.18em] text-neutral-400 dark:text-white/40">CAMTEL</p>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}
