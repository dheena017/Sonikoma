/**
 * backend/routes/scraperRoutes.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Webtoon page scraping, dynamic storyboard generation, and process URL routes.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Router } from "express";
import scrapeRouter from "./scraper/scrape.js";
import generateRouter from "./scraper/generate.js";
import processRouter from "./scraper/process.js";

const router = Router();

router.use(scrapeRouter);
router.use(generateRouter);
router.use(processRouter);

export default router;
