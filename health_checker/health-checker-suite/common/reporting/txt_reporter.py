"""
TXT reporter implementation.
"""
from pathlib import Path
from .base_reporter import BaseReporter
from ..models import FullReport
from ..utils.exceptions import ReportError

class TxtReporter(BaseReporter):
    """Generates plain text reports."""

    def generate(self, report: FullReport, output_path: Path) -> None:
        """
        Export the report as a simple text file.
        """
        try:
            output_path.parent.mkdir(parents=True, exist_ok=True)

            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(f"Health Check Report: {report.project.name}\n")
                f.write("=" * 50 + "\n\n")

                f.write("METRICS\n")
                f.write("-" * 50 + "\n")
                f.write(f"Health Score: {report.metrics.health_score.score:.2f} / {report.metrics.health_score.max_score:.2f}\n")
                f.write(f"Total Files: {report.metrics.statistics.total_files}\n")
                f.write(f"Lines of Code: {report.metrics.statistics.code_lines}\n\n")

                f.write("FINDINGS\n")
                f.write("-" * 50 + "\n")

                if not report.findings:
                    f.write("No findings detected.\n")
                else:
                    for i, finding in enumerate(report.findings, 1):
                        location = f"{finding.file_path}:{finding.line_number}" if finding.file_path else "Global"
                        f.write(f"{i}. [{finding.severity.value.upper()}] {finding.title} ({location})\n")
                        f.write(f"   {finding.description}\n\n")

        except Exception as e:
            raise ReportError(f"Failed to generate TXT report: {e}")
