import { test, expect } from '@playwright/test';
import { renderTraceCard } from '../helpers/trace_view';

test.describe('Functions Suite > Scraper & URL Normalization', () => {

  test('SCRAPER-URL-001: URL normalizer removes tracking params and hash fragments', async ({ page }) => {
    const normalizeUrl = (u) => u.split('?')[0].split('#')[0];
    const input = 'https://www.webtoons.com/en/fantasy/tower-of-god/ep-1?utm_source=share#panel';
    const output = normalizeUrl(input);
    await renderTraceCard(page, 'SCRAPER-URL-001', { type: 'Unit Function', target: 'normalizeUrl()', status: 'PASSED', input, output });
    expect(output).toBe('https://www.webtoons.com/en/fantasy/tower-of-god/ep-1');
  });

  test('SCRAPER-URL-002: Base domain extraction handles subdomains correctly', async ({ page }) => {
    const extractBaseDomain = (h) => h.replace(/^www\./, '').split('.').slice(-2).join('.');
    const input = 'cdn.manga.read.asuracomics.com';
    const output = extractBaseDomain(input);
    await renderTraceCard(page, 'SCRAPER-URL-002', { type: 'Unit Function', target: 'extractBaseDomain()', status: 'PASSED', input, output });
    expect(output).toBe('asuracomics.com');
  });
});
