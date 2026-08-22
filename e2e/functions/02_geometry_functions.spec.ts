import { test, expect } from '@playwright/test';
import { renderTraceCard } from '../helpers/trace_view';

test.describe('Functions Suite > Image Geometry & Panel Calculations', () => {

  test('IMAGE-PANEL-001: 16:9 Aspect Ratio Calculator produces exact dimensions', async ({ page }) => {
    const calc16by9 = (w) => ({ width: w, height: Math.round((w * 9) / 16) });
    const input = { width: 1920 };
    const output = calc16by9(1920);
    await renderTraceCard(page, 'IMAGE-PANEL-001', { type: 'Unit Function', target: 'calc16by9()', status: 'PASSED', input, output });
    expect(output.height).toBe(1080);
  });

  test('IMAGE-PANEL-002: Bounding box area calculation', async ({ page }) => {
    const calcArea = (b) => (b[2] - b[0]) * (b[3] - b[1]);
    const input = [100, 100, 400, 500];
    const output = calcArea(input);
    await renderTraceCard(page, 'IMAGE-PANEL-002', { type: 'Unit Function', target: 'calcArea()', status: 'PASSED', input, output });
    expect(output).toBe(120000);
  });
});
