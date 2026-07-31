"""
Report exporter logic.
"""
from pathlib import Path
from typing import Dict, Type
from ..models import FullReport
from ..utils.exceptions import ReportError
from .base_reporter import BaseReporter
from .json_reporter import JsonReporter
from .csv_reporter import CsvReporter
from .markdown_reporter import MarkdownReporter
from .html_reporter import HtmlReporter
from .txt_reporter import TxtReporter

class ReportExporter:
    """Manager for exporting reports in multiple formats."""

    def __init__(self):
        self._reporters: Dict[str, BaseReporter] = {
            "json": JsonReporter(),
            "csv": CsvReporter(),
            "markdown": MarkdownReporter(),
            "html": HtmlReporter(),
            "txt": TxtReporter(),
        }

    def export(self, report: FullReport, format_name: str, output_path: str | Path) -> None:
        """
        Export the report using the specified format.
        """
        fmt = format_name.lower()
        if fmt not in self._reporters:
            raise ReportError(f"Unsupported report format: {format_name}. Supported formats: {list(self._reporters.keys())}")

        reporter = self._reporters[fmt]
        reporter.generate(report, Path(output_path))

    def export_multiple(self, report: FullReport, formats: list[str], output_dir: str | Path, base_filename: str = "report") -> None:
        """
        Export the report in multiple formats to a directory.
        """
        out_dir = Path(output_dir)
        out_dir.mkdir(parents=True, exist_ok=True)

        for fmt in formats:
            fmt = fmt.lower()
            if fmt in self._reporters:
                # Extension mapped correctly by reporter type, handle mapping here simply
                ext = f".{fmt}" if fmt != "markdown" else ".md"
                output_path = out_dir / f"{base_filename}{ext}"
                self.export(report, fmt, output_path)
            else:
                raise ReportError(f"Unsupported report format: {fmt}")
