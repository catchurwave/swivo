import { Page } from '@playwright/test';

export async function waitForPageReady(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
}

export async function clickAndWait(page: Page, selector: string) {
  await page.click(selector);
  await waitForPageReady(page);
}

export async function fillAndSubmit(page: Page, fields: Record<string, string>, submitSelector: string) {
  for (const [selector, value] of Object.entries(fields)) {
    await page.fill(selector, value);
  }
  await clickAndWait(page, submitSelector);
}
