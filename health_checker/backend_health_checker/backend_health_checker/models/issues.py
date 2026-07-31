from dataclasses import dataclass
from enum import Enum
from typing import Optional, List, Dict, Any

class Severity(Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"

@dataclass
class Issue:
    checker_name: str
    file_path: str
    line_number: Optional[int]
    message: str
    severity: Severity
    context: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "checker_name": self.checker_name,
            "file_path": self.file_path,
            "line_number": self.line_number,
            "message": self.message,
            "severity": self.severity.value,
            "context": self.context
        }

@dataclass
class ProjectMetrics:
    total_files: int = 0
    total_lines: int = 0
    total_classes: int = 0
    total_functions: int = 0
    health_score: float = 100.0
    issues_by_severity: Dict[str, int] = None

    def __post_init__(self):
        if self.issues_by_severity is None:
            self.issues_by_severity = {s.value: 0 for s in Severity}

    def calculate_health_score(self, total_issues: List[Issue]):
        self.issues_by_severity = {s.value: 0 for s in Severity}
        for issue in total_issues:
            self.issues_by_severity[issue.severity.value] += 1

        penalty = 0.0
        penalty += self.issues_by_severity[Severity.CRITICAL.value] * 5.0
        penalty += self.issues_by_severity[Severity.HIGH.value] * 2.0
        penalty += self.issues_by_severity[Severity.MEDIUM.value] * 1.0
        penalty += self.issues_by_severity[Severity.LOW.value] * 0.5
        penalty += self.issues_by_severity[Severity.INFO.value] * 0.1

        self.health_score = max(0.0, 100.0 - penalty)
