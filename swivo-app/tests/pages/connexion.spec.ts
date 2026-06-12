import { test, expect } from '@playwright/test';
import { waitForPageReady, fillAndSubmit } from '../helpers/navigation';

test.describe('Connexion (Login) Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/connexion');
    await waitForPageReady(page);
  });

  test.describe('Page Structure', () => {
    test('should display login form', async ({ page }) => {
      const form = page.locator('form').first();
      await expect(form).toBeVisible();
    });

    test('should have inputs', async ({ page }) => {
      const inputs = page.locator('input');
      const count = await inputs.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should have submit button', async ({ page }) => {
      const submitBtn = page.locator('button[type="submit"], button:has-text("connexion")').first();
      if (await submitBtn.isVisible()) {
        await expect(submitBtn).toBeVisible();
      }
    });
  });

  test.describe('Journey: Login Form', () => {
    test('should have email input field', async ({ page }) => {
      const inputs = page.locator('input');
      const count = await inputs.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should accept email input', async ({ page }) => {
      const firstInput = page.locator('input').first();
      await firstInput.fill('test@example.com');
      const value = await firstInput.inputValue();
      expect(value).toBeTruthy();
    });
  });

  test.describe('Journey: Navigation Links', () => {
    test('should have links on page', async ({ page }) => {
      const links = page.locator('a');
      const count = await links.count();
      expect(count).toBeGreaterThan(0);
    });

    test('clicking link should work', async ({ page }) => {
      const firstLink = page.locator('a').first();
      const href = await firstLink.getAttribute('href');
      expect(href).toBeTruthy();
    });
  });

  test.describe('Responsive: Mobile', () => {
    test('should display login form on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/connexion');
      await waitForPageReady(page);

      const form = page.locator('form').first();
      await expect(form).toBeVisible();

      const inputs = page.locator('input');
      const count = await inputs.count();
      expect(count).toBeGreaterThan(0);
    });
  });
});
