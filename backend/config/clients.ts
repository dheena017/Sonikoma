/**
 * backend/config/clients.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Shared AI client instances and retry helper.
 * Imported by all route files that need Gemini or HuggingFace.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { GoogleGenAI, Type } from "@google/genai";
import { HfInference } from "@huggingface/inference";

export { Type };

// ── Gemini ────────────────────────────────────────────────────────────────────
let ai: GoogleGenAI | null = null;
if (!process.env.GEMINI_API_KEY) {
  console.error('CRITICAL: GEMINI_API_KEY is missing from environment variables!');
} else {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });
    console.log('Gemini GenAI client successfully initialized server-side.');
  } catch (err) {
    console.error('Failed to initialize Gemini Client:', err);
  }
}
export { ai };

/**
 * Resilient Gemini wrapper with exponential back-off + jitter.
 * Handles 429 (quota) and 503 (high demand) automatically.
 */
export async function callGeminiWithRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 5,
  initialDelayMs = 2000
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err: any) {
      attempt++;
      const isRateLimit =
        err.status === 429 ||
        (err.message && err.message.toLowerCase().includes("quota")) ||
        (err.message && err.message.toLowerCase().includes("limit"));
      const isUnavailable =
        err.status === 503 ||
        (err.message && err.message.toLowerCase().includes("high demand")) ||
        (err.message && err.message.toLowerCase().includes("unavailable"));

      if ((isRateLimit || isUnavailable) && attempt < maxAttempts) {
        const delay = Math.round(
          initialDelayMs * Math.pow(2.2, attempt - 1) + Math.random() * 1500
        );
        console.warn(
          `[Gemini] Error ${err.status || 'unknown'} (attempt ${attempt}/${maxAttempts}). Retrying in ${delay}ms... ${err.message || ''}`
        );
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw err;
      }
    }
  }
}

// ── HuggingFace ───────────────────────────────────────────────────────────────
let hf: HfInference | null = null;
if (process.env.HUGGINGFACE_API_KEY) {
  hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
  console.log('HuggingFace Inference client successfully initialized.');
} else {
  console.log('No HUGGINGFACE_API_KEY detected.');
}
export { hf };

// ── Background video URLs by genre ────────────────────────────────────────────
export const DYNAMIC_BACKGROUND_VIDEOS: Record<string, string> = {
  action:    'https://assets.mixkit.co/videos/preview/mixkit-fire-sparkles-and-embers-on-black-background-43026-large.mp4',
  romance:   'https://assets.mixkit.co/videos/preview/mixkit-rain-drops-on-a-window-looking-out-to-city-lights-4122-large.mp4',
  fantasy:   'https://assets.mixkit.co/videos/preview/mixkit-starry-night-sky-background-with-shining-stars-and-clouds-43187-large.mp4',
  cyberpunk: 'https://assets.mixkit.co/videos/preview/mixkit-futuristic-subway-station-with-neon-lights-41710-large.mp4',
  general:   'https://assets.mixkit.co/videos/preview/mixkit-retro-futuristic-grid-background-42999-large.mp4'
};
