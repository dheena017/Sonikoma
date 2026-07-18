"""
Dashboard builder logic.
"""
from typing import Any
from ..models import FullReport, Finding
from .dashboard import Dashboard
from .widgets import SummaryWidget, TableWidget, ChartWidget
from .charts import ChartDataPoint

class DashboardBuilder:
    """Builds a dashboard automatically from a FullReport."""

    def build_from_report(self, report: FullReport) -> Dashboard:
        """Construct a full dashboard from a report object."""
        dash = Dashboard(
            title=f"Health Checker Dashboard: {report.project.name}",
            generated_at=report.metadata.timestamp
        )

        # Summary Widgets
        dash.add_summary_widget(SummaryWidget(
            title="Health Score",
            value=f"{report.metrics.health_score.score:.1f} / {report.metrics.health_score.max_score:.1f}"
        ))

        dash.add_summary_widget(SummaryWidget(
            title="Files Scanned",
            value=str(report.metrics.statistics.total_files)
        ))

        dash.add_summary_widget(SummaryWidget(
            title="Total Findings",
            value=str(len(report.findings))
        ))

        # Charts
        if report.findings:
            # Group findings by severity for a chart
            severity_counts = {}
            for f in report.findings:
                sev = f.severity.value.upper()
                severity_counts[sev] = severity_counts.get(sev, 0) + 1

            if severity_counts:
                chart_data = [
                    ChartDataPoint(label=sev, value=count)
                    for sev, count in severity_counts.items()
                ]
                dash.add_chart(ChartWidget(
                    title="Findings by Severity",
                    chart_type="bar",
                    data=chart_data
                ))

        # Findings Table
        if report.findings:
            headers = ["Severity", "Rule ID", "Title", "Location"]
            rows = []
            for f in sorted(report.findings, key=lambda x: self._severity_weight(x), reverse=True):
                loc = f"{f.file_path}:{f.line_number}" if f.file_path else "Global"
                badge = f'<span class="badge badge-{f.severity.value}">{f.severity.value.upper()}</span>'
                rows.append([badge, f"`{f.rule_id}`", f.title, loc])

            dash.add_table(TableWidget(
                title="Detailed Findings",
                headers=headers,
                rows=rows
            ))

        return dash

    def _severity_weight(self, finding: Finding) -> int:
        weights = {"critical": 4, "high": 3, "medium": 2, "low": 1, "info": 0}
        return weights.get(finding.severity.value, 0)
