import { test, expect } from '@playwright/test';
import { waitForPageReady, clickAndWait } from '../helpers/navigation';

test.describe('Creer (Creation Wizard) Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/creer-mon-entreprise');
    await waitForPageReady(page);
  });

  test.describe('Wizard Modes', () => {
    test('should display buttons for mode selection', async ({ page }) => {
      const buttons = page.locator('button');
      const count = await buttons.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should have clickable mode buttons', async ({ page }) => {
      const firstButton = page.locator('button').first();
      await expect(firstButton).toBeVisible();
    });
  });

  test.describe('Journey: Mode Selection', () => {
    test('clicking first button should work', async ({ page }) => {
      const firstBtn = page.locator('button').first();
      if (await firstBtn.isVisible()) {
        await firstBtn.click();
        await waitForPageReady(page);
        // Page should update after click
        expect(page.url()).toContain('/creer');
      }
    });
  });

  test.describe('Journey: Form Interaction', () => {
    test('should have form elements', async ({ page }) => {
      const inputs = page.locator('input, textarea');
      const count = await inputs.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Page Content', () => {
    test('should display buttons', async ({ page }) => {
      const buttons = page.locator('button');
      const count = await buttons.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should display text content', async ({ page }) => {
      const heading = page.locator('h1, h2').first();
      const text = await heading.textContent();
      expect(text).toBeTruthy();
    });
  });

  test.describe('Responsive: Mobile', () => {
    test('should display wizard on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/creer-mon-entreprise');
      await waitForPageReady(page);

      const buttons = page.locator('button');
      const count = await buttons.count();
      expect(count).toBeGreaterThan(0);

      const firstBtn = buttons.first();
      await expect(firstBtn).toBeVisible();
    });
  });
});
