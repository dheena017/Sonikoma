/**
 * backend/utils/cache.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Shared in-memory caches with TTL eviction, hit/miss tracking, and stats.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Generic TTL-aware cache store ───────────────────────────────────────────

interface CacheEntry<T> {
  value: T;
  expiresAt: number | null; // null = never expires
  createdAt: number;
}

export class CacheStore<T> {
  private store = new Map<string, CacheEntry<T>>();
  private hits = 0;
  private misses = 0;
  private evictions = 0;
  readonly name: string;
  readonly defaultTtlMs: number | null;
  readonly maxSize: number;

  constructor(name: string, defaultTtlMs: number | null = null, maxSize = 200) {
    this.name = name;
    this.defaultTtlMs = defaultTtlMs;
    this.maxSize = maxSize;
  }

  /** Store an item with optional TTL override (ms). */
  set(key: string, value: T, ttlMs?: number): void {
    // Evict oldest entry if at capacity
    if (this.store.size >= this.maxSize) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) {
        this.store.delete(oldestKey);
        this.evictions++;
      }
    }
    const ttl = ttlMs !== undefined ? ttlMs : this.defaultTtlMs;
    this.store.set(key, {
      value,
      expiresAt: ttl !== null ? Date.now() + ttl : null,
      createdAt: Date.now(),
    });
  }

  /** Retrieve an item, returning undefined if missing or expired. */
  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return undefined;
    }
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.evictions++;
      this.misses++;
      return undefined;
    }
    this.hits++;
    return entry.value;
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }

  /** Evict all entries past their TTL. */
  purgeExpired(): number {
    let purged = 0;
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (entry.expiresAt !== null && now > entry.expiresAt) {
        this.store.delete(key);
        this.evictions++;
        purged++;
      }
    }
    return purged;
  }

  stats() {
    return {
      name: this.name,
      size: this.store.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      hitRate:
        this.hits + this.misses > 0
          ? ((this.hits / (this.hits + this.misses)) * 100).toFixed(1) + "%"
          : "N/A",
    };
  }
}

// ─── Shared application caches ───────────────────────────────────────────────

/** Merged/stitched image cache — entries expire after 4 hours (increased from 30m to prevent 404s in long sessions) */
export const stitchedCache = new CacheStore<{
  data: Buffer;
  contentType: string;
}>("stitchedCache", 4 * 60 * 60 * 1000, 200);

/** Per-panel base64 edit history — entries expire after 1 hour */
export const editHistory = new CacheStore<string>(
  "editHistory",
  60 * 60 * 1000,
  500
);

/** Generated ZIP file cache — entries expire after 20 minutes */
export const zipCache = new CacheStore<Buffer>("zipFiles", 20 * 60 * 1000, 50);

// ─── Global stats snapshot ───────────────────────────────────────────────────

export function getAllCacheStats() {
  return {
    stitchedCache: stitchedCache.stats(),
    editHistory: editHistory.stats(),
    zipFiles: zipCache.stats(),
  };
}

/** Run expired-entry purge across all caches. */
export function purgeAllExpired(): void {
  const m = stitchedCache.purgeExpired();
  const e = editHistory.purgeExpired();
  const z = zipCache.purgeExpired();
  if (m + e + z > 0) {
    console.log(
      `[Cache] ♻️  Purged ${
        m + e + z
      } expired entries (merged:${m} edits:${e} zips:${z})`
    );
  }
}
