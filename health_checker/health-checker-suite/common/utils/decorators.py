"""
General decorators.
"""
import functools
import time
from typing import Callable, TypeVar, cast
from .logger import setup_logger

logger = setup_logger("decorators")

T = TypeVar('T')

def retry(max_attempts: int = 3, delay: float = 1.0):
    """
    Retry decorator for functions that might fail temporarily.
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @functools.wraps(func)
        def wrapper(*args, **kwargs) -> T:
            last_exception = None
            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    logger.warning(f"Attempt {attempt + 1}/{max_attempts} failed: {e}")
                    if attempt < max_attempts - 1:
                        time.sleep(delay)
            raise RuntimeError(f"Failed after {max_attempts} attempts") from last_exception
        return cast(Callable[..., T], wrapper)
    return decorator

def log_execution(func: Callable[..., T]) -> Callable[..., T]:
    """
    Decorator to log function execution time and status.
    """
    @functools.wraps(func)
    def wrapper(*args, **kwargs) -> T:
        logger.debug(f"Executing {func.__name__}")
        start_time = time.perf_counter()
        try:
            result = func(*args, **kwargs)
            duration = time.perf_counter() - start_time
            logger.debug(f"Finished {func.__name__} in {duration:.4f}s")
            return result
        except Exception as e:
            duration = time.perf_counter() - start_time
            logger.error(f"Failed {func.__name__} after {duration:.4f}s: {e}")
            raise
    return cast(Callable[..., T], wrapper)
