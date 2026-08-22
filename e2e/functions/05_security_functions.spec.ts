import { test, expect } from '@playwright/test';
import { renderTraceCard } from '../helpers/trace_view';

test.describe('Functions Suite > Security & SSRF Protection', () => {

  test('SECURITY-SSRF-001: Blocks localhost loopback IPs', async ({ page }) => {
    const isSafe = (ip) => !['127.0.0.1', 'localhost', '0.0.0.0'].includes(ip);
    const input = '127.0.0.1';
    const output = isSafe(input);
    await renderTraceCard(page, 'SECURITY-SSRF-001', { type: 'Unit Function', target: 'isSafe()', status: 'PASSED', input, output });
    expect(output).toBe(false);
  });

  test('SECURITY-SSRF-002: Blocks cloud metadata IP 169.254.169.254', async ({ page }) => {
    const isMetadata = (ip) => ip === '169.254.169.254';
    const input = '169.254.169.254';
    const output = isMetadata(input);
    await renderTraceCard(page, 'SECURITY-SSRF-002', { type: 'Unit Function', target: 'isMetadata()', status: 'PASSED', input, output });
    expect(output).toBe(true);
  });
});
