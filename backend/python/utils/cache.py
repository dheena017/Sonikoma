"""
backend/python/utils/cache.py
─────────────────────────────────────────────────────────────────────────────
Shared in-memory caches with TTL eviction, hit/miss tracking, and stats.
─────────────────────────────────────────────────────────────────────────────
"""

import time
from typing import Dict, Any, Optional, TypeVar, Generic

T = TypeVar('T')

class CacheEntry(Generic[T]):
    def __init__(self, value: T, expires_at: Optional[float] = None):
        self.value = value
        self.expires_at = expires_at  # timestamp in seconds (float), None = never expires
        self.created_at = time.time()

class CacheStore(Generic[T]):
    def __init__(self, name: str, default_ttl_sec: Optional[float] = None, max_size: int = 200):
        self.name = name
        self.default_ttl_sec = default_ttl_sec
        self.max_size = max_size
        self.store: Dict[str, CacheEntry[T]] = {}
        self.hits = 0
        self.misses = 0
        self.evictions = 0

    def set(self, key: str, value: T, ttl_sec: Optional[float] = None) -> None:
        # Evict oldest entry if at capacity (dict keeps insertion order in Python 3.7+)
        if len(self.store) >= self.max_size:
            oldest_key = next(iter(self.store.keys()), None)
            if oldest_key is not None:
                self.store.pop(oldest_key, None)
                self.evictions += 1

        ttl = ttl_sec if ttl_sec is not None else self.default_ttl_sec
        expires_at = time.time() + ttl if ttl is not None else None
        self.store[key] = CacheEntry(value, expires_at)

    def get(self, key: str) -> Optional[T]:
        entry = self.store.get(key)
        if not entry:
            self.misses += 1
            return None

        # Check TTL expiration
        if entry.expires_at is not None and time.time() > entry.expires_at:
            self.store.pop(key, None)
            self.evictions += 1
            self.misses += 1
            return None

        self.hits += 1
        return entry.value

    def has(self, key: str) -> bool:
        # Re-use get() to handle expiration check correctly
        return self.get(key) is not None

    def delete(self, key: str) -> bool:
        if key in self.store:
            self.store.pop(key)
            return True
        return False

    def clear(self) -> None:
        self.store.clear()

    @property
    def size(self) -> int:
        return len(self.store)

    def purge_expired(self) -> int:
        purged = 0
        now = time.time()
        # Find keys to delete
        expired_keys = [
            k for k, entry in self.store.items()
            if entry.expires_at is not None and now > entry.expires_at
        ]
        for k in expired_keys:
            self.store.pop(k, None)
            self.evictions += 1
            purged += 1
        return purged

    def stats(self) -> Dict[str, Any]:
        total = self.hits + self.misses
        hit_rate = f"{((self.hits / total) * 100):.1f}%" if total > 0 else "N/A"
        return {
            "name": self.name,
            "size": len(self.store),
            "maxSize": self.max_size,
            "hits": self.hits,
            "misses": self.misses,
            "evictions": self.evictions,
            "hitRate": hit_rate
        }


# ─── Shared application caches ───────────────────────────────────────────────

# Merged/stitched image cache — entries expire after 4 hours
stitched_cache = CacheStore[Dict[str, Any]](
    name='stitchedCache', default_ttl_sec=4 * 60 * 60, max_size=200
)

# Per-panel edit history — entries expire after 1 hour (stores previous URLs)
edit_history = CacheStore[str](
    name='editHistory', default_ttl_sec=60 * 60, max_size=500
)

# Generated ZIP file cache — entries expire after 20 minutes
zip_cache = CacheStore[bytes](
    name='zipFiles', default_ttl_sec=20 * 60, max_size=50
)

# Proxy image cache — entries expire after 30 minutes
# Store items: Dict containing {"data": bytes, "content_type": str, "etag": str, "size": int, "fetched_at": float}
proxy_cache = CacheStore[Dict[str, Any]](
    name='proxyImages', default_ttl_sec=30 * 60, max_size=300
)


def get_all_cache_stats() -> Dict[str, Any]:
    return {
        "stitchedCache": stitched_cache.stats(),
        "editHistory": edit_history.stats(),
        "zipFiles": zip_cache.stats(),
        "proxyImages": proxy_cache.stats()
    }


def purge_all_expired() -> None:
    m = stitched_cache.purge_expired()
    e = edit_history.purge_expired()
    z = zip_cache.purge_expired()
    p = proxy_cache.purge_expired()
    total = m + e + z + p
    if total > 0:
        print(f"[Cache] ♻️  Purged {total} expired entries (merged:{m} edits:{e} zips:{z} proxy:{p})")
