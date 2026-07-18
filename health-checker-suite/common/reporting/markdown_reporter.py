"""
Markdown reporter implementation.
"""
from pathlib import Path
from .base_reporter import BaseReporter
from ..models import FullReport
from ..utils.exceptions import ReportError

class MarkdownReporter(BaseReporter):
    """Generates Markdown reports."""

    def generate(self, report: FullReport, output_path: Path) -> None:
        """
        Export the report as a Markdown file.
        """
        try:
            output_path.parent.mkdir(parents=True, exist_ok=True)

            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(f"# Health Check Report: {report.project.name}\n\n")

                f.write("## Overview\n\n")
                f.write(f"- **Health Score**: {report.metrics.health_score.score:.2f} / {report.metrics.health_score.max_score:.2f}\n")
                f.write(f"- **Total Files**: {report.metrics.statistics.total_files}\n")
                f.write(f"- **Lines of Code**: {report.metrics.statistics.code_lines}\n\n")

                f.write("## Findings\n\n")
                if not report.findings:
                    f.write("*No findings detected.*\n\n")
                else:
                    f.write("| Severity | Title | Location | Rule |\n")
                    f.write("|----------|-------|----------|------|\n")
                    for finding in report.findings:
                        location = f"`{finding.file_path}:{finding.line_number}`" if finding.file_path else "Global"
                        f.write(f"| {finding.severity.value.upper()} | {finding.title} | {location} | `{finding.rule_id}` |\n")

                f.write("\n## Detailed Issues\n\n")
                for issue in report.issues:
                    f.write(f"### {issue.title}\n\n")
                    f.write(f"{issue.description}\n\n")
                    for finding in issue.findings:
                        f.write(f"- **{finding.severity.value.upper()}**: {finding.title}\n")
                    f.write("\n")

        except Exception as e:
            raise ReportError(f"Failed to generate Markdown report: {e}")
