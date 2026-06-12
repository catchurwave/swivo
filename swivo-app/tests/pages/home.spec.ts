import { test, expect } from '@playwright/test';
import { waitForPageReady } from '../helpers/navigation';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForPageReady(page);
  });

  test.describe('Hero Section', () => {
    test('should display hero title and subtitle', async ({ page }) => {
      const title = page.locator('h1');
      await expect(title).toContainText('Créez votre');

      const subtitle = page.locator('text=Déclaration accompagnée');
      await expect(subtitle).toBeVisible();
    });

    test('should have visible CTA button', async ({ page }) => {
      const cta = page.locator('a:has-text("Créer")').first();
      await expect(cta).toBeVisible();
      await expect(cta).toHaveAttribute('href', /creer|inscription/);
    });

    test('should have pricing link', async ({ page }) => {
      const pricingLink = page.locator('text=Voir les tarifs');
      await expect(pricingLink).toBeVisible();
      await expect(pricingLink).toHaveAttribute('href', '/tarifs');
    });

    test('should display trust signals', async ({ page }) => {
      const trustSignals = page.locator('text=99%|5 min|24h|0 €');
      const count = await trustSignals.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Journey: CTA Click → Creation', () => {
    test('clicking CTA should navigate to creation flow', async ({ page }) => {
      const cta = page.locator('a:has-text("Créer")').first();
      await cta.click();
      await waitForPageReady(page);

      const newUrl = page.url();
      expect(newUrl).toMatch(/creer|inscription/);
    });
  });

  test.describe('Journey: Pricing Exploration', () => {
    test('pricing link should navigate to tarifs page', async ({ page }) => {
      const pricingLink = page.locator('text=Voir les tarifs');
      await pricingLink.click();
      await waitForPageReady(page);

      await expect(page).toHaveURL('/tarifs');
    });
  });

  test.describe('Steps Section', () => {
    test('should display three creation steps', async ({ page }) => {
      const steps = page.locator('text=Répondez au chat|Validez & payez|On dépose à l\'INPI');
      const count = await steps.count();
      expect(count).toBeGreaterThanOrEqual(3);
    });
  });

  test.describe('Features Section', () => {
    test('should display feature cards', async ({ page }) => {
      const features = page.locator('text=Déclaration en 5 min|Zéro rejet INPI|Simulateur URSSAF');
      const count = await features.count();
      expect(count).toBeGreaterThanOrEqual(3);
    });
  });

  test.describe('Comparison Section', () => {
    test('should display comparison table', async ({ page }) => {
      const comparison = page.locator('text=Création micro-entreprise|Frais légaux');
      const count = await comparison.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Responsive: Mobile', () => {
    test('should stack hero on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });

      const heroText = page.locator('h1');
      await expect(heroText).toBeVisible();

      const buttons = page.locator('button, a[class*="btn"]').first();
      await expect(buttons).toBeVisible();
    });

    test('should display navigation menu on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });

      const nav = page.locator('nav');
      await expect(nav).toBeVisible();
    });
  });
});
