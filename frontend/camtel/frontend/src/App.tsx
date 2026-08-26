import { AppProviders } from './app/providers';
import { AppRouter } from './app/router';

export default function App() {
  return (
    <AppProviders>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-white"
      >
        Aller au contenu principal
      </a>
      <AppRouter />
    </AppProviders>
  );
}
