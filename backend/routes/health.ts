/**
 * backend/routes/health.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Liveliness probe API route.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Router } from 'express';
import { getDbStats } from '../database/db.js';

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

export default router;
