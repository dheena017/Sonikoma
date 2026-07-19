"""
JSON reporter implementation.
"""
import json
from pathlib import Path
from .base_reporter import BaseReporter
from ..models import FullReport
from ..utils.exceptions import ReportError

class JsonReporter(BaseReporter):
    """Generates JSON reports."""

    def generate(self, report: FullReport, output_path: Path) -> None:
        """
        Export the full report as a JSON file.
        """
        try:
            output_path.parent.mkdir(parents=True, exist_ok=True)
            report_dict = report.model_dump()

            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(report_dict, f, indent=2)
        except Exception as e:
            raise ReportError(f"Failed to generate JSON report: {e}")
