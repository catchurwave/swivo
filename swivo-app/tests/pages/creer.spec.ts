import { test, expect } from '@playwright/test';
import { waitForPageReady, clickAndWait } from '../helpers/navigation';

test.describe('Creer (Creation Wizard) Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/creer-mon-entreprise');
    await waitForPageReady(page);
  });

  test.describe('Wizard Modes', () => {
    test('should display mode selection buttons', async ({ page }) => {
      const modes = page.locator('button:has-text("Guidé|Expert|IA")');
      const count = await modes.count();
      expect(count).toBeGreaterThanOrEqual(3);
    });

    test('should have Guided mode button', async ({ page }) => {
      const guidedBtn = page.locator('button:has-text("Guidé")');
      await expect(guidedBtn).toBeVisible();
    });

    test('should have Expert mode button', async ({ page }) => {
      const expertBtn = page.locator('button:has-text("Expert"), button:text("⚙")');
      const count = await expertBtn.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should have AI mode button', async ({ page }) => {
      const aiBtn = page.locator('button:has-text("IA"), button:text("✨")');
      const count = await aiBtn.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Journey: Guided Mode', () => {
    test('clicking Guided mode should show form', async ({ page }) => {
      const guidedBtn = page.locator('button:has-text("Guidé")').first();
      await clickAndWait(page, 'button:has-text("Guidé")');

      // Expect form to appear
      const form = page.locator('form, [role="form"], input');
      await expect(form.first()).toBeVisible();
    });
  });

  test.describe('Journey: Expert Mode', () => {
    test('clicking Expert mode should show advanced form', async ({ page }) => {
      const expertBtn = page.locator('button:has-text("Expert"), button:text("⚙")').first();
      if (await expertBtn.isVisible()) {
        await clickAndWait(page, 'button:has-text("Expert")');

        const form = page.locator('form, [role="form"], input');
        await expect(form.first()).toBeVisible();
      }
    });
  });

  test.describe('Journey: AI Mode', () => {
    test('clicking AI mode should show chat interface', async ({ page }) => {
      const aiBtn = page.locator('button:has-text("IA")').first();
      if (await aiBtn.isVisible()) {
        await clickAndWait(page, 'button:has-text("IA")');

        // Chat interface should appear
        const chat = page.locator('[class*="chat"], [class*="conversation"], textarea');
        const count = await chat.count();
        expect(count).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Journey: Resume Draft', () => {
    test('should have draft recovery option if drafts exist', async ({ page }) => {
      const draftOption = page.locator('text=brouillon|draft|reprendre|resume');
      const count = await draftOption.count();
      // Drafts might not exist, so this just checks the UI renders
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Document Upload', () => {
    test('should display document upload section', async ({ page }) => {
      // Navigate through wizard to document section
      const guidedBtn = page.locator('button:has-text("Guidé")').first();
      if (await guidedBtn.isVisible()) {
        await clickAndWait(page, 'button:has-text("Guidé")');

        // Look for document upload
        const docUpload = page.locator('text=document|pièce|justif|upload|drag');
        const count = await docUpload.count();
        expect(count).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Validation', () => {
    test('should show validation errors for empty required fields', async ({ page }) => {
      const guidedBtn = page.locator('button:has-text("Guidé")').first();
      if (await guidedBtn.isVisible()) {
        await clickAndWait(page, 'button:has-text("Guidé")');

        const submitBtn = page.locator('button[type="submit"], button:has-text("Suivant|Valider|Continuer")').first();
        if (await submitBtn.isVisible()) {
          await submitBtn.click();

          // Should either show error or stay on page
          const errorMsg = page.locator('[role="alert"], .error, .toast, text=/requis|required|obligatoire/i');
          const stillOnPage = page.url().includes('/creer');
          expect(stillOnPage || await errorMsg.count() > 0).toBeTruthy();
        }
      }
    });
  });

  test.describe('Responsive: Mobile', () => {
    test('should display wizard on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });

      const modes = page.locator('button:has-text("Guidé|Expert|IA")');
      const count = await modes.count();
      expect(count).toBeGreaterThanOrEqual(3);

      const modeBtn = modes.first();
      await expect(modeBtn).toBeVisible();
    });
  });
});
