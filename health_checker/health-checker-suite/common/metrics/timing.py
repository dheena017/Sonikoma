"""
Execution timing metrics logic.
"""
from ..utils.timer import TimingRegistry

class ExecutionTimingMetrics:
    """Wrapper around TimingRegistry tailored for metric collection."""

    def __init__(self):
        self._registry = TimingRegistry()

    def record_operation(self, name: str):
        """Context manager to record timing for an operation."""
        return self._registry.record(name)

    def get_timings(self) -> dict[str, float]:
        """Get all recorded timings."""
        return self._registry.get_timings()

    def get_total_time(self) -> float:
        """Get the sum of all recorded timings."""
        return sum(self._registry.get_timings().values())
