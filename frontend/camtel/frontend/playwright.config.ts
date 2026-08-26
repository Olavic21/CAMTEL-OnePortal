import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  use: {
    headless: true,
    baseURL: 'http://localhost:4173',
    viewport: { width: 1280, height: 720 },
  },
});
