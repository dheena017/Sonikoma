/**
 * backend/routes/health.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Liveliness probe API route & System Log Streaming routes.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Router } from 'express';
import { getDbStats } from '../database/db.js';
import { getLogs, addLogListener, removeLogListener } from '../utils/logInterceptor.js';

const router = Router();

// API Liveliness probe — returns DB stats from local SQLite
router.get("/health", (req, res) => {
  try {
    const stats = getDbStats();
    res.json({
      status: "ok",
      service: "Webtoon-to-Video API",
      database: "connected",
      db_type: "SQLite (local)",
      db_stats: stats
    });
  } catch (err) {
    res.json({ status: "ok", service: "Webtoon-to-Video API", database: "error" });
  }
});

// JSON polling endpoint for server console logs
router.get("/system-logs", (req, res) => {
  try {
    const since = parseInt(req.query.since as string || '0', 10);
    const logs = getLogs(since);
    res.json({ success: true, logs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Server-Sent Events (SSE) stream endpoint for live server console logs
router.get("/system-logs/stream", (req, res) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering in proxy servers like Nginx
  
  res.flushHeaders();

  // Send current log history to align client state immediately
  const history = getLogs(0);
  for (const entry of history) {
    res.write(`data: ${JSON.stringify(entry)}\n\n`);
  }

  // Listener to stream logs as they occur
  const listener = (entry: any) => {
    res.write(`data: ${JSON.stringify(entry)}\n\n`);
  };

  addLogListener(listener);

  // Send a periodic keep-alive comment to keep connection alive
  const pingInterval = setInterval(() => {
    res.write(': ping\n\n');
  }, 15000);

  // Clean up on disconnect
  req.on('close', () => {
    clearInterval(pingInterval);
    removeLogListener(listener);
    res.end();
  });
});

export default router;

