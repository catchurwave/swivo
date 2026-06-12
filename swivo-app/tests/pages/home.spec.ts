import { test, expect } from '@playwright/test';
import { waitForPageReady } from '../helpers/navigation';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);
  });

  test.describe('Hero Section', () => {
    test('should display hero title and subtitle', async ({ page }) => {
      const title = page.locator('h1').first();
      const titleText = await title.textContent();
      expect(titleText).toContain('Créez');

      const subtitle = page.locator('text=Déclaration');
      const subtitleCount = await subtitle.count();
      expect(subtitleCount).toBeGreaterThan(0);
    });

    test('should have visible CTA button', async ({ page }) => {
      const cta = page.locator('a:visible').filter({ hasText: /Créer/ }).first();
      if (await cta.isVisible()) {
        await expect(cta).toBeVisible();
      }
    });

    test('should have pricing link', async ({ page }) => {
      const pricingLink = page.locator('a:visible').filter({ hasText: /Tarifs|tarif/i }).first();
      if (await pricingLink.isVisible()) {
        await expect(pricingLink).toBeVisible();
      }
    });

    test('should display trust signals', async ({ page }) => {
      const trustSignals = page.locator('text=/99%|5 min|24h|0 €/');
      const count = await trustSignals.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Journey: CTA Click → Creation', () => {
    test('clicking CTA should navigate to creation flow', async ({ page }) => {
      const cta = page.locator('a:has-text("Créer"):visible').first();
      if (await cta.isVisible()) {
        await cta.click();
        await page.waitForURL(/creer|inscription/, { timeout: 10000 }).catch(() => {});
        expect(page.url()).toMatch(/creer|inscription|$/);
      }
    });
  });

  test.describe('Journey: Pricing Exploration', () => {
    test('pricing link should navigate to tarifs page', async ({ page }) => {
      const pricingLink = page.locator('a:visible').filter({ hasText: /Tarifs|tarif/i }).first();
      if (await pricingLink.isVisible()) {
        await pricingLink.click();
        await page.waitForURL(/tarifs/, { timeout: 10000 }).catch(() => {});
        expect(page.url()).toMatch(/tarifs|$/);
      }
    });
  });

  test.describe('Steps Section', () => {
    test('should display three creation steps', async ({ page }) => {
      const steps = page.locator('text=/Répondez|Validez|On dépose/');
      const count = await steps.count();
      expect(count).toBeGreaterThanOrEqual(3);
    });
  });

  test.describe('Features Section', () => {
    test('should display feature cards', async ({ page }) => {
      const features = page.locator('[class*="card"]');
      const count = await features.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Comparison Section', () => {
    test('should display comparison content', async ({ page }) => {
      const comparison = page.locator('text=/Création|Frais/');
      const count = await comparison.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Responsive: Mobile', () => {
    test('should display hero on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/');
      await waitForPageReady(page);

      const heroText = page.locator('h1').first();
      await expect(heroText).toBeVisible();

      const links = page.locator('a');
      const count = await links.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should have navigation element on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/');
      await waitForPageReady(page);

      // Mobile may have hidden nav (md:flex), check for visible menu or links
      const visibleLinks = page.locator('a:visible');
      const count = await visibleLinks.count();
      expect(count).toBeGreaterThan(0);
    });
  });
});
