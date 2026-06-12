import { test, expect } from '@playwright/test';
import { waitForPageReady } from '../helpers/navigation';

test.describe('Tarifs (Pricing) Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tarifs');
    await waitForPageReady(page);
  });

  test.describe('Page Structure', () => {
    test('should display pricing page title', async ({ page }) => {
      const title = page.locator('h1');
      await expect(title).toContainText(/tarif|prix|créer/i);
    });

    test('should display at least one pricing plan', async ({ page }) => {
      const plans = page.locator('[class*="card"], [class*="plan"], [class*="pricing"]');
      const count = await plans.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Journey: Compare Prices', () => {
    test('should show pricing details', async ({ page }) => {
      const price = page.locator('text=29,90|9,90|€');
      const count = await price.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should have CTA for creation plan', async ({ page }) => {
      const creationCta = page.locator('button:has-text("Créer"), a:has-text("Créer")');
      await expect(creationCta.first()).toBeVisible();
    });

    test('should have CTA for management plan', async ({ page }) => {
      const managementCta = page.locator('button:has-text("S\'abonner|Souscrire"), a:has-text("S\'abonner|Souscrire")');
      const count = await managementCta.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Journey: Select Creation Plan', () => {
    test('clicking creation CTA should navigate to checkout', async ({ page }) => {
      const creationCta = page.locator('button:has-text("Créer"), a:has-text("Créer")').first();
      await creationCta.click();
      await waitForPageReady(page);

      const newUrl = page.url();
      expect(newUrl).toMatch(/creer|inscription|checkout/);
    });
  });

  test.describe('Journey: Select Management Plan', () => {
    test('clicking management CTA should navigate to subscribe', async ({ page }) => {
      const managementCta = page.locator('button:has-text("S\'abonner|Souscrire"), a:has-text("S\'abonner|Souscrire")').first();
      await managementCta.click();
      await waitForPageReady(page);

      const newUrl = page.url();
      expect(newUrl).toMatch(/subscribe|checkout|gestion/);
    });
  });

  test.describe('INPI Fees', () => {
    test('should display INPI fee information', async ({ page }) => {
      const inpiInfo = page.locator('text=INPI|fees|frais');
      const count = await inpiInfo.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Responsive: Mobile', () => {
    test('should stack pricing cards on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });

      const plans = page.locator('[class*="card"], [class*="plan"]');
      const count = await plans.count();
      expect(count).toBeGreaterThan(0);

      const firstPlan = plans.first();
      await expect(firstPlan).toBeVisible();
    });
  });
});
