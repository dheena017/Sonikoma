"""
Timer utilities for tracking execution time.
"""
import time
from contextlib import contextmanager
from typing import Generator, Dict

class Timer:
    """A simple timer for measuring execution blocks."""
    def __init__(self):
        self.start_time = 0.0
        self.end_time = 0.0
        self.duration = 0.0

    def start(self) -> None:
        self.start_time = time.perf_counter()

    def stop(self) -> float:
        self.end_time = time.perf_counter()
        self.duration = self.end_time - self.start_time
        return self.duration

@contextmanager
def measure_time() -> Generator[Timer, None, None]:
    """
    Context manager to measure execution time.

    Example:
        with measure_time() as t:
            do_something()
        print(f"Took {t.duration} seconds")
    """
    timer = Timer()
    timer.start()
    try:
        yield timer
    finally:
        timer.stop()

class TimingRegistry:
    """Registry to keep track of multiple timed operations."""
    def __init__(self):
        self._timings: Dict[str, float] = {}

    @contextmanager
    def record(self, name: str) -> Generator[None, None, None]:
        with measure_time() as t:
            yield
        self._timings[name] = self._timings.get(name, 0.0) + t.duration

    def get_timings(self) -> Dict[str, float]:
        return self._timings.copy()
