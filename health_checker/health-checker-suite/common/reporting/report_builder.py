"""
Report builder logic.
"""
from typing import List, Dict, Any
from ..models import FullReport, ProjectConfig, ProjectMetrics, Finding, Issue, ReportMetadata

class ReportBuilder:
    """Fluent API for building complete reports incrementally."""

    def __init__(self, project_config: ProjectConfig):
        self._report = FullReport(
            project=project_config,
            metadata=ReportMetadata()
        )

    def set_metrics(self, metrics: ProjectMetrics) -> "ReportBuilder":
        self._report.metrics = metrics
        return self

    def add_finding(self, finding: Finding) -> "ReportBuilder":
        self._report.findings.append(finding)
        return self

    def add_findings(self, findings: List[Finding]) -> "ReportBuilder":
        self._report.findings.extend(findings)
        return self

    def add_issue(self, issue: Issue) -> "ReportBuilder":
        self._report.issues.append(issue)
        return self

    def set_summary(self, summary_data: Dict[str, Any]) -> "ReportBuilder":
        self._report.summary = summary_data
        return self

    def build(self) -> FullReport:
        """Finalize and return the constructed report."""
        return self._report
