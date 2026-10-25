import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

// Credentials are generated for the isolated H2 QA server, never committed or printed.
const password = JSON.parse(readFileSync(new URL('../../.qa-local/credentials.json', import.meta.url))).password;
async function login(page, email = 'learner1@studye.test') {
  await page.goto('/login');
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await page.locator('input[type=email]').fill(email);
  await page.locator('input[type=password]').fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).not.toHaveURL(/\/login$/);
}

test('add-card form and language controls keep readable dimensions before and after visiting Grammar', async ({ page }) => {
  await login(page);
  await page.goto('/my-decks');
  await page.getByRole('link', { name: 'View Deck', exact: true }).first().click();
  await page.getByRole('button', { name: '+ Add Card', exact: true }).click();
  const deckUrl = page.url();
  for (const width of [320, 375, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const form = page.locator('.add-card-form');
    await expect(form).toBeVisible();
    for (const input of await form.locator('input').all()) {
      const box = await input.boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.width).toBeGreaterThan(160);
      const label = form.locator(`label[for="${await input.getAttribute('id')}"]`);
      const labelBox = await label.boundingBox();
      expect(labelBox.y + labelBox.height).toBeLessThanOrEqual(box.y + 1);
    }
    const vi = await page.locator('.navbar .language-switcher button').first().boundingBox();
    expect(vi.width).toBeGreaterThanOrEqual(38);
    expect(vi.height).toBeGreaterThanOrEqual(36);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await form.screenshot({ path: `test-results/add-card-${width}.png`, animations: 'disabled' });
  }
  await page.goto('/grammar');
  await expect(page.getByRole('heading', { name: 'Grammar exercises', exact: true })).toBeVisible();
  await page.goto(deckUrl);
  await page.getByRole('button', { name: '+ Add Card', exact: true }).click();
  await expect(page.getByLabel('Term (Vocabulary) *')).toBeVisible();
  const input = await page.locator('#card-term').boundingBox();
  expect(input.height).toBeGreaterThanOrEqual(44);
});

test('Grammar print and report dialogs use the shared light surface on mobile', async ({ page }) => {
  await login(page);
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto('/grammar');
  await page.getByRole('button', { name: 'Start exercise', exact: true }).first().click();
  await page.getByRole('button', { name: 'Report issue', exact: true }).first().click();
  const report = page.locator('.report-modal-box');
  await expect(report).toBeVisible();
  await expect(report).toHaveCSS('background-color', 'rgb(255, 250, 244)');
  expect(await report.evaluate(el => el.parentElement.parentElement === document.body)).toBe(true);
  await report.screenshot({ path: 'test-results/grammar-report-mobile.png', animations: 'disabled' });
  await report.getByRole('button', { name: '✕', exact: true }).click();
  await page.locator('button[title]').filter({ hasText: 'Download' }).click();
  const print = page.locator('.print-modal-container');
  await expect(print).toBeVisible();
  await expect(print).toHaveCSS('background-color', 'rgb(255, 253, 249)');
  expect(await print.evaluate(el => el.parentElement.parentElement === document.body)).toBe(true);
  const printHeader = await print.locator('.print-modal-header').boundingBox();
  expect(printHeader.y).toBeGreaterThanOrEqual(0);
  expect(await print.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  await print.screenshot({ path: 'test-results/grammar-print-mobile.png', animations: 'disabled' });
});
test('learner login, create deck/card, study, refresh, language and multi-tab logout', async ({ page, context }) => {
  await login(page);
  await page.goto('/my-decks');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'My Decks' })).toBeVisible();
  await page.getByRole('button', { name: '+ Create Deck', exact: true }).click();
  await page.locator('#deckName').fill('QA retained learner title');
  await page.locator('#deckDesc').fill('Do not translate learner content.');
  await page.getByRole('dialog').getByRole('button', { name: 'VI', exact: true }).click();
  await expect(page.locator('#deckName')).toHaveValue('QA retained learner title');
  await page.getByRole('dialog').getByRole('button', { name: 'EN', exact: true }).click();
  await page.getByRole('button', { name: 'Create Deck', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'QA retained learner title', exact: true, level: 1 })).toBeVisible();
  await page.getByRole('button', { name: '+ Add Card', exact: true }).click();
  await page.locator('.add-card-form input').nth(0).fill('compass');
  await page.locator('.add-card-form input').nth(1).fill('la bàn');
  await page.getByRole('button', { name: 'Save Card', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'compass', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Study Now', exact: true }).click();
  await expect(page.getByText('compass', { exact: true }).first()).toBeVisible();
  await page.goto('/weak-vocabulary'); await page.reload();
  await expect(page.getByRole('heading', { name: 'Vocabulary to review' })).toBeVisible();
  await page.getByRole('button', { name: 'VI', exact: true }).click(); await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'vi');
  const second = await context.newPage(); await second.goto('/my-decks');
  await expect(second.getByRole('heading', { name: 'Bộ thẻ của tôi' })).toBeVisible();
  const oldToken = await page.evaluate(() => localStorage.getItem('token'));
  await page.locator('.nav-profile-menu summary').click();
  await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
  await second.reload(); await expect(second).toHaveURL(/\/login$/);
  await expect.poll(async () => (await page.request.get('http://127.0.0.1:8097/api/auth/me', { headers: { Authorization: `Bearer ${oldToken}` } })).status()).toBe(401);
});
test('responsive modal and anchored profile dropdown at every requested width', async ({ page }) => {
  await login(page);
  for (const width of [320, 375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 }); await page.goto('/my-decks');
    await expect(page.getByRole('heading', { name: 'My Decks' })).toBeVisible();
    if (width <= 1100) await page.getByRole('button', { name: 'Menu', exact: true }).click();
    await page.locator('.nav-profile-menu summary').click();
    const dropdown = page.locator('.nav-profile-dropdown'); await expect(dropdown).toBeVisible();
    const box = await dropdown.boundingBox(); expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
    await page.screenshot({ path: `test-results/dropdown-${width}.png`, fullPage: true, animations: 'disabled' });
    await page.keyboard.press('Escape'); await expect(dropdown).not.toBeVisible();
    await page.getByRole('button', { name: '+ Create Deck', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.locator('#deckName').fill('Unsaved content');
    const input = await page.locator('#deckDesc').evaluate(node => getComputedStyle(node).backgroundColor);
    expect(input).toBe('rgb(255, 254, 251)');
    await page.screenshot({ path: `test-results/modal-${width}.png`, fullPage: true, animations: 'disabled' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).not.toBeVisible();
  }
});
test('admin can lock/unlock a learner, audit history is populated', async ({ page, request }) => {
  await login(page, 'admin@studye.test'); await page.goto('/admin/users');
  await expect(page.getByRole('heading', { name: 'User management' })).toBeVisible();
  await page.getByPlaceholder('Enter name or email').fill('learner2@studye.test');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  const row = page.getByRole('row').filter({ hasText: 'learner2@studye.test' });
  await row.getByRole('button', { name: 'Lock', exact: true }).click();
  await page.getByRole('dialog').locator('textarea').fill('QA local demonstration lock');
  await page.getByRole('dialog').getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(row.getByText('Locked', { exact: true })).toBeVisible();
  const rejected = await request.post('http://127.0.0.1:8097/api/auth/login', { data: { email: 'learner2@studye.test', password } });
  expect(rejected.status()).toBe(403);
  await row.getByRole('button', { name: 'Unlock', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(row.getByText('Active', { exact: true })).toBeVisible();
  const accepted = await request.post('http://127.0.0.1:8097/api/auth/login', { data: { email: 'learner2@studye.test', password } });
  expect(accepted.status()).toBe(200);
  await page.goto('/admin/audit-logs'); await expect(page.getByText('QA local demonstration lock').first()).toBeVisible();
});

test('all major learner/admin routes render in both languages without mobile overflow', async ({ page }) => {
  test.setTimeout(180000);
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await login(page);
  for (const language of ['VI', 'EN']) {
    await page.getByRole('button', { name: language, exact: true }).click();
    for (const width of [375, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of ['/', '/my-decks', '/profile', '/weak-vocabulary', '/weak-vocabulary/practice', '/grammar', '/grammar/create']) {
        await page.goto(route);
        await expect(page.locator('h1,h2').filter({ hasNotText: /^StudyE$/ }).first()).toBeVisible();
        await page.waitForLoadState('networkidle');
        await expect(page.locator('html')).toHaveAttribute('lang', language.toLowerCase());
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${route} ${width} ${language}`).toBe(true);
        await page.screenshot({ path: `test-results/route-${route.replaceAll('/', '_') || 'home'}-${width}-${language}.png`, fullPage: true, animations: 'disabled' });
      }
    }
  }
  await page.evaluate(() => localStorage.removeItem('token'));
  await login(page, 'admin@studye.test');
  for (const language of ['VI', 'EN']) {
    await page.getByRole('button', { name: language, exact: true }).click();
    for (const route of ['/admin', '/admin/users', '/admin/audit-logs']) {
      await page.setViewportSize({ width: 375, height: 900 }); await page.goto(route);
      await expect(page.locator('main h1,main h2').first()).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${route} ${language}`).toBe(true);
      await page.screenshot({ path: `test-results/admin-${route.replaceAll('/', '_')}-${language}.png`, fullPage: true, animations: 'disabled' });
    }
  }
  expect(errors).toEqual([]);
});

test('weak practice completes and offline AI preview requires selected confirmation', async ({ page }) => {
  await login(page); await page.goto('/weak-vocabulary/practice');
  await page.getByRole('button', { name: /Word → Meaning/ }).click();
  await page.locator('.choice-row').first().click();
  await page.getByRole('button', { name: 'Start practice', exact: true }).click();
  await page.locator('.options button').first().click();
  await page.getByRole('button', { name: 'Check', exact: true }).click();
  await page.getByRole('button', { name: 'View results', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Completed!' })).toBeVisible();
  await page.goto('/my-decks');
  await page.getByRole('link', { name: 'Travel — Learner 1', exact: true }).click();
  await page.getByRole('button', { name: 'Generate with AI', exact: true }).click();
  await page.getByLabel('Number of cards').selectOption('5');
  await page.getByRole('button', { name: 'Generate preview', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Preview and select cards' })).toBeVisible();
  await expect(page.locator('.ai-v2-panel').getByText('DEMO_LIBRARY').first()).toBeVisible();
  await page.screenshot({ path: 'test-results/offline-ai-preview.png', fullPage: true, animations: 'disabled' });
  // No automatic persistence: confirmation dialog appears before saving.
  await page.getByRole('button', { name: 'Add selected cards to deck', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Confirm adding cards' })).toBeVisible();
  await page.getByRole('button', { name: 'Confirm save', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Confirm adding cards' })).not.toBeVisible();
});
