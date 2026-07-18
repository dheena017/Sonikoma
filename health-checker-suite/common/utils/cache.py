"""
Caching utilities.
"""
from typing import Any, Dict, Callable, TypeVar, cast
import functools

T = TypeVar('T')

class SimpleCache:
    """A thread-safe simple memory cache."""
    def __init__(self):
        from threading import Lock
        self._cache: Dict[str, Any] = {}
        self._lock = Lock()

    def get(self, key: str) -> Any:
        with self._lock:
            return self._cache.get(key)

    def set(self, key: str, value: Any) -> None:
        with self._lock:
            self._cache[key] = value

    def clear(self) -> None:
        with self._lock:
            self._cache.clear()

def memoize(func: Callable[..., T]) -> Callable[..., T]:
    """Decorator to memoize function results."""
    cache = {}

    @functools.wraps(func)
    def wrapper(*args, **kwargs) -> T:
        # Create a cache key from args and kwargs
        key = str(args) + str(sorted(kwargs.items()))
        if key not in cache:
            cache[key] = func(*args, **kwargs)
        return cache[key]

    return cast(Callable[..., T], wrapper)
