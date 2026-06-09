import { Router } from 'express';
import sharp from 'sharp';
import { resolveImageToBuffer, cropAutoBorders } from '../../utils/imageUtils.js';
import { stitchedCache } from '../../utils/cache.js';

const router = Router();

/**
 * Execute horizontal (row) splits on a single image.
 *
 * Request:
 *  { url: string, splitLines: number[] }
 *
 * splitLines are Y positions in percent (0-100) representing boundaries between panels.
 * The final output will contain cropped images for each segment.
 */
router.post('/execute-splits', async (req, res) => {
  const { url, splitLines } = req.body as { url?: string; splitLines?: number[] };

  if (!url) return res.status(400).json({ success: false, error: "Parameter 'url' is required." });
  if (!Array.isArray(splitLines)) return res.status(400).json({ success: false, error: "Parameter 'splitLines' must be an array." });

  try {
    const resolved = await resolveImageToBuffer(url);
    let imgBuffer = resolved.data;

    const meta = await sharp(imgBuffer).metadata();
    const w = meta.width || 0;
    const h = meta.height || 0;

    if (w <= 0 || h <= 0) {
      return res.status(400).json({ success: false, error: 'Unable to read image dimensions.' });
    }

    // Normalize & sanitize split lines
    const ys = splitLines
      .map((n) => Number(n))
      .filter((n) => Number.isFinite(n))
      .map((n) => Math.max(0, Math.min(100, n)));

    // Always include edges.
    // Create segments between consecutive boundaries.
    const boundaries = Array.from(new Set([0, ...ys, 100])).sort((a, b) => a - b);

    const minSegmentHeightPx = 20; // avoid producing near-empty crops

    const urls: string[] = [];

    for (let i = 0; i < boundaries.length - 1; i++) {
      const topPct = boundaries[i];
      const botPct = boundaries[i + 1];

      const segTopPx = Math.round((topPct / 100) * h);
      const segBotPx = Math.round((botPct / 100) * h);
      const segHeightPx = segBotPx - segTopPx;

      if (segHeightPx < minSegmentHeightPx) continue;

      // Compute crop box (left/right keep full width)
      const extract = {
        left: 0,
        top: segTopPx,
        width: w,
        height: segHeightPx,
      };

      let segBuffer = await sharp(imgBuffer).extract(extract).toBuffer();

      // Optional: auto-crop borders to remove gutters.
      // Keep it conservative by using defaults similar to edit-image.
      // If you want exact parity with edit-image, we can wire those params.
      try {
        const trimmed = await cropAutoBorders(
          segBuffer,
          true,
          0,
          30,
          'auto',
          'free',
          'jpeg',
          90
        );
        segBuffer = trimmed.data;
      } catch {
        // ignore trimming failures; still return extracted segment
      }

      const cacheId = `split_${Date.now()}_${Math.floor(Math.random() * 100000)}_${i}`;
      const newUrl = `/api/merge-images/cached/${cacheId}`;

      stitchedCache.set(cacheId, {
        data: segBuffer,
        contentType: 'image/jpeg',
      });

      urls.push(newUrl);
    }

    if (urls.length === 0) {
      return res.status(200).json({ success: true, urls: [], message: 'No valid split segments produced.' });
    }

    return res.json({ success: true, urls });
  } catch (err: unknown) {
    console.error('[execute-splits] failed:', err);
    return res.status(500).json({ success: false, error: err.message || 'execute-splits failed' });
  }
});

export default router;

