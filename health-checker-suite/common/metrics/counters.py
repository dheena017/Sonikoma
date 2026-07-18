"""
Generic counters logic.
"""
from typing import Dict
from collections import defaultdict

class MetricCounters:
    """General purpose counters for custom metrics tracking."""

    def __init__(self):
        self._counters: Dict[str, int] = defaultdict(int)

    def increment(self, metric_name: str, value: int = 1) -> None:
        """Increment a counter by a value."""
        self._counters[metric_name] += value

    def set(self, metric_name: str, value: int) -> None:
        """Set a counter to a specific value."""
        self._counters[metric_name] = value

    def get(self, metric_name: str) -> int:
        """Get the value of a counter."""
        return self._counters[metric_name]

    def get_all(self) -> Dict[str, int]:
        """Get all counters as a dictionary."""
        return dict(self._counters)
