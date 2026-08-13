// Configuration globale des tests (chargee avant chaque fichier de test,
// voir vite.config.ts -> test.setupFiles). Ajoute les matchers jest-dom
// (toBeInTheDocument, toHaveTextContent, etc.) a Vitest.
import '@testing-library/jest-dom/vitest';

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
