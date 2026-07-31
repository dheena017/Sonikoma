"""
CSV reporter implementation.
"""
import csv
from pathlib import Path
from .base_reporter import BaseReporter
from ..models import FullReport
from ..utils.exceptions import ReportError

class CsvReporter(BaseReporter):
    """Generates CSV reports focused on findings."""

    def generate(self, report: FullReport, output_path: Path) -> None:
        """
        Export the report findings as a CSV file.
        """
        try:
            output_path.parent.mkdir(parents=True, exist_ok=True)

            fieldnames = [
                "rule_id", "severity", "title", "file_path",
                "line_number", "column_number", "description"
            ]

            with open(output_path, 'w', encoding='utf-8', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()

                for finding in report.findings:
                    writer.writerow({
                        "rule_id": finding.rule_id,
                        "severity": finding.severity.value,
                        "title": finding.title,
                        "file_path": finding.file_path or "",
                        "line_number": finding.line_number or "",
                        "column_number": finding.column_number or "",
                        "description": finding.description
                    })
        except Exception as e:
            raise ReportError(f"Failed to generate CSV report: {e}")
