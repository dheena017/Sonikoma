/**
 * backend/utils/imageUtils.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Image resolution, analysis, conversion, and processing helper utilities.
 * All functions use sharp and operate on raw Buffers for zero-disk-I/O speed.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import sharp, { Sharp } from 'sharp';
import crypto from 'crypto';
import { mergedCache } from './cache.js';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface ImageMeta {
  width:       number;
  height:      number;
  format:      string;
  channels:    number;
  hasAlpha:    boolean;
  sizeBytes:   number;
  aspectRatio: string;
  orientation: 'landscape' | 'portrait' | 'square';
  megapixels:  number;
}

export interface ResolvedImage {
  data:        Buffer;
  contentType: string;
}

export type OutputFormat = 'jpeg' | 'png' | 'webp' | 'avif';

// ─────────────────────────────────────────────────────────────────────────────
// URL RESOLVER
// Safely converts any URL form (absolute, relative, cached, proxied) → Buffer
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolve ANY image URL (absolute, relative, /api/merge-images/cached, proxied)
 * into a raw Buffer + contentType, without loopback HTTP issues.
 */
export async function resolveImageToBuffer(urlStr: string): Promise<ResolvedImage> {
  if (!urlStr) throw new Error('Empty image URL provided');

  let workingUrl = urlStr.trim();

  // 1. Check in-memory merged/stitch cache first (zero-cost retrieval)
  if (
    workingUrl.includes('/api/merge-images/cached/') ||
    workingUrl.includes('/api/stitch-images/cached/')
  ) {
    const matched = workingUrl.match(/\/(?:merge|stitch)-images\/cached\/([^\\/\s?&]+)/);
    if (matched?.[1]) {
      const cached = mergedCache.get(matched[1]);
      if (cached) return { data: cached.data, contentType: cached.contentType || 'image/png' };
    }
  }

  // 2. Unwrap any double-proxied URLs
  if (workingUrl.includes('/api/proxy-image')) {
    const matched = workingUrl.match(/[?&]url=([^&]+)/);
    if (matched?.[1]) workingUrl = decodeURIComponent(matched[1]);
  }

  // 3. Base64 data-URL shortcut — decode inline without any HTTP
  if (workingUrl.startsWith('data:image/')) {
    const [, rest]  = workingUrl.split(',');
    const buf       = Buffer.from(rest, 'base64');
    const mimeMatch = workingUrl.match(/^data:(image\/[a-z+]+);base64/);
    return { data: buf, contentType: mimeMatch?.[1] || 'image/jpeg' };
  }

  // 4. Normalize internal hostnames → relative paths to call localhost directly
  if (/^https?:\/\//i.test(workingUrl)) {
    try {
      const parsed = new URL(workingUrl);
      const host   = parsed.hostname;
      if (
        host.includes('run.app') ||
        host.includes('localhost') ||
        host === '127.0.0.1'
      ) {
        workingUrl = parsed.pathname + parsed.search;
      }
    } catch { /* fall through */ }
  }

  // 5. Relative paths → localhost
  if (workingUrl.startsWith('/')) {
    workingUrl = `http://localhost:${process.env.PORT || 3000}${workingUrl}`;
  }

  // 6. Remote fetch with referrer-bypass headers
  const response = await fetch(workingUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
      'Referer':    'https://www.webtoons.com/',
      'Accept':     'image/*,*/*;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText} — ${workingUrl}`);
  }

  const contentType = response.headers.get('Content-Type') || 'image/jpeg';
  const data        = Buffer.from(await response.arrayBuffer());
  return { data, contentType };
}

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE METADATA
// ─────────────────────────────────────────────────────────────────────────────

/** Extract rich metadata from a Buffer without decoding the full image. */
export async function getImageMeta(buffer: Buffer): Promise<ImageMeta> {
  const meta = await sharp(buffer).metadata();
  const w    = meta.width  || 0;
  const h    = meta.height || 0;
  const gcd  = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
  const d    = gcd(w, h) || 1;

  return {
    width:       w,
    height:      h,
    format:      meta.format || 'unknown',
    channels:    meta.channels || 3,
    hasAlpha:    (meta.channels || 3) === 4,
    sizeBytes:   buffer.length,
    aspectRatio: `${w / d}:${h / d}`,
    orientation: w > h ? 'landscape' : w === h ? 'square' : 'portrait',
    megapixels:  parseFloat(((w * h) / 1_000_000).toFixed(2)),
  };
}

/** Generate a fast MD5 fingerprint of raw image bytes. Useful for dedup / caching. */
export function fingerprintImage(buffer: Buffer): string {
  return crypto.createHash('md5').update(buffer).digest('hex');
}

// ─────────────────────────────────────────────────────────────────────────────
// FORMAT CONVERSION
// ─────────────────────────────────────────────────────────────────────────────

/** Convert a Buffer to the target format with quality control. */
export async function convertFormat(
  buffer: Buffer,
  format: OutputFormat = 'jpeg',
  quality = 90,
): Promise<{ data: Buffer; contentType: string }> {
  let instance: Sharp = sharp(buffer);
  let contentType: string;

  switch (format) {
    case 'png':
      instance   = instance.png({ compressionLevel: 8 });
      contentType = 'image/png';
      break;
    case 'webp':
      instance   = instance.webp({ quality });
      contentType = 'image/webp';
      break;
    case 'avif':
      instance   = instance.avif({ quality });
      contentType = 'image/avif';
      break;
    default:
      instance   = instance.jpeg({ quality, progressive: true });
      contentType = 'image/jpeg';
  }

  return { data: await instance.toBuffer(), contentType };
}

/** Resize while maintaining aspect ratio, fitting within maxW × maxH. */
export async function resizeFit(
  buffer: Buffer,
  maxW: number,
  maxH: number,
  format: OutputFormat = 'jpeg',
  quality = 88,
): Promise<{ data: Buffer; contentType: string }> {
  const resized = await sharp(buffer)
    .resize(maxW, maxH, { fit: 'inside', withoutEnlargement: true })
    .toBuffer();
  return convertFormat(resized, format, quality);
}

/** Generate a thumbnail (always JPEG for speed). */
export async function makeThumbnail(
  buffer: Buffer,
  size = 256,
): Promise<Buffer> {
  return sharp(buffer)
    .resize(size, size, { fit: 'cover', position: 'attention' })
    .jpeg({ quality: 70, progressive: true })
    .toBuffer();
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTO CROP — removes uniform borders (white/black backgrounds)
// ─────────────────────────────────────────────────────────────────────────────

export async function cropAutoBorders(
  imageBuffer:         Buffer,
  tighter                              = false,
  cropPadding?:        number,
  sensitivity?:        number,
  backgroundColorMode: string          = 'auto',
  aspectRatio:         string          = 'free',
  outputFormat:        string          = 'jpeg',
  cropQuality:         number          = 90,
): Promise<ResolvedImage> {
  try {
    const meta = await sharp(imageBuffer).metadata();
    const w    = meta.width  || 0;
    const h    = meta.height || 0;

    // Skip tiny UI assets
    if (w < 80 || h < 80) {
      return { data: imageBuffer, contentType: `image/${meta.format || 'jpeg'}` };
    }

    const bgHex = backgroundColorMode === 'white' ? '#ffffff'
                : backgroundColorMode === 'black' ? '#000000'
                : undefined;

    const threshold = typeof sensitivity === 'number' && !isNaN(sensitivity)
      ? sensitivity
      : tighter ? 50 : 25;

    let trimmed = imageBuffer;
    try {
      const opts: any = { threshold };
      if (bgHex) opts.background = bgHex;
      const { data, info } = await sharp(imageBuffer).trim(opts).toBuffer({ resolveWithObject: true });
      if (info.width >= 15 && info.height >= 15) trimmed = data;
      else console.warn('[ImageUtils] Trim produced near-empty image — skipping trim.');
    } catch {
      try {
        const { data, info } = await sharp(imageBuffer).trim({ threshold }).toBuffer({ resolveWithObject: true });
        if (info.width >= 15 && info.height >= 15) trimmed = data;
      } catch { /* keep original */ }
    }

    let padding   = typeof cropPadding === 'number' ? cropPadding : tighter ? 4 : 20;
    const tMeta   = await sharp(trimmed).metadata();
    const tw      = tMeta.width  || 0;
    const th      = tMeta.height || 0;

    let eL = padding, eR = padding, eT = padding, eB = padding;

    if (aspectRatio && aspectRatio !== 'free') {
      const ratioMap: Record<string, number> = {
        '1:1': 1, '16:9': 16 / 9, '9:16': 9 / 16, '4:3': 4 / 3,
      };
      const target = ratioMap[aspectRatio];
      if (target) {
        const bW = tw + padding * 2;
        const bH = th + padding * 2;
        const cr = bW / bH;
        if (cr < target) {
          const extra = Math.round(bH * target) - bW;
          eL += Math.floor(extra / 2);
          eR += Math.ceil(extra / 2);
        } else if (cr > target) {
          const extra = Math.round(bW / target) - bH;
          eT += Math.floor(extra / 2);
          eB += Math.ceil(extra / 2);
        }
      }
    }

    const extended = await sharp(trimmed)
      .extend({ top: eT, bottom: eB, left: eL, right: eR, background: bgHex || '#ffffff' })
      .toBuffer();

    const isPng    = outputFormat === 'png';
    const finalBuf = await (isPng
      ? sharp(extended).png()
      : sharp(extended).jpeg({ quality: cropQuality, progressive: true })
    ).toBuffer();

    return { data: finalBuf, contentType: isPng ? 'image/png' : 'image/jpeg' };

  } catch (e: any) {
    console.error('[ImageUtils] cropAutoBorders failed:', e.message);
    return { data: imageBuffer, contentType: 'image/jpeg' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// COLOR ANALYSIS
// ─────────────────────────────────────────────────────────────────────────────

/** Sample the dominant background color from image corners (16×16 px each). */
export async function sampleBackgroundColor(
  buffer: Buffer,
): Promise<{ hex: string; isDark: boolean }> {
  try {
    const meta   = await sharp(buffer).metadata();
    const w      = meta.width  || 100;
    const h      = meta.height || 100;
    const sample = 16;

    // Top-left corner sample
    const corner = await sharp(buffer)
      .extract({ left: 0, top: 0, width: Math.min(sample, w), height: Math.min(sample, h) })
      .resize(1, 1)
      .raw()
      .toBuffer();

    const r   = corner[0] ?? 255;
    const g   = corner[1] ?? 255;
    const b   = corner[2] ?? 255;
    const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    return { hex, isDark: lum < 128 };
  } catch {
    return { hex: '#ffffff', isDark: false };
  }
}

/** Compute average brightness of the entire image (0–255). */
export async function computeBrightness(buffer: Buffer): Promise<number> {
  try {
    const stats = await sharp(buffer).stats();
    const mean  = stats.channels.reduce((sum, ch) => sum + ch.mean, 0) / stats.channels.length;
    return Math.round(mean);
  } catch {
    return 128;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE COMPOSITION HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Stack multiple image buffers vertically into one tall composite. */
export async function stackVertical(
  buffers:    Buffer[],
  gap         = 0,
  background  = '#ffffff',
): Promise<{ data: Buffer; contentType: string }> {
  if (buffers.length === 0) throw new Error('No buffers provided to stackVertical');
  if (buffers.length === 1) return { data: buffers[0], contentType: 'image/jpeg' };

  const metas = await Promise.all(buffers.map(b => sharp(b).metadata()));
  const maxW  = Math.max(...metas.map(m => m.width  || 0));
  const totalH = metas.reduce((s, m) => s + (m.height || 0) + gap, -gap);

  let yOffset   = 0;
  const inputs: sharp.OverlayOptions[] = [];
  for (let i = 0; i < buffers.length; i++) {
    const mW = metas[i].width || maxW;
    const left = Math.floor((maxW - mW) / 2);
    inputs.push({ input: buffers[i], top: yOffset, left });
    yOffset += (metas[i].height || 0) + gap;
  }

  const canvas = await sharp({
    create: { width: maxW, height: totalH, channels: 3, background },
  })
    .composite(inputs)
    .jpeg({ quality: 90, progressive: true })
    .toBuffer();

  return { data: canvas, contentType: 'image/jpeg' };
}

/** Apply image filters: brightness, contrast, saturation, grayscale. */
export async function applyFilters(
  buffer:     Buffer,
  options: {
    brightness?:  number;  // -100 to +100 (delta)
    contrast?:    number;  // 0.1 to 3.0 (multiplier)
    saturation?:  number;  // 0 to 3.0 (multiplier)
    grayscale?:   boolean;
    blur?:        number;  // sigma 0.3 to 1000
    sharpen?:     boolean;
  } = {},
): Promise<Buffer> {
  let img = sharp(buffer);

  if (options.grayscale)                img = img.grayscale();
  if (options.blur && options.blur > 0) img = img.blur(options.blur);
  if (options.sharpen)                  img = img.sharpen();

  const mod: any = {};
  if (typeof options.brightness === 'number') {
    // sharp modulate brightness is 0–2 (1 = no change), we accept -100 to +100 delta
    mod.brightness = 1 + options.brightness / 100;
  }
  if (typeof options.saturation === 'number') {
    mod.saturation = options.saturation;
  }
  if (typeof options.contrast === 'number') {
    img = img.linear(options.contrast, -(options.contrast - 1) * 128);
  }
  if (Object.keys(mod).length > 0) img = img.modulate(mod);

  return img.toBuffer();
}

// ─────────────────────────────────────────────────────────────────────────────
// WATERMARK / OVERLAY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Composite a semi-transparent watermark text badge onto the bottom-right
 * corner of an image (SVG-based, zero external font dependency).
 */
export async function addWatermark(
  buffer: Buffer,
  text    = 'Anivox',
): Promise<Buffer> {
  const meta  = await sharp(buffer).metadata();
  const w     = meta.width  || 400;
  const h     = meta.height || 300;
  const fSize = Math.max(12, Math.round(w * 0.025));
  const padX  = 10;
  const padY  = 10;
  const bW    = text.length * fSize * 0.6 + padX * 2;
  const bH    = fSize + padY * 2;

  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${bW}" height="${bH}">
      <rect width="${bW}" height="${bH}" rx="4" fill="rgba(0,0,0,0.45)"/>
      <text x="${padX}" y="${fSize + padY / 2}" font-family="sans-serif"
            font-size="${fSize}" fill="white" opacity="0.9">${text}</text>
    </svg>`
  );

  return sharp(buffer)
    .composite([{
      input:    svg,
      gravity:  'southeast',
    }])
    .toBuffer();
}
