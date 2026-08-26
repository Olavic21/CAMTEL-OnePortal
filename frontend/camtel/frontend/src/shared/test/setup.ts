// Configuration globale des tests (chargee avant chaque fichier de test,
// voir vite.config.ts -> test.setupFiles). Ajoute les matchers jest-dom
// (toBeInTheDocument, toHaveTextContent, etc.) a Vitest.
import '@testing-library/jest-dom/vitest';

// Initialise i18next AVANT tout rendu de composant. Sans cet import
// explicite, l'initialisation ne se produisait que par effet de bord
// accidentel (un composant important '@/shared/lib/i18n' quelque part dans
// le graphe de modules du fichier de test executee juste avant) : l'ordre
// d'execution des fichiers de test par Vitest n'etant pas garanti, un
// composant utilisant `t('...')` pouvait afficher la cle brute ("products.badgeNew")
// au lieu du texte traduit selon le fichier lance en premier. Trouve en
// pratique lors de l'ajout de nouveaux `useTranslation()` (PHASE i18n) : le
// changement d'ordre d'import a suffi a faire echouer un test qui "passait"
// jusque-la par coincidence.
import '@/shared/lib/i18n';

// Polyfills jsdom manquants : framer-motion s'appuie sur les viewport observers
// (whileInView des ProductCards/Hero), absents de l'environnement jsdom. Sans
// ces mocks, les tests de composants utilisant `motion` plantent avec
// "IntersectionObserver is not defined".
class IntersectionObserverMock {
  readonly root: Element | Document | null = null;
  readonly rootMargin = '';
  readonly thresholds: ReadonlyArray<number> = [];
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

class ResizeObserverMock {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

globalThis.IntersectionObserver =
  globalThis.IntersectionObserver ??
  (IntersectionObserverMock as unknown as typeof IntersectionObserver);
globalThis.ResizeObserver =
  globalThis.ResizeObserver ??
  (ResizeObserverMock as unknown as typeof ResizeObserver);
