/**
 * backend/server.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Anivox Webtoon-to-Video Compiler — Main HTTP Server Entry Point
 *
 * Features:
 *  • Full ANSI terminal color system (banner, logs, metrics, shutdown)
 *  • Security headers (CSP, X-Frame, X-XSS, Referrer-Policy, Permissions)
 *  • CORS with preflight support + Vary header
 *  • 50MB JSON + URL-encoded body parsing with request body-size logging
 *  • Unique request-ID injection (X-Request-ID)
 *  • Request telemetry (latency, error counters, slow-request warnings)
 *  • Request timeout middleware (configurable, default 30s)
 *  • In-memory rate limiter per IP (sliding 60-second window)
 *  • Maintenance mode toggle via MAINTENANCE_MODE env var
 *  • API version header (X-API-Version)
 *  • /api/metrics — live server + cache stats endpoint
 *  • Periodic memory monitor + cache eviction heartbeat (5 min)
 *  • Colored startup banner + live log formatting
 *  • 404 and global error handlers
 *  • Graceful SIGTERM/SIGINT shutdown with color-coded final stats
 *  • Uncaught exception / unhandled rejection safety nets
 * ─────────────────────────────────────────────────────────────────────────────
 */

import './utils/logInterceptor.js';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import os from 'os';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

import { getAllCacheStats, purgeAllExpired } from './utils/cache.js';

dotenv.config();

// ─────────────────────────────────────────────────────────────────────────────
// ANSI COLOR PALETTE
// ─────────────────────────────────────────────────────────────────────────────
const c = {
  // Resets
  reset:     '\x1b[0m',
  bold:      '\x1b[1m',
  dim:       '\x1b[2m',
  italic:    '\x1b[3m',
  underline: '\x1b[4m',

  // Foreground colors
  black:     '\x1b[30m',
  red:       '\x1b[31m',
  green:     '\x1b[32m',
  yellow:    '\x1b[33m',
  blue:      '\x1b[34m',
  magenta:   '\x1b[35m',
  cyan:      '\x1b[36m',
  white:     '\x1b[37m',
  gray:      '\x1b[90m',

  // Bright foreground
  brightRed:     '\x1b[91m',
  brightGreen:   '\x1b[92m',
  brightYellow:  '\x1b[93m',
  brightBlue:    '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan:    '\x1b[96m',
  brightWhite:   '\x1b[97m',

  // Background
  bgRed:     '\x1b[41m',
  bgGreen:   '\x1b[42m',
  bgYellow:  '\x1b[43m',
  bgBlue:    '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan:    '\x1b[46m',
  bgBlack:   '\x1b[40m',
};

// Shorthand color helpers
const col = {
  success:  (s: string) => `${c.bold}${c.brightGreen}${s}${c.reset}`,
  warn:     (s: string) => `${c.bold}${c.brightYellow}${s}${c.reset}`,
  error:    (s: string) => `${c.bold}${c.brightRed}${s}${c.reset}`,
  info:     (s: string) => `${c.bold}${c.brightCyan}${s}${c.reset}`,
  muted:    (s: string) => `${c.dim}${c.gray}${s}${c.reset}`,
  label:    (s: string) => `${c.bold}${c.brightMagenta}${s}${c.reset}`,
  value:    (s: string) => `${c.brightWhite}${s}${c.reset}`,
  route:    (s: string) => `${c.cyan}${s}${c.reset}`,
  method:   (m: string) => {
    const map: Record<string, string> = {
      GET:    `${c.bold}${c.brightGreen}GET   ${c.reset}`,
      POST:   `${c.bold}${c.brightBlue}POST  ${c.reset}`,
      PUT:    `${c.bold}${c.brightYellow}PUT   ${c.reset}`,
      PATCH:  `${c.bold}${c.yellow}PATCH ${c.reset}`,
      DELETE: `${c.bold}${c.brightRed}DELETE${c.reset}`,
    };
    return map[m] || `${c.white}${m.padEnd(6)}${c.reset}`;
  },
  status: (code: number) => {
    if (code < 300) return `${c.bold}${c.brightGreen}${code}${c.reset}`;
    if (code < 400) return `${c.bold}${c.brightCyan}${code}${c.reset}`;
    if (code < 500) return `${c.bold}${c.brightYellow}${code}${c.reset}`;
    return `${c.bold}${c.brightRed}${code}${c.reset}`;
  },
  latency: (ms: number) => {
    if (ms < 300)   return `${c.green}${ms}ms${c.reset}`;
    if (ms < 1500)  return `${c.yellow}${ms}ms${c.reset}`;
    return `${c.brightRed}${ms}ms${c.reset}`;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE IMPORTS
// ─────────────────────────────────────────────────────────────────────────────
import healthRouter   from './routes/health.js';
import projectsRouter from './routes/projects.js';
import imageRouter    from './routes/imageRoutes.js';
import aiRouter       from './routes/aiRoutes.js';
import scraperRouter  from './routes/scraperRoutes.js';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const app              = express();
const PORT             = parseInt(process.env.PORT             || '5173',  10);
const SLOW_REQ_MS      = parseInt(process.env.SLOW_REQ_MS      || '3000',  10);
const RATE_LIMIT_RPM   = parseInt(process.env.RATE_LIMIT_RPM   || '120',   10);
const REQ_TIMEOUT_MS   = parseInt(process.env.REQ_TIMEOUT_MS   || '30000', 10);
const API_VERSION      = process.env.API_VERSION || '1.0.0';
const MAINTENANCE_MODE = process.env.MAINTENANCE_MODE === 'true';
const SERVER_START     = Date.now();

// ─────────────────────────────────────────────────────────────────────────────
// TELEMETRY STATE
// ─────────────────────────────────────────────────────────────────────────────
let totalRequests  = 0;
let totalErrors    = 0;
let slowRequests   = 0;
let timedOutReqs   = 0;
let peakMemoryMB   = 0;
let totalBytesSent = 0;

const statusCodes: Record<number, number> = {};
const routeHits:   Record<string, number> = {};
const methodHits:  Record<string, number> = {};

// ─────────────────────────────────────────────────────────────────────────────
// RATE LIMITER — sliding 60-second window, per IP
// ─────────────────────────────────────────────────────────────────────────────
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
  const ip    = req.ip || req.socket.remoteAddress || 'unknown';
  const now   = Date.now();
  const entry = rateBuckets.get(ip);

  if (!entry || now > entry.resetAt) {
    rateBuckets.set(ip, { count: 1, resetAt: now + 60_000 });
    return next();
  }
  entry.count++;

  // Attach remaining quota headers
  res.setHeader('X-RateLimit-Limit',     String(RATE_LIMIT_RPM));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(0, RATE_LIMIT_RPM - entry.count)));
  res.setHeader('X-RateLimit-Reset',     String(Math.ceil(entry.resetAt / 1000)));

  if (entry.count > RATE_LIMIT_RPM) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    console.warn(
      `${col.warn('[RateLimit]')} ${col.error('BLOCKED')} IP ${c.yellow}${ip}${c.reset} ` +
      `(${entry.count} req in window) → retry in ${retryAfter}s`
    );
    res.setHeader('Retry-After', String(retryAfter));
    res.status(429).json({
      success: false,
      error: `Rate limit exceeded. Max ${RATE_LIMIT_RPM} requests/minute per IP.`,
      retryAfterSeconds: retryAfter,
    });
    return;
  }
  next();
}

// ─────────────────────────────────────────────────────────────────────────────
// MIDDLEWARE STACK
// ─────────────────────────────────────────────────────────────────────────────

// 1. Maintenance mode — blocks all requests with a 503
app.use((_req: Request, res: Response, next: NextFunction) => {
  if (!MAINTENANCE_MODE) return next();
  res.status(503).json({
    success: false,
    error:   'Server is under maintenance. Please try again later.',
    retryAfterMinutes: 5,
  });
});

// 2. Security headers
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options',        'SAMEORIGIN');
  res.setHeader('X-XSS-Protection',       '1; mode=block');
  res.setHeader('Referrer-Policy',        'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy',     'camera=(), microphone=(), geolocation=()');
  res.setHeader('X-API-Version',          API_VERSION);
  res.removeHeader('X-Powered-By');
  next();
});

// 3. CORS
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin',   origin);
  res.setHeader('Access-Control-Allow-Methods',  'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers',  'Content-Type, Authorization, X-Request-ID');
  res.setHeader('Access-Control-Expose-Headers', 'X-Request-ID, X-Response-Time, X-API-Version, X-RateLimit-Remaining');
  res.setHeader('Vary', 'Origin');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// 4. Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 5. Unique Request ID
app.use((req: Request, res: Response, next: NextFunction) => {
  const id = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  (req as any).requestId = id;
  res.setHeader('X-Request-ID', id);
  next();
});

// 6. Request timeout — responds with 408 if handler takes too long
app.use((req: Request, res: Response, next: NextFunction) => {
  const timer = setTimeout(() => {
    timedOutReqs++;
    const id = (req as any).requestId?.slice(0, 8) || '--------';
    console.error(
      `${col.error('[Timeout]')} [${id}] ${req.method} ${req.originalUrl} ` +
      `exceeded ${REQ_TIMEOUT_MS}ms`
    );
    if (!res.headersSent) {
      res.status(408).json({
        success: false,
        error:   `Request timeout after ${REQ_TIMEOUT_MS}ms`,
        requestId: (req as any).requestId,
      });
    }
  }, REQ_TIMEOUT_MS);

  res.on('finish',  () => clearTimeout(timer));
  res.on('close',   () => clearTimeout(timer));
  next();
});

// 7. Rate limiter — API routes only
app.use('/api', rateLimitMiddleware);

// 8. Request telemetry — full color-coded logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start   = Date.now();
  const bodyLen = parseInt(req.headers['content-length'] || '0', 10);
  totalRequests++;
  methodHits[req.method] = (methodHits[req.method] || 0) + 1;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const code     = res.statusCode;
    const isError  = code >= 400;
    const isSlow   = duration > SLOW_REQ_MS;
    const resLen   = parseInt(res.getHeader('content-length') as string || '0', 10);

    if (isError)  totalErrors++;
    if (isSlow)   slowRequests++;
    totalBytesSent += resLen;

    statusCodes[code] = (statusCodes[code] || 0) + 1;
    const routeKey    = `${req.method} ${req.path.replace(/\/[0-9a-f-]{8,}/gi, '/:id')}`;
    routeHits[routeKey] = (routeHits[routeKey] || 0) + 1;

    // Skip SSE/polling spam
    if (req.originalUrl.includes('/system-logs')) return;

    const id   = `${c.dim}[${((req as any).requestId || '').slice(0, 8)}]${c.reset}`;
    const slow = isSlow ? ` ${col.warn(`⚠ SLOW`)}` : '';
    const size = bodyLen > 0
      ? ` ${c.dim}↑${(bodyLen / 1024).toFixed(1)}KB${c.reset}`
      : '';
    const resSz = resLen > 0
      ? ` ${c.dim}↓${(resLen / 1024).toFixed(1)}KB${c.reset}`
      : '';

    console.log(
      `${col.info('[API]')} ${id} ${col.method(req.method)} ` +
      `${col.route(req.originalUrl.padEnd(46))} ` +
      `${col.status(code)} ${col.latency(duration)}${size}${resSz}${slow}`
    );
  });

  next();
});

// ─────────────────────────────────────────────────────────────────────────────
// LIVE METRICS ENDPOINT
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/metrics', (_req: Request, res: Response) => {
  const mem    = process.memoryUsage();
  const heapMB = Math.round(mem.heapUsed  / 1024 / 1024);
  const rssMB  = Math.round(mem.rss       / 1024 / 1024);
  if (heapMB > peakMemoryMB) peakMemoryMB = heapMB;

  const uptimeSec = Math.floor((Date.now() - SERVER_START) / 1000);
  const h = Math.floor(uptimeSec / 3600);
  const m = Math.floor((uptimeSec % 3600) / 60);
  const s = uptimeSec % 60;

  res.json({
    server: {
      uptime:            `${h}h ${m}m ${s}s`,
      uptimeSeconds:     uptimeSec,
      startedAt:         new Date(SERVER_START).toISOString(),
      apiVersion:        API_VERSION,
      nodeVersion:       process.version,
      platform:          `${os.type()} ${os.arch()}`,
      cpuCount:          os.cpus().length,
      cpuModel:          os.cpus()[0]?.model || 'unknown',
      env:               process.env.NODE_ENV || 'development',
      maintenanceMode:   MAINTENANCE_MODE,
    },
    requests: {
      total:             totalRequests,
      errors:            totalErrors,
      slow:              slowRequests,
      timedOut:          timedOutReqs,
      totalMBSent:       (totalBytesSent / 1024 / 1024).toFixed(2),
      errorRate:         totalRequests > 0
        ? ((totalErrors / totalRequests) * 100).toFixed(2) + '%'
        : '0.00%',
      byMethod:          methodHits,
      byStatusCode:      statusCodes,
      topRoutes:         Object.entries(routeHits)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 15)
        .map(([route, count]) => ({ route, count })),
    },
    memory: {
      heapUsedMB:        heapMB,
      heapTotalMB:       Math.round(mem.heapTotal / 1024 / 1024),
      rssMB,
      externalMB:        Math.round(mem.external  / 1024 / 1024),
      arrayBuffersMB:    Math.round((mem.arrayBuffers || 0) / 1024 / 1024),
      peakHeapMB:        peakMemoryMB,
      systemFreeMB:      Math.round(os.freemem()  / 1024 / 1024),
      systemTotalMB:     Math.round(os.totalmem() / 1024 / 1024),
      systemUsedPct:     (((os.totalmem() - os.freemem()) / os.totalmem()) * 100).toFixed(1) + '%',
    },
    config: {
      port:              PORT,
      slowReqThresholdMs: SLOW_REQ_MS,
      reqTimeoutMs:      REQ_TIMEOUT_MS,
      maxRPM:            RATE_LIMIT_RPM,
    },
    rateLimit: {
      maxRPM:            RATE_LIMIT_RPM,
      trackedIPs:        rateBuckets.size,
    },
    cache:               getAllCacheStats(),
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// API ROUTES REGISTRY
// ─────────────────────────────────────────────────────────────────────────────
app.use('/api',          healthRouter);
app.use('/api/projects', projectsRouter);
app.use('/api',          imageRouter);
app.use('/api',          aiRouter);
app.use('/api',          scraperRouter);

// Convenience root route: redirect browser root to the health endpoint
app.get('/', (_req: Request, res: Response) => {
  return res.redirect('/api/health');
});

// ─────────────────────────────────────────────────────────────────────────────
// 404 HANDLER
// ─────────────────────────────────────────────────────────────────────────────
app.use('/api/*', (req: Request, res: Response) => {
  res.status(404).json({
    success:   false,
    error:     `Route not found: ${req.method} ${req.originalUrl}`,
    hint:      'Check GET /api/health for available endpoints.',
    requestId: (req as any).requestId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL ERROR HANDLER
// ─────────────────────────────────────────────────────────────────────────────
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  const id = (req as any).requestId?.slice(0, 8) || '--------';
  console.error(
    `${col.error('[Error]')} ${c.dim}[${id}]${c.reset} ` +
    `${col.error(err.message || String(err))}`
  );
  if (err.stack) console.error(c.dim + err.stack + c.reset);
  res.status(err.status || 500).json({
    success:   false,
    error:     err.message || 'Internal Server Error',
    requestId: (req as any).requestId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// STARTUP BANNER — full color
// ─────────────────────────────────────────────────────────────────────────────
function printStartupBanner(mode: string, port: number) {
  const cpus     = os.cpus().length;
  const cpuModel = os.cpus()[0]?.model.split(' ').slice(0, 4).join(' ') || 'unknown';
  const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(1);
  const freeMem  = (os.freemem()  / 1024 / 1024 / 1024).toFixed(1);
  const nodeVer  = process.version;
  const platform = `${os.type()} ${os.arch()}`;
  const gemini   = process.env.GEMINI_API_KEY
    ? `${c.brightGreen}✅ Set${c.reset}`
    : `${c.brightRed}❌ Not set — AI disabled${c.reset}`;
  const maint    = MAINTENANCE_MODE
    ? `${c.brightRed}⚠  MAINTENANCE MODE ACTIVE${c.reset}`
    : `${c.brightGreen}✅ Online${c.reset}`;

  const B  = c.bold;
  const M  = c.brightMagenta;
  const CY = c.brightCyan;
  const W  = c.brightWhite;
  const G  = c.gray;
  const DIM = c.dim;
  const R  = c.reset;

  console.log(`
${B}${M}╔══════════════════════════════════════════════════════════════════╗${R}
${B}${M}║  ${c.brightYellow}🎬  ANIVOX WEBTOON-TO-VIDEO COMPILER ${M}— BACKEND SERVER v${API_VERSION}  ${M}║${R}
${B}${M}╠══════════════════════════════════════════════════════════════════╣${R}
${B}${M}║${R}  ${CY}Mode:${R}       ${W}${mode.padEnd(49)}${R}${B}${M}║${R}
${B}${M}║${R}  ${CY}Port:${R}       ${W}${String(port).padEnd(49)}${R}${B}${M}║${R}
${B}${M}║${R}  ${CY}Node.js:${R}    ${W}${nodeVer.padEnd(49)}${R}${B}${M}║${R}
${B}${M}║${R}  ${CY}Platform:${R}   ${W}${platform.padEnd(49)}${R}${B}${M}║${R}
${B}${M}║${R}  ${CY}CPU:${R}        ${W}${(cpuModel + ` (${cpus} cores)`).padEnd(49)}${R}${B}${M}║${R}
${B}${M}║${R}  ${CY}Memory:${R}     ${W}${(freeMem + ' GB free / ' + totalMem + ' GB total').padEnd(49)}${R}${B}${M}║${R}
${B}${M}║${R}  ${CY}Status:${R}     ${maint}${' '.repeat(Math.max(0, 49 - (MAINTENANCE_MODE ? 26 : 8)))}${B}${M}║${R}
${B}${M}╠══════════════════════════════════════════════════════════════════╣${R}
${B}${M}║${R}  ${B}${c.brightYellow}Route Groups:${R}                                                   ${B}${M}║${R}
${B}${M}║${R}  ${G}GET ${R} ${CY}/api/health${R}              ${DIM}→ Liveness probe + DB stats${R}     ${B}${M}║${R}
${B}${M}║${R}  ${G}GET ${R} ${CY}/api/system-logs${R}         ${DIM}→ SSE real-time log stream${R}      ${B}${M}║${R}
${B}${M}║${R}  ${G}GET ${R} ${CY}/api/metrics${R}             ${DIM}→ Live server & cache metrics${R}   ${B}${M}║${R}
${B}${M}║${R}  ${G}CRUD${R} ${CY}/api/projects${R}            ${DIM}→ Project + panel operations${R}    ${B}${M}║${R}
${B}${M}║${R}  ${G}POST${R} ${CY}/api/proxy-image${R}         ${DIM}→ Referrer-bypass image proxy${R}   ${B}${M}║${R}
${B}${M}║${R}  ${G}POST${R} ${CY}/api/edit-image${R}          ${DIM}→ Crop, rotate, flip pipeline${R}   ${B}${M}║${R}
${B}${M}║${R}  ${G}POST${R} ${CY}/api/merge-images${R}        ${DIM}→ Multi-panel canvas stitching${R}  ${B}${M}║${R}
${B}${M}║${R}  ${G}GET ${R} ${CY}/api/download-zip${R}        ${DIM}→ ZIP archive compilation${R}       ${B}${M}║${R}
${B}${M}║${R}  ${G}POST${R} ${CY}/api/remove-speech-bubbles${R} ${DIM}→ OpenCV + Gemini eraser${R}     ${B}${M}║${R}
${B}${M}║${R}  ${G}POST${R} ${CY}/api/analyze-image${R}       ${DIM}→ Gemini AI panel description${R}  ${B}${M}║${R}
${B}${M}║${R}  ${G}POST${R} ${CY}/api/ai-smart-crop${R}       ${DIM}→ AI bounding-box auto-crop${R}    ${B}${M}║${R}
${B}${M}║${R}  ${G}POST${R} ${CY}/api/convert-images-to-video${R} ${DIM}→ FFmpeg cinematic output${R} ${B}${M}║${R}
${B}${M}║${R}  ${G}POST${R} ${CY}/api/scrape-images${R}       ${DIM}→ Webtoon / Manhwa scraper${R}     ${B}${M}║${R}
${B}${M}║${R}  ${G}POST${R} ${CY}/api/generate${R}            ${DIM}→ Storyboard narrative engine${R}  ${B}${M}║${R}
${B}${M}╠══════════════════════════════════════════════════════════════════╣${R}
${B}${M}║${R}  ${B}${c.brightYellow}Config:${R}                                                         ${B}${M}║${R}
${B}${M}║${R}  ${CY}NODE_ENV:${R}         ${W}${(process.env.NODE_ENV || 'development').padEnd(43)}${R}${B}${M}║${R}
${B}${M}║${R}  ${CY}GEMINI_API_KEY:${R}   ${gemini}${' '.repeat(Math.max(0, 43 - (process.env.GEMINI_API_KEY ? 5 : 24)))}${B}${M}║${R}
${B}${M}║${R}  ${CY}Rate Limit:${R}       ${W}${(RATE_LIMIT_RPM + ' req/min per IP').padEnd(43)}${R}${B}${M}║${R}
${B}${M}║${R}  ${CY}Slow Req Threshold:${R}${W}${(SLOW_REQ_MS + 'ms').padEnd(43)}${R}${B}${M}║${R}
${B}${M}║${R}  ${CY}Request Timeout:${R}  ${W}${(REQ_TIMEOUT_MS + 'ms').padEnd(43)}${R}${B}${M}║${R}
${B}${M}╚══════════════════════════════════════════════════════════════════╝${R}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// MEMORY MONITOR — every 5 minutes, color-coded by pressure
// ─────────────────────────────────────────────────────────────────────────────
function startMemoryMonitor() {
  const INTERVAL_MS  = 5 * 60 * 1000;
  const WARN_MB      = 512;
  const CRITICAL_MB  = 1024;

  setInterval(() => {
    const mem    = process.memoryUsage();
    const heapMB = Math.round(mem.heapUsed / 1024 / 1024);
    const rssMB  = Math.round(mem.rss / 1024 / 1024);
    if (heapMB > peakMemoryMB) peakMemoryMB = heapMB;

    const heapCol = heapMB > CRITICAL_MB
      ? col.error(`${heapMB}MB`)
      : heapMB > WARN_MB
        ? col.warn(`${heapMB}MB`)
        : col.success(`${heapMB}MB`);

    const uptimeSec = Math.floor((Date.now() - SERVER_START) / 1000);
    const h = Math.floor(uptimeSec / 3600);
    const m = Math.floor((uptimeSec % 3600) / 60);

    console.log(
      `${col.label('[Monitor]')} ` +
      `Heap: ${heapCol} used | ` +
      `RSS: ${col.value(rssMB + 'MB')} | ` +
      `Peak: ${col.value(peakMemoryMB + 'MB')} | ` +
      `Uptime: ${col.value(`${h}h ${m}m`)} | ` +
      `Reqs: ${col.success(String(totalRequests))} | ` +
      `Errs: ${totalErrors > 0 ? col.error(String(totalErrors)) : col.muted('0')} | ` +
      `Slow: ${slowRequests > 0 ? col.warn(String(slowRequests)) : col.muted('0')} | ` +
      `Timeouts: ${timedOutReqs > 0 ? col.error(String(timedOutReqs)) : col.muted('0')}`
    );

    // Purge expired cache entries
    purgeAllExpired();

    // Clean up stale rate-limit buckets
    const now = Date.now();
    let prunedIPs = 0;
    for (const [ip, bucket] of rateBuckets) {
      if (now > bucket.resetAt) { rateBuckets.delete(ip); prunedIPs++; }
    }
    if (prunedIPs > 0) {
      console.log(`${col.muted(`[Monitor] Pruned ${prunedIPs} stale rate-limit buckets`)}`);
    }
  }, INTERVAL_MS);
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVER BOOT
// ─────────────────────────────────────────────────────────────────────────────
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  const isStandalone = process.env.STANDALONE_SERVER === 'true';

  if (isProduction) {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      maxAge: '7d',
      etag:   true,
      setHeaders(res, filePath) {
        if (filePath.endsWith('index.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
      },
    }));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });

  } else if (!isStandalone) {
    console.log(`${col.info('[Server]')} 🔄 Mounting ${col.value('Vite')} dev middleware...`);
    const vite = await createViteServer({
      configFile: path.resolve(process.cwd(), 'frontend', 'vite.config.ts'),
      root:       path.resolve(process.cwd(), 'frontend'),
      server:     { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType:    'spa',
    });
    app.use(vite.middlewares);
  }

  const mode = isProduction
    ? 'Production (static SPA)'
    : isStandalone
      ? 'Standalone API'
      : 'Full-stack Dev (Vite HMR)';

  const server = app.listen(PORT, '0.0.0.0', () => {
    printStartupBanner(mode, PORT);
    console.log(
      `\n${col.success('[Server]')} ✨ Ready at ` +
      `${c.bold}${c.underline}${c.brightCyan}http://localhost:${PORT}${c.reset}`
    );
    console.log(
      `${col.info('[Server]')} 📈 Metrics  → ` +
      `${c.brightCyan}http://localhost:${PORT}/api/metrics${c.reset}`
    );
    console.log(
      `${col.info('[Server]')} ❤️  Health   → ` +
      `${c.brightCyan}http://localhost:${PORT}/api/health${c.reset}\n`
    );
    startMemoryMonitor();
  });

  server.keepAliveTimeout = 65_000;
  server.headersTimeout   = 70_000;

  // ── Graceful shutdown ─────────────────────────────────────────────────────
  const shutdown = (signal: string) => {
    const uptimeSec = Math.floor((Date.now() - SERVER_START) / 1000);
    const h = Math.floor(uptimeSec / 3600);
    const m = Math.floor((uptimeSec % 3600) / 60);
    const s = uptimeSec % 60;

    console.log(`\n${col.warn('[Server]')} 🛑 ${col.warn(signal)} received — shutting down gracefully...`);
    console.log(
      `${col.label('[Stats]')}  ` +
      `Uptime: ${col.value(`${h}h ${m}m ${s}s`)} | ` +
      `Requests: ${col.success(String(totalRequests))} | ` +
      `Errors: ${col.error(String(totalErrors))} | ` +
      `Slow: ${col.warn(String(slowRequests))} | ` +
      `Timeouts: ${col.error(String(timedOutReqs))} | ` +
      `Peak Heap: ${col.value(peakMemoryMB + 'MB')} | ` +
      `Data Sent: ${col.value((totalBytesSent / 1024 / 1024).toFixed(1) + 'MB')}`
    );

    server.close(() => {
      console.log(`${col.success('[Server]')} ✅ HTTP server closed cleanly. ${c.dim}Goodbye!${c.reset}\n`);
      process.exit(0);
    });

    setTimeout(() => {
      console.error(`${col.error('[Server]')} ⚠️  Graceful shutdown timed out — forcing exit.`);
      process.exit(1);
    }, 8_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));

  process.on('uncaughtException', (err: Error) => {
    console.error(`${col.error('[Server]')} ❌ Uncaught Exception: ${col.error(err.message)}`);
    console.error(c.dim + (err.stack || '') + c.reset);
  });

  process.on('unhandledRejection', (reason: unknown) => {
    const msg = reason instanceof Error ? reason.message : String(reason);
    console.error(`${col.error('[Server]')} ❌ Unhandled Promise Rejection: ${col.error(msg)}`);
  });
}

startServer();
