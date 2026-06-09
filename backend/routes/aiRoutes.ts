/**
 * backend/routes/aiRoutes.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * AI smart cropping, panel analysis, and video compilation routes using Gemini.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Router } from "express";
import cropRouter from "./ai/crop.js";
import analyzeRouter from "./ai/analyze.js";
import videoRouter from "./ai/video.js";

const router = Router();

router.use(cropRouter);
router.use(analyzeRouter);
router.use(videoRouter);

export default router;
