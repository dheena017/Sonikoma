"""
HTML reporter implementation.
"""
from pathlib import Path
from .base_reporter import BaseReporter
from ..models import FullReport
from ..utils.exceptions import ReportError
import json

class HtmlReporter(BaseReporter):
    """Generates simple HTML reports.
    Note: A more advanced Dashboard is implemented separately in the dashboard module."""

    def generate(self, report: FullReport, output_path: Path) -> None:
        """
        Export a basic HTML report.
        """
        try:
            output_path.parent.mkdir(parents=True, exist_ok=True)

            html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Health Check: {report.project.name}</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; padding: 2rem; max-width: 1200px; margin: 0 auto; color: #333; }}
        h1, h2, h3 {{ border-bottom: 1px solid #eaeaea; padding-bottom: 0.3em; }}
        .metric-card {{ background: #f4f4f4; border-radius: 8px; padding: 1rem; margin: 1rem 0; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 1rem; }}
        th, td {{ padding: 0.75rem; text-align: left; border-bottom: 1px solid #eaeaea; }}
        th {{ background-color: #f9f9f9; }}
        .severity-critical {{ color: #dc3545; font-weight: bold; }}
        .severity-high {{ color: #fd7e14; }}
        .severity-medium {{ color: #ffc107; }}
        .severity-low {{ color: #28a745; }}
        .severity-info {{ color: #17a2b8; }}
    </style>
</head>
<body>
    <h1>Health Check Report: {report.project.name}</h1>

    <div class="metric-card">
        <h2>Overview</h2>
        <p><strong>Health Score:</strong> {report.metrics.health_score.score:.2f} / {report.metrics.health_score.max_score:.2f}</p>
        <p><strong>Files Scanned:</strong> {report.metrics.statistics.total_files}</p>
        <p><strong>Lines of Code:</strong> {report.metrics.statistics.code_lines}</p>
    </div>

    <h2>Findings</h2>
    <table>
        <thead>
            <tr>
                <th>Severity</th>
                <th>Title</th>
                <th>Location</th>
            </tr>
        </thead>
        <tbody>
"""
            for finding in report.findings:
                location = f"{finding.file_path}:{finding.line_number}" if finding.file_path else "Global"
                html_content += f"""
            <tr>
                <td class="severity-{finding.severity.value}">{finding.severity.value.upper()}</td>
                <td>{finding.title}</td>
                <td>{location}</td>
            </tr>
"""

            html_content += """
        </tbody>
    </table>
</body>
</html>
"""

            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(html_content)

        except Exception as e:
            raise ReportError(f"Failed to generate HTML report: {e}")
