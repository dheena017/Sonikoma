/**
 * backend/utils/cache.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Shared memory caches for images, edit history, and generated zip files.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const stitchedCache = new Map<string, { data: Buffer; contentType: string }>();
export const editHistory = new Map<string, string>();
export const zipCache = new Map<string, Buffer>();
