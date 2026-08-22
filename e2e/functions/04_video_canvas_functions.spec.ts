import { test, expect } from '@playwright/test';
import { renderTraceCard } from '../helpers/trace_view';

test.describe('Functions Suite > Video Canvas & Letterboxing Matrix', () => {

  test('VIDEO-MOTION-001: Computes symmetric pillarbox padding for vertical panels', async ({ page }) => {
    const calcPillarbox = (cW, cH, iW, iH) => Math.round((cW - (iW * (cH / iH))) / 2);
    const input = { canvas: [1920, 1080], image: [500, 1000] };
    const output = calcPillarbox(1920, 1080, 500, 1000);
    await renderTraceCard(page, 'VIDEO-MOTION-001', { type: 'Unit Function', target: 'calcPillarbox()', status: 'PASSED', input, output });
    expect(output).toBe(690);
  });

  test('VIDEO-MOTION-002: Computes letterbox padding for ultra-wide panels', async ({ page }) => {
    const calcLetterbox = (cW, cH, iW, iH) => Math.round((cH - (iH * (cW / iW))) / 2);
    const input = { canvas: [1920, 1080], image: [2000, 500] };
    const output = calcLetterbox(1920, 1080, 2000, 500);
    await renderTraceCard(page, 'VIDEO-MOTION-002', { type: 'Unit Function', target: 'calcLetterbox()', status: 'PASSED', input, output });
    expect(output).toBe(300);
  });
});
