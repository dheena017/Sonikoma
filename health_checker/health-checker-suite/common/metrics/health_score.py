"""
Health score logic.
"""
from typing import List, Dict, Callable
from ..models import HealthScore, Finding, Severity

class HealthScoreCalculator:
    """Calculates project health score based on metrics and findings."""

    def __init__(self, max_score: float = 100.0):
        self.max_score = max_score
        # Default severity weights
        self.weights = {
            Severity.CRITICAL: 10.0,
            Severity.HIGH: 5.0,
            Severity.MEDIUM: 2.0,
            Severity.LOW: 0.5,
            Severity.INFO: 0.0
        }

    def set_weight(self, severity: Severity, weight: float) -> None:
        """Adjust weight for a severity."""
        self.weights[severity] = weight

    def calculate(self, findings: List[Finding], components: Dict[str, float] = None) -> HealthScore:
        """
        Calculate health score. Deducts points based on findings severities.
        """
        penalty = 0.0
        for finding in findings:
            penalty += self.weights.get(finding.severity, 0.0)

        final_score = max(0.0, self.max_score - penalty)

        return HealthScore(
            score=final_score,
            max_score=self.max_score,
            components=components or {}
        )
