/**
 * assets/index.ts
 *
 * Unified asset pipeline.
 * AssetManager is the single registry of all imported assets.
 * Consumers request assets via the manager; it delegates to providers.
 *
 * Files:
 *   AssetManager.ts    — Central registry + provider routing
 *   AssetImporter.ts   — Drag-drop / file-picker ingestion
 *   AssetMetadata.ts   — Metadata schema & enrichment
 *   AssetCache.ts      — In-memory / IndexedDB caching
 */

export { AssetManager, assetManager } from "./AssetManager";
export { AssetCache } from "./AssetCache";
