// Ecran affiche pendant le chargement d'un chunk de route (React.lazy).
// Reste minimal et neutre puisqu'il peut apparaitre aussi bien dans le
// contexte public que le back-office.
export function RouteLoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}
