"""
backend/python/utils/cache.py
─────────────────────────────────────────────────────────────────────────────
Shared in-memory caches with TTL eviction, hit/miss tracking, and stats.
─────────────────────────────────────────────────────────────────────────────
"""

import time
import os
import json
import tempfile
import shutil
from typing import Dict, Any, Optional, TypeVar, Generic

T = TypeVar('T')

# Stable persistent directory for image caches — lives next to the SQLite DB
# so it survives server restarts (unlike tempfile.gettempdir() which Windows may clear)
_BACKEND_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PERSISTENT_CACHE_DIR = os.path.join(_BACKEND_ROOT, 'database', 'image_cache')


class CacheEntry(Generic[T]):
    def __init__(self, value: T, expires_at: Optional[float] = None):
        self.value = value
        self.expires_at = expires_at  # timestamp in seconds (float), None = never expires
        self.created_at = time.time()


class CacheStore(Generic[T]):
    def __init__(self, name: str, default_ttl_sec: Optional[float] = None,
                 max_size: int = 200, persistent: bool = False):
        self.name = name
        self.default_ttl_sec = default_ttl_sec
        self.max_size = max_size
        self.store: Dict[str, CacheEntry[T]] = {}
        self.hits = 0
        self.misses = 0
        self.evictions = 0
        # persistent=True uses the stable project dir; False uses the OS temp dir
        if persistent:
            self.disk_dir = os.path.join(PERSISTENT_CACHE_DIR, name)
        else:
            self.disk_dir = os.path.join(tempfile.gettempdir(), "anivox_disk_cache", name)

    def _write_to_disk(self, key: str, value: Any) -> None:
        try:
            os.makedirs(self.disk_dir, exist_ok=True)
            if isinstance(value, bytes):
                with open(os.path.join(self.disk_dir, f"{key}.bin"), "wb") as f:
                    f.write(value)
            elif isinstance(value, dict) and "data" in value and isinstance(value["data"], bytes):
                # Save image bytes
                with open(os.path.join(self.disk_dir, f"{key}.bin"), "wb") as f:
                    f.write(value["data"])
                # Save metadata (content_type, etc.) separately
                meta = {k: v for k, v in value.items() if k != "data"}
                with open(os.path.join(self.disk_dir, f"{key}.json"), "w", encoding="utf-8") as f:
                    json.dump(meta, f)
        except Exception:
            pass

    def _read_from_disk(self, key: str) -> Optional[Any]:
        try:
            bin_path = os.path.join(self.disk_dir, f"{key}.bin")
            json_path = os.path.join(self.disk_dir, f"{key}.json")
            if os.path.exists(bin_path):
                with open(bin_path, "rb") as f:
                    data = f.read()
                if os.path.exists(json_path):
                    with open(json_path, "r", encoding="utf-8") as f:
                        meta = json.load(f)
                    meta["data"] = data
                    return meta
                return data
        except Exception:
            pass
        return None

    def warm_up(self) -> int:
        """
        Bulk-load all existing disk cache entries into memory on startup.
        Prevents 404s after server restarts when panel image URLs still point
        to cache IDs that are no longer in memory.
        Returns the number of entries loaded.
        """
        loaded = 0
        if not os.path.exists(self.disk_dir):
            return 0
        try:
            for fname in os.listdir(self.disk_dir):
                if fname.endswith(".bin"):
                    key = fname[:-4]  # strip .bin extension
                    if key not in self.store:
                        val = self._read_from_disk(key)
                        if val is not None:
                            self.store[key] = CacheEntry(val, expires_at=None)
                            loaded += 1
        except Exception:
            pass
        return loaded

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
        self._write_to_disk(key, value)

    def get(self, key: str) -> Optional[T]:
        entry = self.store.get(key)
        if not entry:
            disk_val = self._read_from_disk(key)
            if disk_val is not None:
                ttl = self.default_ttl_sec
                expires_at = time.time() + ttl if ttl is not None else None
                self.store[key] = CacheEntry(disk_val, expires_at)
                self.hits += 1
                return disk_val
            self.misses += 1
            return None

        # Check TTL expiration
        if entry.expires_at is not None and time.time() > entry.expires_at:
            self.store.pop(key, None)
            try:
                bin_path = os.path.join(self.disk_dir, f"{key}.bin")
                json_path = os.path.join(self.disk_dir, f"{key}.json")
                if os.path.exists(bin_path):
                    os.remove(bin_path)
                if os.path.exists(json_path):
                    os.remove(json_path)
            except Exception:
                pass
            self.evictions += 1
            self.misses += 1
            return None

        self.hits += 1
        return entry.value

    def has(self, key: str) -> bool:
        return self.get(key) is not None

    def delete(self, key: str) -> bool:
        on_disk = False
        try:
            bin_path = os.path.join(self.disk_dir, f"{key}.bin")
            json_path = os.path.join(self.disk_dir, f"{key}.json")
            if os.path.exists(bin_path):
                os.remove(bin_path)
                on_disk = True
            if os.path.exists(json_path):
                os.remove(json_path)
                on_disk = True
        except Exception:
            pass

        if key in self.store:
            self.store.pop(key)
            return True
        return on_disk

    def clear(self) -> None:
        self.store.clear()
        try:
            if os.path.exists(self.disk_dir):
                shutil.rmtree(self.disk_dir, ignore_errors=True)
        except Exception:
            pass

    @property
    def size(self) -> int:
        return len(self.store)

    def purge_expired(self) -> int:
        purged = 0
        now = time.time()
        expired_keys = [
            k for k, entry in self.store.items()
            if entry.expires_at is not None and now > entry.expires_at
        ]
        for k in expired_keys:
            self.store.pop(k, None)
            try:
                bin_path = os.path.join(self.disk_dir, f"{k}.bin")
                json_path = os.path.join(self.disk_dir, f"{k}.json")
                if os.path.exists(bin_path):
                    os.remove(bin_path)
                if os.path.exists(json_path):
                    os.remove(json_path)
            except Exception:
                pass
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

# Merged/stitched image cache — persistent=True so disk files survive server restarts.
# Stored at: backend/database/image_cache/stitchedCache/
stitched_cache = CacheStore[Dict[str, Any]](
    name='stitchedCache', default_ttl_sec=None, max_size=2000, persistent=True
)

# Per-panel edit history — persistent so original source URLs survive restarts
edit_history = CacheStore[str](
    name='editHistory', default_ttl_sec=None, max_size=2000, persistent=True
)

# Generated ZIP file cache — expires after 20 min; temp dir is fine
zip_cache = CacheStore[bytes](
    name='zipFiles', default_ttl_sec=20 * 60, max_size=50
)

# Proxy image cache — expires after 30 min; temp dir is fine
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


def get_total_storage_size_bytes() -> int:
    """Returns the total size of the disk cache folder and SQLite database in bytes."""
    total_size = 0
    # Count persistent cache dir (stitched + edit_history)
    if os.path.exists(PERSISTENT_CACHE_DIR):
        for dirpath, _, filenames in os.walk(PERSISTENT_CACHE_DIR):
            for f in filenames:
                fp = os.path.join(dirpath, f)
                if not os.path.islink(fp):
                    try:
                        total_size += os.path.getsize(fp)
                    except OSError:
                        pass
    # Count temp cache dir (zip/proxy)
    temp_cache_dir = os.path.join(tempfile.gettempdir(), "anivox_disk_cache")
    if os.path.exists(temp_cache_dir):
        for dirpath, _, filenames in os.walk(temp_cache_dir):
            for f in filenames:
                fp = os.path.join(dirpath, f)
                if not os.path.islink(fp):
                    try:
                        total_size += os.path.getsize(fp)
                    except OSError:
                        pass
    try:
        from database.db import DB_PATH
        if os.path.exists(DB_PATH):
            total_size += os.path.getsize(DB_PATH)
    except Exception:
        pass
    return total_size


import logging
logger = logging.getLogger("anivox.utils.cache")


def purge_all_expired() -> None:
    m = stitched_cache.purge_expired()
    e = edit_history.purge_expired()
    z = zip_cache.purge_expired()
    p = proxy_cache.purge_expired()
    total = m + e + z + p
    if total > 0:
        logger.info(f"[Cache] ♻️  Purged {total} expired entries (merged:{m} edits:{e} zips:{z} proxy:{p})")
