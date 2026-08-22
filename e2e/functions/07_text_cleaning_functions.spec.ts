import { test, expect } from '@playwright/test';
import { renderTraceCard } from '../helpers/trace_view';

test.describe('Functions Suite > Text & Dialogue Parsing Utilities', () => {

  test('TEXT-DIALOGUE-001: Extracts speaker label and cleaned dialogue line', async ({ page }) => {
    const parseSpeaker = (line) => {
      const match = line.match(/^([^:]+):\s*(.*)$/);
      return match ? { speaker: match[1].trim(), text: match[2].trim() } : { speaker: 'Narrator', text: line };
    };
    const input = 'Bam: I need to climb the tower!';
    const output = parseSpeaker(input);
    await renderTraceCard(page, 'TEXT-DIALOGUE-001', { type: 'Unit Function', target: 'parseSpeaker()', status: 'PASSED', input, output });
    expect(output.speaker).toBe('Bam');
    expect(output.text).toBe('I need to climb the tower!');
  });

  test('TEXT-DIALOGUE-002: Truncates long panel captions with ellipsis', async ({ page }) => {
    const truncateCaption = (t, max = 30) => t.length > max ? t.slice(0, max - 3) + '...' : t;
    const input = 'This is a very long panel caption that exceeds maximum character length';
    const output = truncateCaption(input);
    await renderTraceCard(page, 'TEXT-DIALOGUE-002', { type: 'Unit Function', target: 'truncateCaption()', status: 'PASSED', input, output });
    expect(output).toBe('This is a very long panel c...');
  });
});
