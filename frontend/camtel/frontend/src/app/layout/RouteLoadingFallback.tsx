import { AppLoading } from './AppLoading';

// Splash pendant le chargement d'un chunk lazy — logo central, pas cercle générique.
export function RouteLoadingFallback() {
  return <AppLoading />;
}
