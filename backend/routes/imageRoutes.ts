/**
 * backend/routes/imageRoutes.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Proxying, editing, speech bubbles removing, and ZIP compilation routes for images.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Router } from 'express';
import proxyRouter from './image/proxy.js';
import zipRouter from './image/zip.js';
import editRouter from './image/edit.js';
import mergeRouter from './image/merge.js';
import cleanupRouter from './image/cleanup.js';
import splitRouter from './image/split.js';

const router = Router();

router.use(proxyRouter);
router.use(zipRouter);
router.use(editRouter);
router.use(mergeRouter);
router.use(cleanupRouter);
router.use(splitRouter);

export default router;

