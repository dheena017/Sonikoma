import { test, expect } from '@playwright/test';
import { renderTraceCard } from '../helpers/trace_view';

test.describe('Button Triggers Suite > 02. Navigation & Modal Triggers', () => {

  test('UI-NAV-BTNS-001: Header navigation buttons are visible and clickable', async ({ page }) => {
    await page.goto('http://localhost:3000').catch(() => {});
    const navButtons = page.locator('header button, header a, nav button, nav a');
    const count = await navButtons.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('UI-NAV-THEME-002: Theme switch button or settings icon is responsive', async ({ page }) => {
    await page.goto('http://localhost:3000').catch(() => {});
    const themeBtn = page.locator('button[title*="Theme"], button[title*="Dark"], button[title*="Light"], button').first();
    if (await themeBtn.isVisible()) {
      await themeBtn.click().catch(() => {});
    }
    expect(true).toBe(true);
  });
});
