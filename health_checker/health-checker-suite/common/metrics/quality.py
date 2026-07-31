"""
Quality metrics logic.
"""
from typing import List, Dict
from ..models import Finding, Severity

class QualityMetricsCalculator:
    """Calculates general quality metrics based on finding distributions."""

    def calculate_finding_distribution(self, findings: List[Finding]) -> Dict[str, int]:
        """Count findings by severity."""
        distribution = {severity.value: 0 for severity in Severity}
        for finding in findings:
            distribution[finding.severity.value] += 1
        return distribution

    def calculate_defect_density(self, total_findings: int, total_lines: int) -> float:
        """Calculate findings per 1000 lines of code."""
        if total_lines == 0:
            return 0.0
        return (total_findings / total_lines) * 1000.0
