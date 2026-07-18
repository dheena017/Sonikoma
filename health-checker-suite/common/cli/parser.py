"""
Shared command options and parsers.
"""
import typer
from typing import List, Optional
from pathlib import Path

# Common Typer Arguments/Options that can be reused across tools

PathArg = typer.Argument(
    ...,
    help="Path to the directory to scan",
    exists=True,
    file_okay=False,
    dir_okay=True,
    resolve_path=True,
)

ExcludeOpt = typer.Option(
    None,
    "--exclude", "-e",
    help="Comma-separated list of directories to exclude"
)

FormatOpt = typer.Option(
    "cli",
    "--format", "-f",
    help="Output format (cli, json, csv, markdown, html, all)"
)

OutputOpt = typer.Option(
    None,
    "--output", "-o",
    help="Output directory for reports (default: ./reports)"
)

VerboseOpt = typer.Option(
    False,
    "--verbose", "-v",
    help="Enable verbose output"
)

def parse_csv_list(value: Optional[str]) -> List[str]:
    """Parse a comma-separated string into a list."""
    if not value:
        return []
    return [item.strip() for item in value.split(",") if item.strip()]
