"""
Code complexity logic.
"""
from ..models import ComplexityMetrics
from typing import List

class ComplexityCalculator:
    """Calculates overall complexity metrics."""

    def __init__(self):
        self.total_cyclomatic = 0
        self.total_cognitive = 0
        self.unit_count = 0

    def add_unit_complexity(self, cyclomatic: int, cognitive: int = 0) -> None:
        """Add complexity metrics for a single unit (function/class)."""
        self.total_cyclomatic += cyclomatic
        self.total_cognitive += cognitive
        self.unit_count += 1

    def get_metrics(self) -> ComplexityMetrics:
        """Return the aggregated complexity metrics."""
        average = self.total_cyclomatic / self.unit_count if self.unit_count > 0 else 0.0
        return ComplexityMetrics(
            cyclomatic_complexity=self.total_cyclomatic,
            cognitive_complexity=self.total_cognitive,
            average_complexity=average
        )
