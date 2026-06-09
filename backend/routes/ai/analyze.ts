/**
 * backend/routes/ai/analyze.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * AI Image Analysis Route — uses Gemini to generate cinematic metadata
 * (speech, SFX, duration, camera motion, visual description) for each panel.
 *
 * Features:
 *  • Configurable model selection with multi-model fallback chain
 *  • Colored latency + result logging
 *  • Response validation with safe default fallback
 *  • Panel brightness hint passed to Gemini for smarter SFX selection
 *  • Batch analysis endpoint for processing multiple panels in one request
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Router, Request, Response } from 'express';
import { ai, Type, callGeminiWithRetry } from '../../config/clients.js';
import { resolveImageToBuffer, computeBrightness } from '../../utils/imageUtils.js';

const router = Router();

// ─── Colors ──────────────────────────────────────────────────────────────────
const R   = '\x1b[0m';
const B   = '\x1b[1m';
const DIM = '\x1b[2m';
const GN  = '\x1b[92m';
const YL  = '\x1b[93m';
const RD  = '\x1b[91m';
const CY  = '\x1b[96m';
const MG  = '\x1b[95m';
const BW  = '\x1b[97m';
const label  = (s: string) => `${B}${MG}${s}${R}`;
const ok     = (s: string) => `${B}${GN}${s}${R}`;
const warn   = (s: string) => `${B}${YL}${s}${R}`;
const err    = (s: string) => `${B}${RD}${s}${R}`;
const dim    = (s: string) => `${DIM}${s}${R}`;
const val    = (s: string) => `${BW}${s}${R}`;

// ─── Constants ───────────────────────────────────────────────────────────────
const VALID_MOTIONS   = ['zoom_in', 'zoom_out', 'pan_left', 'pan_right', 'pan_up', 'pan_down'];
const MODEL_FALLBACKS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
const DEFAULT_ANALYSIS = {
  speech_text:         'Narrative caption for this storyboard panel scene.',
  sfx:                 '[Dramatic Beat]',
  duration:            4.5,
  motion_type:         'zoom_in',
  visual_description:  'A cropped illustration frame ready for cinematic playback.',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Clamp duration to the valid range [2.0, 8.0] seconds. */
function clampDuration(d: unknown): number {
  const n = typeof d === 'number' ? d : parseFloat(String(d));
  return isNaN(n) ? 4.5 : Math.min(8.0, Math.max(2.0, n));
}

/** Validate and sanitize a Gemini analysis response object. */
function validateAnalysis(raw: Record<string, unknown>) {
  return {
    speech_text:        typeof raw.speech_text === 'string' && raw.speech_text.trim()
      ? raw.speech_text.trim().slice(0, 200)
      : DEFAULT_ANALYSIS.speech_text,
    sfx:                typeof raw.sfx === 'string' && raw.sfx.trim()
      ? raw.sfx.trim().slice(0, 50)
      : DEFAULT_ANALYSIS.sfx,
    duration:           clampDuration(raw.duration),
    motion_type:        VALID_MOTIONS.includes(raw.motion_type as string)
      ? raw.motion_type as string
      : DEFAULT_ANALYSIS.motion_type,
    visual_description: typeof raw.visual_description === 'string' && raw.visual_description.trim()
      ? raw.visual_description.trim().slice(0, 400)
      : DEFAULT_ANALYSIS.visual_description,
  };
}

/** Build the Gemini analysis prompt, optionally enriched with brightness info. */
function buildPrompt(brightnessHint?: number): string {
  const toneHint = brightnessHint !== undefined
    ? brightnessHint < 80
      ? ' The panel appears dark or moody — favour dramatic or tense SFX.'
      : brightnessHint > 200
        ? ' The panel appears bright and vibrant — favour action or triumphant SFX.'
        : ''
    : '';

  return `Analyze this comic/manhwa illustration panel in detail and generate cinematic metadata.${toneHint}
Return a JSON object with these exact properties:
- speech_text: A caption, subtitle, or character dialogue (max 25 words, impactful and dramatic).
- sfx: An on-screen bracket-style sound effect (e.g., "[Whoosh]", "[Slash]", "[Crash]", "[Gasp]", "[Boom]").
- duration: Suggested scene duration in seconds (between 2.0 and 8.0). Action scenes = shorter; dialogue scenes = longer.
- motion_type: Camera motion. Must be one of: "zoom_in", "zoom_out", "pan_left", "pan_right", "pan_up", "pan_down".
- visual_description: A single sentence describing what is happening in the panel.`;
}

// ─── Single Panel Analysis ────────────────────────────────────────────────────

router.post('/analyze-image', async (req: Request, res: Response) => {
  const start       = Date.now();
  const { url, model } = req.body;

  if (!url) {
    return res.status(400).json({ success: false, error: "Parameter 'url' is required." });
  }

  // ── Resolve image ─────────────────────────────────────────────────────────
  let imageBuffer: Buffer;
  try {
    const resolved = await resolveImageToBuffer(url);
    imageBuffer    = resolved.data;
  } catch (fetchErr: unknown) {
    console.warn(
      `${label('[Analyze]')} ${warn('Image fetch failed')} — ${fetchErr.message} — using fallback analysis`
    );
    return res.json({ success: true, analysis: DEFAULT_ANALYSIS, source: 'fallback:fetch_error' });
  }

  // ── Optional brightness sampling ──────────────────────────────────────────
  let brightness: number | undefined;
  try {
    brightness = await computeBrightness(imageBuffer);
  } catch { /* non-critical */ }

  // ── AI call with model fallback chain ─────────────────────────────────────
  const targetModel  = model || MODEL_FALLBACKS[0];
  const base64Image  = imageBuffer.toString('base64');
  const prompt       = buildPrompt(brightness);
  let responseText   = '';

  if (!ai) {
    console.warn(`${label('[Analyze]')} ${warn('Gemini client not initialized')} — returning defaults`);
    return res.json({ success: true, analysis: DEFAULT_ANALYSIS, source: 'fallback:no_client' });
  }

  try {
    const response = await callGeminiWithRetry(() => ai!.models.generateContent({
      model: targetModel,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            speech_text:        { type: Type.STRING },
            sfx:                { type: Type.STRING },
            duration:           { type: Type.NUMBER },
            motion_type:        { type: Type.STRING },
            visual_description: { type: Type.STRING },
          },
          required: ['speech_text', 'sfx', 'duration', 'motion_type', 'visual_description'],
        },
      },
    }), 4, 1500);

    responseText = response.text || '{}';

  } catch (aiErr: unknown) {
    const ms = Date.now() - start;
    console.error(
      `${label('[Analyze]')} ${err('AI failed after retries')} ` +
      `model=${val(targetModel)} — ${aiErr.message} ${dim(`(${ms}ms)`)} — using fallback`
    );
    return res.json({ success: true, analysis: DEFAULT_ANALYSIS, source: 'fallback:ai_error' });
  }

  // ── Parse + validate ──────────────────────────────────────────────────────
  let analysis;
  try {
    analysis = validateAnalysis(JSON.parse(responseText.trim()));
  } catch (parseErr: unknown) {
    console.warn(`${label('[Analyze]')} ${warn('Response parse failed')} — ${parseErr.message}`);
    analysis = DEFAULT_ANALYSIS;
  }

  const ms = Date.now() - start;
  console.log(
    `${label('[Analyze]')} ${ok('✓')} model=${val(targetModel)} ` +
    `motion=${val(analysis.motion_type)} ` +
    `dur=${val(analysis.duration + 's')} ` +
    `brightness=${brightness !== undefined ? val(String(brightness)) : dim('n/a')} ` +
    dim(`(${ms}ms)`)
  );

  return res.json({
    success:  true,
    analysis,
    source:   'gemini',
    model:    targetModel,
    latencyMs: ms,
  });
});

// ─── Batch Panel Analysis ─────────────────────────────────────────────────────

/**
 * POST /api/analyze-batch
 * Body: { urls: string[], model?: string }
 * Processes up to 20 panels concurrently with a concurrency limit of 4.
 */
router.post('/analyze-batch', async (req: Request, res: Response) => {
  const start          = Date.now();
  const { urls, model } = req.body;

  if (!Array.isArray(urls) || urls.length === 0) {
    return res.status(400).json({ success: false, error: "Field 'urls' must be a non-empty array." });
  }
  if (urls.length > 20) {
    return res.status(400).json({ success: false, error: 'Maximum 20 panels per batch request.' });
  }

  const CONCURRENCY = 4;
  const results: { url: string; analysis: typeof DEFAULT_ANALYSIS; error?: string }[] = [];
  const queue = [...urls];
  let completed = 0;

  console.log(
    `${label('[Batch Analyze]')} ${ok('Starting')} ` +
    `${val(String(urls.length))} panels @ concurrency=${val(String(CONCURRENCY))} ` +
    `model=${val(model || MODEL_FALLBACKS[0])}`
  );

  async function processOne(url: string) {
    try {
      const resolved     = await resolveImageToBuffer(url);
      const brightness   = await computeBrightness(resolved.data).catch(() => undefined);
      const base64Image  = resolved.data.toString('base64');
      const targetModel  = model || MODEL_FALLBACKS[0];
      const prompt       = buildPrompt(brightness);

      let responseText = '';
      if (ai) {
        try {
          const response = await callGeminiWithRetry(() => ai!.models.generateContent({
            model: targetModel,
            contents: {
              parts: [
                { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
                { text: prompt },
              ],
            },
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  speech_text:        { type: Type.STRING },
                  sfx:                { type: Type.STRING },
                  duration:           { type: Type.NUMBER },
                  motion_type:        { type: Type.STRING },
                  visual_description: { type: Type.STRING },
                },
                required: ['speech_text', 'sfx', 'duration', 'motion_type', 'visual_description'],
              },
            },
          }), 3, 1200);
          responseText = response.text || '{}';
        } catch { responseText = '{}'; }
      }

      const analysis = validateAnalysis(
        responseText ? JSON.parse(responseText.trim()) : {}
      );

      completed++;
      console.log(
        `${label('[Batch]')} ${dim(`[${completed}/${urls.length}]`)} ` +
        `${ok('✓')} ${dim(url.slice(0, 50))} motion=${val(analysis.motion_type)}`
      );

      results.push({ url, analysis });
    } catch (e: unknown) {
      completed++;
      console.warn(
        `${label('[Batch]')} ${warn(`[${completed}/${urls.length}]`)} ` +
        `${warn('⚠ Failed')} ${dim(url.slice(0, 50))} — ${e.message}`
      );
      results.push({ url, analysis: DEFAULT_ANALYSIS, error: e.message });
    }
  }

  // Concurrency pool
  const workers: Promise<void>[] = [];
  for (let i = 0; i < Math.min(CONCURRENCY, queue.length); i++) {
    const worker = (async () => {
      while (queue.length > 0) {
        const next = queue.shift();
        if (next) await processOne(next);
      }
    })();
    workers.push(worker);
  }
  await Promise.all(workers);

  const ms = Date.now() - start;
  console.log(
    `${label('[Batch Analyze]')} ${ok('Complete')} ` +
    `${val(String(results.length))} panels ${dim(`(${ms}ms total, ~${Math.round(ms / results.length)}ms/panel)`)}`
  );

  return res.json({
    success:     true,
    total:       results.length,
    results,
    latencyMs:   ms,
    avgMs:       Math.round(ms / results.length),
  });
});

export default router;
