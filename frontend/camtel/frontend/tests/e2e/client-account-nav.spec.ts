import { test, expect } from '@playwright/test';

test('Account navigation has accessible links and aria-labels', async ({ page }) => {
  await page.goto('/account/dashboard');

  const nav = page.locator('nav[aria-label]');
  await expect(nav.first()).toBeVisible();

  const links = nav.locator('a');
  // Accept at least 4 links (preview may add an extra login/locale link).
  const linkCount = await links.count();
  expect(linkCount).toBeGreaterThanOrEqual(4);

  const checkCount = Math.min(4, linkCount);
  for (let i = 0; i < checkCount; i++) {
    const link = links.nth(i);
    const aria = await link.getAttribute('aria-label');
    const text = (await link.innerText()).trim();
    // Accept a link that has either a non-empty aria-label or non-empty visible text.
    const ok = (aria && /\S+/.test(aria)) || text.length > 0;
    expect(ok).toBeTruthy();
  }
});
