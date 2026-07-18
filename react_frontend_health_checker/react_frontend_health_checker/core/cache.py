import os
import json
import hashlib
from pathlib import Path
from typing import Dict, Any, Optional

class CacheEngine:
    """
    Manages both memory and persistent disk caching for the health checker.
    """
    def __init__(self, project_path: str):
        self.project_path = Path(project_path)
        self.cache_dir = self.project_path / ".health-checker-cache"
        self.memory_cache: Dict[str, Any] = {}

    def init_cache(self):
        """Creates the cache directory if it doesn't exist."""
        if not self.cache_dir.exists():
            self.cache_dir.mkdir(parents=True)

    def get_file_hash(self, file_path: str) -> Optional[str]:
        """Calculates MD5 hash of a file."""
        path = Path(file_path)
        if not path.exists():
            return None

        hasher = hashlib.md5(usedforsecurity=False)
        with open(path, 'rb') as f:
            buf = f.read()
            hasher.update(buf)
        return hasher.hexdigest()

    def get(self, key: str) -> Optional[Any]:
        """Gets an item from cache (memory first, then disk)."""
        if key in self.memory_cache:
            return self.memory_cache[key]

        cache_file = self.cache_dir / f"{key}.json"
        if cache_file.exists():
            try:
                with open(cache_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self.memory_cache[key] = data
                    return data
            except (json.JSONDecodeError, OSError):
                return None
        return None

    def set(self, key: str, value: Any) -> None:
        """Sets an item in both memory and disk cache."""
        self.memory_cache[key] = value
        self.init_cache()
        cache_file = self.cache_dir / f"{key}.json"
        try:
            with open(cache_file, 'w', encoding='utf-8') as f:
                json.dump(value, f)
        except OSError:
            pass

    def clear(self) -> None:
        """Clears memory and disk cache."""
        self.memory_cache.clear()
        if self.cache_dir.exists():
            import shutil
            shutil.rmtree(self.cache_dir)
