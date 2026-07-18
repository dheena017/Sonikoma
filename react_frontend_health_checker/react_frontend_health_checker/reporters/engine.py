import json
from typing import List
from react_frontend_health_checker.models.finding import Finding
from react_frontend_health_checker.models.finding import Metric
import csv
from rich.console import Console
from rich.table import Table

class ReporterEngine:
    """
    Handles generation of various report formats.
    """
    def __init__(self, findings: List[Finding], metrics: List[Metric]):
        self.findings = findings
        self.metrics = metrics

    def generate_json(self, output_path: str):
        data = {
            "metrics": [m.model_dump() for m in self.metrics],
            "findings": [f.model_dump() for f in self.findings]
        }
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)

    def generate_csv(self, output_path: str):
        with open(output_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(["Checker", "Severity", "Message", "File", "Line"])
            for finding in self.findings:
                writer.writerow([
                    finding.checker_name,
                    finding.severity.value,
                    finding.message,
                    finding.file_path,
                    finding.line_number
                ])

    def print_terminal_report(self):
        console = Console()
        console.print("\n[bold blue]React Frontend Health Checker Report[/bold blue]\n")

        table = Table(show_header=True, header_style="bold magenta")
        table.add_column("Severity")
        table.add_column("Message")
        table.add_column("File")
        table.add_column("Line")

        for finding in self.findings:
            color = "white"
            if finding.severity == "CRITICAL": color = "bold red"
            elif finding.severity == "ERROR": color = "red"
            elif finding.severity == "WARNING": color = "yellow"
            elif finding.severity == "INFO": color = "cyan"

            table.add_row(
                f"[{color}]{finding.severity.value}[/{color}]",
                finding.message,
                str(finding.file_path or ""),
                str(finding.line_number or "")
            )

        console.print(table)

        console.print("\n[bold green]Metrics[/bold green]")
        for metric in self.metrics:
            console.print(f"  {metric.name}: {metric.value}")
