import json
import csv
from pathlib import Path
from typing import List
from jinja2 import Environment, FileSystemLoader
from backend_health_checker.models.issues import Issue, ProjectMetrics

class Reporter:
    def __init__(self, issues: List[Issue], metrics: ProjectMetrics):
        self.issues = sorted(issues, key=lambda i: (
            {"critical": 0, "high": 1, "medium": 2, "low": 3, "info": 4}[i.severity.value],
            i.file_path,
            i.line_number or 0
        ))
        self.metrics = metrics

    def to_json(self, output_path: Path):
        data = {
            "metrics": {
                "health_score": self.metrics.health_score,
                "total_files": self.metrics.total_files,
                "total_lines": self.metrics.total_lines,
                "total_classes": self.metrics.total_classes,
                "total_functions": self.metrics.total_functions,
                "issues_by_severity": self.metrics.issues_by_severity,
            },
            "issues": [i.to_dict() for i in self.issues]
        }
        output_path.write_text(json.dumps(data, indent=2))

    def to_csv(self, output_path: Path):
        with output_path.open("w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow(["Severity", "Checker", "File", "Line", "Message"])
            for issue in self.issues:
                writer.writerow([
                    issue.severity.value,
                    issue.checker_name,
                    issue.file_path,
                    issue.line_number or "",
                    issue.message
                ])

    def to_txt(self, output_path: Path):
        lines = [
            f"Health Score: {self.metrics.health_score:.1f}",
            f"Total Files: {self.metrics.total_files}",
            f"Total Issues: {len(self.issues)}",
            "-" * 40
        ]
        for issue in self.issues:
            loc = f"{issue.file_path}:{issue.line_number}" if issue.line_number else issue.file_path
            lines.append(f"[{issue.severity.value.upper()}] {loc} - {issue.checker_name}: {issue.message}")
        output_path.write_text("\n".join(lines) + "\n")

    def to_markdown(self, output_path: Path):
        lines = [
            "# Project Health Report\n",
            f"**Health Score:** {self.metrics.health_score:.1f}/100\n",
            "## Metrics",
            f"- Total Files: {self.metrics.total_files}",
            f"- Total Lines: {self.metrics.total_lines}",
            f"- Total Issues: {len(self.issues)}\n",
            "## Issues\n",
            "| Severity | Checker | Location | Message |",
            "|---|---|---|---|"
        ]
        for issue in self.issues:
            loc = f"`{issue.file_path}:{issue.line_number}`" if issue.line_number else f"`{issue.file_path}`"
            lines.append(f"| {issue.severity.value.upper()} | {issue.checker_name} | {loc} | {issue.message} |")
        output_path.write_text("\n".join(lines) + "\n")

    def to_html(self, output_path: Path, template_dir: Path):
        env = Environment(loader=FileSystemLoader(str(template_dir)))
        template = env.get_template("dashboard.html")
        html_content = template.render(
            issues=self.issues,
            metrics=self.metrics
        )
        output_path.write_text(html_content, encoding="utf-8")
