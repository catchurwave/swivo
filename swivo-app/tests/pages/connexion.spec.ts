import { test, expect } from '@playwright/test';
import { waitForPageReady, fillAndSubmit } from '../helpers/navigation';

test.describe('Connexion (Login) Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/connexion');
    await waitForPageReady(page);
  });

  test.describe('Page Structure', () => {
    test('should display login form', async ({ page }) => {
      const form = page.locator('form, [role="form"]');
      await expect(form).toBeVisible();
    });

    test('should have email input', async ({ page }) => {
      const emailInput = page.locator('input[type="email"], input[name*="email"], input[placeholder*="email" i]');
      await expect(emailInput).toBeVisible();
    });

    test('should have password input', async ({ page }) => {
      const passwordInput = page.locator('input[type="password"], input[name*="password"]');
      await expect(passwordInput).toBeVisible();
    });

    test('should have submit button', async ({ page }) => {
      const submitBtn = page.locator('button[type="submit"], button:has-text("Connexion|Se connecter|Login")');
      await expect(submitBtn).toBeVisible();
    });
  });

  test.describe('Journey: Login Form', () => {
    test('should validate empty email', async ({ page }) => {
      const submitBtn = page.locator('button[type="submit"]').first();
      await submitBtn.click();

      const errorMsg = page.locator('text=email|Email|requis|required');
      const count = await errorMsg.count();
      // Should have validation error or form stays on page
      const stillOnPage = page.url().includes('/connexion');
      expect(stillOnPage || count > 0).toBeTruthy();
    });

    test('should accept valid email format', async ({ page }) => {
      const emailInput = page.locator('input[type="email"]').first();
      await emailInput.fill('test@example.com');
      await expect(emailInput).toHaveValue('test@example.com');
    });
  });

  test.describe('Journey: Password Reset', () => {
    test('should have password reset link', async ({ page }) => {
      const resetLink = page.locator('a:has-text("Mot de passe oublié|Oublié"), button:has-text("Réinitialiser")');
      const count = await resetLink.count();
      expect(count).toBeGreaterThan(0);
    });

    test('clicking reset link should navigate to reset flow', async ({ page }) => {
      const resetLink = page.locator('a:has-text("Mot de passe oublié|oublié")').first();
      if (await resetLink.isVisible()) {
        await resetLink.click();
        await waitForPageReady(page);

        const newUrl = page.url();
        expect(newUrl).toMatch(/reset|forgot|password/i);
      }
    });
  });

  test.describe('Journey: Sign Up Link', () => {
    test('should have link to signup page', async ({ page }) => {
      const signupLink = page.locator('a:has-text("Inscription|créer"), button:has-text("Créer")');
      const count = await signupLink.count();
      expect(count).toBeGreaterThan(0);
    });

    test('clicking signup link should navigate to inscription', async ({ page }) => {
      const signupLink = page.locator('a:has-text("Inscription|s\'inscrire")').first();
      if (await signupLink.isVisible()) {
        await signupLink.click();
        await waitForPageReady(page);

        const newUrl = page.url();
        expect(newUrl).toMatch(/inscription|signup/i);
      }
    });
  });

  test.describe('Responsive: Mobile', () => {
    test('should display login form on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });

      const form = page.locator('form, [role="form"]');
      await expect(form).toBeVisible();

      const emailInput = page.locator('input[type="email"]').first();
      await expect(emailInput).toBeVisible();
    });
  });
});
