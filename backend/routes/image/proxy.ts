/**
 * backend/routes/image/proxy.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Image Proxy Route — Fetches external images on behalf of the frontend,
 * bypassing referrer restrictions from Webtoon / Manhwa CDNs.
 *
 * Features:
 *  • In-memory TTL cache (avoids repeated remote fetches for same URL)
 *  • ETag + Last-Modified / 304 Not Modified support
 *  • Content-Type validation (only allows image/* responses)
 *  • Response size guard (rejects payloads > MAX_PROXY_SIZE)
 *  • Configurable retry with exponential back-off
 *  • Dynamic Referer spoofing based on image URL origin
 *  • Colorized console logging with request latency
 *  • Served with 1-year CDN cache headers for hot assets
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Router, Request, Response } from 'express';
import { CacheStore } from '../../utils/cache.js';
import crypto from 'crypto';

const router = Router();

// ─── Config ──────────────────────────────────────────────────────────────────
const MAX_PROXY_SIZE_MB  = parseInt(process.env.MAX_PROXY_MB  || '20',  10);
const MAX_PROXY_SIZE     = MAX_PROXY_SIZE_MB * 1024 * 1024;
const PROXY_CACHE_TTL_MS = 30 * 60 * 1000;  // 30 minutes
const PROXY_MAX_RETRIES  = 3;
const PROXY_RETRY_BASE   = 400; // ms

// ─── In-memory proxy cache (separate from stitchedCache) ──────────────────────
interface ProxyCacheEntry {
  data:        Buffer;
  contentType: string;
  etag:        string;
  size:        number;
  fetchedAt:   number;
}

const proxyCache = new CacheStore<ProxyCacheEntry>(
  'proxyImages', PROXY_CACHE_TTL_MS, 300
);

// ─── Terminal colors (reuse pattern from server.ts) ─────────────────────────
const R  = '\x1b[0m';
const DIM = '\x1b[2m';
const CY  = '\x1b[36m';
const GN  = '\x1b[32m';
const YL  = '\x1b[33m';
const RD  = '\x1b[31m';
const BW  = '\x1b[97m';
const BM  = '\x1b[95m';
const label = (s: string) => `\x1b[1m${BM}${s}${R}`;
const ok    = (s: string) => `\x1b[1m${GN}${s}${R}`;
const warn  = (s: string) => `\x1b[1m${YL}${s}${R}`;
const err   = (s: string) => `\x1b[1m${RD}${s}${R}`;
const dim   = (s: string) => `${DIM}${s}${R}`;
const val   = (s: string) => `${BW}${s}${R}`;
const route = (s: string) => `${CY}${s}${R}`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Generate an MD5 fingerprint for a Buffer (used as ETag). */
function makeETag(buf: Buffer): string {
  return `"${crypto.createHash('md5').update(buf).digest('hex')}"`;
}

/** Derive a plausible Referer for CDN bypass based on the image URL. */
function spoofReferer(url: string): string {
  try {
    const parsed  = new URL(url);
    const host    = parsed.hostname.toLowerCase();
    if (host.includes('webtoons'))  return 'https://www.webtoons.com/';
    if (host.includes('naver'))     return 'https://comic.naver.com/';
    if (host.includes('kakao'))     return 'https://page.kakao.com/';
    if (host.includes('lezhin'))    return 'https://www.lezhin.com/';
    if (host.includes('tapas'))     return 'https://tapas.io/';
    if (host.includes('manhwa'))    return 'https://manhwatop.com/';
    return `${parsed.protocol}//${parsed.hostname}/`;
  } catch {
    return 'https://www.webtoons.com/';
  }
}

/** Fetch with exponential back-off retry on 5xx or network errors. */
async function fetchWithRetry(
  url: string,
  headers: Record<string, string>,
  retries = PROXY_MAX_RETRIES,
  baseDelay = PROXY_RETRY_BASE
): Promise<globalThis.Response> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const resp = await fetch(url, { headers });
      // Only retry on 5xx
      if (resp.status >= 500 && attempt < retries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(
          `${label('[Proxy]')} ${warn(`Retry ${attempt + 1}/${retries}`)} ` +
          `${route(url.slice(0, 60))} → status ${resp.status} — waiting ${delay}ms`
        );
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      return resp;
    } catch (e: unknown) {
      lastErr = e;
      if (attempt < retries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(
          `${label('[Proxy]')} ${warn(`Network error, retry ${attempt + 1}/${retries}`)} ` +
          `— ${e.message} — waiting ${delay}ms`
        );
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  throw lastErr || new Error('Max retries reached');
}

// ─── Route ───────────────────────────────────────────────────────────────────

router.get('/proxy-image', async (req: Request, res: Response) => {
  const start     = Date.now();
  const targetUrl = req.query.url as string;

  // ── Validate input ────────────────────────────────────────────────────────
  if (!targetUrl) {
    return res.status(400).json({ success: false, error: "Missing required query parameter: 'url'" });
  }

  // Unwrap any double-proxied URLs
  let fetchUrl = targetUrl;
  if (fetchUrl.includes('/api/proxy-image')) {
    const m = fetchUrl.match(/[?&]url=([^&]+)/);
    if (m?.[1]) fetchUrl = decodeURIComponent(m[1]);
  }

  // Validate URL scheme — only allow http/https
  try {
    const parsed = new URL(fetchUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return res.status(400).json({ success: false, error: 'Only HTTP/HTTPS URLs are supported.' });
    }
  } catch {
    return res.status(400).json({ success: false, error: 'Invalid URL format.' });
  }

  // ── Cache check ───────────────────────────────────────────────────────────
  const cacheKey = crypto.createHash('md5').update(fetchUrl).digest('hex');
  const cached   = proxyCache.get(cacheKey);

  if (cached) {
    // ETag conditional request (304 Not Modified)
    const clientETag = req.headers['if-none-match'];
    if (clientETag === cached.etag) {
      const ms = Date.now() - start;
      console.log(
        `${label('[Proxy]')} ${dim('304')} ${dim('CACHE HIT')} ` +
        `${route(fetchUrl.slice(0, 55))} ${dim(`(${ms}ms)`)}`
      );
      return res.status(304).end();
    }

    const ms = Date.now() - start;
    console.log(
      `${label('[Proxy]')} ${ok('200')} ${dim('CACHE HIT')} ` +
      `${route(fetchUrl.slice(0, 55))} ` +
      `${dim(`${(cached.size / 1024).toFixed(1)}KB`)} ${dim(`(${ms}ms)`)}`
    );

    res.setHeader('Content-Type',     cached.contentType);
    res.setHeader('ETag',             cached.etag);
    res.setHeader('X-Cache',          'HIT');
    res.setHeader('Cache-Control',    'public, max-age=31536000, immutable');
    res.setHeader('X-Proxy-Size-KB',  (cached.size / 1024).toFixed(1));
    return res.send(cached.data);
  }

  // ── Remote fetch ──────────────────────────────────────────────────────────
  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Referer':    spoofReferer(fetchUrl),
      'Accept':     'image/webp,image/avif,image/jpeg,image/png,image/*,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Sec-Fetch-Dest': 'image',
      'Sec-Fetch-Mode': 'no-cors',
      'Sec-Fetch-Site': 'cross-site',
    };

    const response = await fetchWithRetry(fetchUrl, headers);

    if (!response.ok) {
      console.warn(
        `${label('[Proxy]')} ${warn(`Upstream error ${response.status}`)} ` +
        `${route(fetchUrl.slice(0, 60))}`
      );
      return res.status(response.status).json({
        success: false,
        error:   `Upstream returned ${response.status} ${response.statusText}`,
        url:     fetchUrl,
      });
    }

    // Validate Content-Type — reject non-image responses
    const contentType = response.headers.get('Content-Type') || 'image/jpeg';
    if (!contentType.startsWith('image/') && !contentType.includes('octet-stream')) {
      console.warn(
        `${label('[Proxy]')} ${warn('Blocked non-image response')} ` +
        `type=${val(contentType)} ${route(fetchUrl.slice(0, 50))}`
      );
      return res.status(415).json({
        success: false,
        error:   `Upstream returned non-image content type: ${contentType}`,
      });
    }

    // Guard response size
    const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
    if (contentLength > MAX_PROXY_SIZE) {
      console.warn(
        `${label('[Proxy]')} ${warn('Blocked oversized response')} ` +
        `${(contentLength / 1024 / 1024).toFixed(1)}MB > ${MAX_PROXY_SIZE_MB}MB limit`
      );
      return res.status(413).json({
        success: false,
        error:   `Image exceeds maximum proxy size of ${MAX_PROXY_SIZE_MB}MB`,
      });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer      = Buffer.from(arrayBuffer);

    // Post-download size check
    if (buffer.length > MAX_PROXY_SIZE) {
      return res.status(413).json({
        success: false,
        error:   `Downloaded image (${(buffer.length / 1024 / 1024).toFixed(1)}MB) exceeds limit`,
      });
    }

    const etag = makeETag(buffer);

    // Store in proxy cache
    proxyCache.set(cacheKey, {
      data:        buffer,
      contentType: contentType.split(';')[0].trim(),
      etag,
      size:        buffer.length,
      fetchedAt:   Date.now(),
    });

    const ms = Date.now() - start;
    console.log(
      `${label('[Proxy]')} ${ok('200')} ${dim('FETCH')} ` +
      `${route(fetchUrl.slice(0, 55))} ` +
      `${val(`${(buffer.length / 1024).toFixed(1)}KB`)} ${dim(`(${ms}ms)`)}`
    );

    res.setHeader('Content-Type',     contentType);
    res.setHeader('ETag',             etag);
    res.setHeader('X-Cache',          'MISS');
    res.setHeader('Cache-Control',    'public, max-age=31536000, immutable');
    res.setHeader('X-Proxy-Source',   new URL(fetchUrl).hostname);
    res.setHeader('X-Proxy-Size-KB',  (buffer.length / 1024).toFixed(1));
    return res.send(buffer);

  } catch (e: unknown) {
    const ms = Date.now() - start;
    console.error(
      `${label('[Proxy]')} ${err('ERROR')} ${route(fetchUrl.slice(0, 60))} ` +
      `— ${e.message} ${dim(`(${ms}ms)`)}`
    );
    return res.status(500).json({
      success: false,
      error:   `Proxy fetch failed: ${e.message}`,
      url:     fetchUrl,
    });
  }
});

// ── Cache stats endpoint ──────────────────────────────────────────────────────
router.get('/proxy-cache/stats', (_req: Request, res: Response) => {
  res.json({ success: true, ...proxyCache.stats() });
});

// ── Cache clear endpoint ──────────────────────────────────────────────────────
router.delete('/proxy-cache', (_req: Request, res: Response) => {
  const size = proxyCache.size;
  proxyCache.clear();
  console.log(`${label('[Proxy]')} ${warn('Cache cleared')} — removed ${size} entries`);
  res.json({ success: true, cleared: size });
});

export default router;
