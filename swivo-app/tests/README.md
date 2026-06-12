# E2E Tests — Swivo

Automated browser tests using Playwright for multiple user journeys per page.

## Structure

```
tests/
  ├── pages/
  │   ├── home.spec.ts          # Homepage: hero, CTAs, trust signals, steps, features
  │   ├── tarifs.spec.ts        # Pricing: plan selection, comparison
  │   ├── connexion.spec.ts     # Login: form validation, password reset, signup link
  │   └── creer.spec.ts         # Creation wizard: mode selection, form validation
  ├── fixtures/                 # Test data & mocks (future)
  ├── helpers/
  │   └── navigation.ts         # Shared test utilities
  └── README.md
```

## Running Tests

### All tests (headless) — auto-opens report on local
```bash
npm run test:e2e
```
On local dev: runs tests → auto-opens HTML report in browser  
On CI: skips report (no $CI env check needed, runs silently)

### Watch mode (re-run on code changes)
```bash
npm run test:e2e:watch
```

### UI mode (visual test runner)
```bash
npm run test:e2e:ui
```

### View test results
```bash
npm run test:e2e:report
```
Opens HTML report manually (already at `./playwright-report/index.html`)

### Specific test file
```bash
npx playwright test tests/pages/home.spec.ts
```

### Specific test group
```bash
npx playwright test --grep "Hero Section"
```

### Mobile only
```bash
npx playwright test --project=mobile
```

### Desktop only
```bash
npx playwright test --project=chromium
```

## Configuration

- **Base URL:** http://localhost:5173 (auto-started)
- **Browsers:** Chromium (desktop), Pixel 5 (mobile)
- **Timeouts:** 30s per test
- **Retries:** 0 (local), 2 (CI)
- **Screenshots:** On failure
- **Traces:** On first retry

See `playwright.config.ts` for details.

## Writing New Tests

### Template
```typescript
import { test, expect } from '@playwright/test';
import { waitForPageReady } from '../helpers/navigation';

test.describe('Page Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/path');
    await waitForPageReady(page);
  });

  test('should display title', async ({ page }) => {
    const title = page.locator('h1');
    await expect(title).toContainText('Expected');
  });

  test.describe('Journey: User Action', () => {
    test('clicking button should navigate', async ({ page }) => {
      await page.click('button:has-text("Click me")');
      await waitForPageReady(page);
      await expect(page).toHaveURL('/new-path');
    });
  });
});
```

### Helpers
- `waitForPageReady(page)` — Wait for network idle + DOM ready
- `clickAndWait(page, selector)` — Click + wait for navigation
- `fillAndSubmit(page, fields, submitSelector)` — Fill form + submit

### Best Practices
- Organize tests by user journey (describe blocks)
- Test across desktop + mobile
- Validate error states
- Use semantic selectors (`text=`, `role=`, `placeholder=`)
- Avoid hard waits; use `waitForLoadState()` instead

## CI/CD

Tests run automatically on:
- Push to `main`, `master`, `develop`
- Pull requests to `main`, `master`, `develop`

Reports available as artifacts in GitHub Actions.
