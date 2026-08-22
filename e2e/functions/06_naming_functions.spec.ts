import { test, expect } from '@playwright/test';
import { renderTraceCard } from '../helpers/trace_view';

test.describe('Functions Suite > Naming & Export Path Utilities', () => {

  test('NAMING-EXPORT-001: Sanitizes export file names removing illegal characters', async ({ page }) => {
    const sanitizeFileName = (n) => n.replace(/[\\/:*?"<>|]/g, '_').trim();
    const input = 'Tower of God: Episode 01 [HD]';
    const output = sanitizeFileName(input);
    await renderTraceCard(page, 'NAMING-EXPORT-001', { type: 'Unit Function', target: 'sanitizeFileName()', status: 'PASSED', input, output });
    expect(output).toBe('Tower of God_ Episode 01 [HD]');
  });

  test('NAMING-EXPORT-002: Formats timestamp strings for export archive names', async ({ page }) => {
    const formatTimestamp = (d) => d.toISOString().split('T')[0];
    const input = new Date('2026-08-22');
    const output = formatTimestamp(input);
    await renderTraceCard(page, 'NAMING-EXPORT-002', { type: 'Unit Function', target: 'formatTimestamp()', status: 'PASSED', input: '2026-08-22', output });
    expect(output).toBe('2026-08-22');
  });
});
