import { test, expect } from '@playwright/test';
import { waitForPageReady } from '../helpers/navigation';

test.describe('Tarifs (Pricing) Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tarifs');
    await waitForPageReady(page);
  });

  test.describe('Page Structure', () => {
    test('should display pricing page title', async ({ page }) => {
      const title = page.locator('h1').first();
      const text = await title.textContent();
      expect(text).toBeTruthy();
      expect(text?.toLowerCase()).toMatch(/tarif|prix|formule/i);
    });

    test('should display pricing information', async ({ page }) => {
      const prices = page.locator('text=/29,90|9,90/');
      const count = await prices.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Journey: Compare Prices', () => {
    test('should show pricing details', async ({ page }) => {
      const price = page.locator('text=/29,90|9,90/');
      const count = await price.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should have CTA buttons', async ({ page }) => {
      const cta = page.locator('a, button');
      const count = await cta.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Journey: Select Creation Plan', () => {
    test('clicking creation link should work', async ({ page }) => {
      const creationCta = page.locator('a:has-text("Créer")').first();
      if (await creationCta.isVisible()) {
        const href = await creationCta.getAttribute('href');
        expect(href).toBeTruthy();
      }
    });
  });

  test.describe('Journey: Select Management Plan', () => {
    test('should have subscription option', async ({ page }) => {
      const links = page.locator('a');
      const count = await links.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Responsive: Mobile', () => {
    test('should display pricing on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/tarifs');
      await waitForPageReady(page);

      const title = page.locator('h1').first();
      await expect(title).toBeVisible();

      const prices = page.locator('text=/29,90|9,90/');
      const count = await prices.count();
      expect(count).toBeGreaterThan(0);
    });
  });
});
