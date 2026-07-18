import typer
import yaml
from pathlib import Path
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.table import Table
from rich.panel import Panel
from typing import Optional

from backend_health_checker.config.models import AppConfig
from backend_health_checker.core.engine import HealthCheckEngine
from backend_health_checker.checkers import *
from backend_health_checker.scanners import *
from backend_health_checker.reporters import Reporter
import backend_health_checker

app = typer.Typer(help="Professional Backend Health Checker for Python Projects.")
console = Console()

def load_config(config_path: Optional[Path]) -> AppConfig:
    if not config_path or not config_path.exists():
        return AppConfig()
    try:
        with open(config_path, 'r') as f:
            data = yaml.safe_load(f)
        return AppConfig(**data)
    except Exception as e:
        console.print(f"[red]Error loading config: {e}[/red]")
        raise typer.Exit(1)

def run_engine(path: str, config_path: Optional[Path], selected_checkers=None) -> HealthCheckEngine:
    config = load_config(config_path)
    config.project_root = path
    engine = HealthCheckEngine(config)

    all_checkers = [
        SyntaxChecker, NamingChecker, ComplexityChecker, DocumentationChecker,
        TodoChecker, DeadCodeChecker, CompatibilityWrapperChecker, DuplicateChecker,
        SecurityChecker, ImportChecker, CircularImportChecker, ArchitectureChecker,
        FastAPIChecker, TestDiscoveryChecker, EnvironmentChecker, PackageChecker,
        MetricsScanner
    ]

    for checker in all_checkers:
        if not selected_checkers or checker.__name__ in selected_checkers:
            engine.register_checker(checker)

    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        console=console
    ) as progress:
        task = progress.add_task("[cyan]Discovering files...", total=None)
        files = engine.discover_files()
        progress.update(task, description=f"[cyan]Analyzing {len(files)} files...")
        engine.run_all(files)
        progress.update(task, description="[green]Analysis complete!")

    return engine

def print_summary(engine: HealthCheckEngine):
    metrics = engine.metrics
    score_color = "green" if metrics.health_score >= 90 else "yellow" if metrics.health_score >= 70 else "red"

    summary = Table.grid(padding=1)
    summary.add_column(style="bold cyan", justify="right")
    summary.add_column()

    summary.add_row("Health Score:", f"[{score_color}]{metrics.health_score:.1f}/100[/{score_color}]")
    summary.add_row("Total Files:", str(metrics.total_files))
    summary.add_row("Total Lines:", str(metrics.total_lines))
    summary.add_row("Total Issues:", str(len(engine.issues)))

    console.print(Panel(summary, title="Project Health Summary", expand=False))

    if engine.issues:
        table = Table(title="Detected Issues", show_header=True, header_style="bold magenta")
        table.add_column("Severity", width=10)
        table.add_column("Checker")
        table.add_column("Location")
        table.add_column("Message")

        # Limit to 50 in terminal to prevent spam
        for issue in sorted(engine.issues, key=lambda x: x.severity.value)[:50]:
            color = {
                "critical": "bold red",
                "high": "red",
                "medium": "yellow",
                "low": "cyan",
                "info": "white"
            }.get(issue.severity.value, "white")

            loc = f"{issue.file_path}:{issue.line_number}" if issue.line_number else issue.file_path
            table.add_row(
                f"[{color}]{issue.severity.value.upper()}[/{color}]",
                issue.checker_name,
                loc,
                issue.message
            )
        console.print(table)
        if len(engine.issues) > 50:
            console.print(f"[yellow]... and {len(engine.issues) - 50} more issues. Run 'report' to see all.[/yellow]")

@app.command()
def scan(
    path: str = typer.Argument(".", help="Path to the project root"),
    config: Optional[Path] = typer.Option(None, "--config", "-c", help="Path to config file")
):
    """Run all health checks and print summary to terminal."""
    engine = run_engine(path, config)
    print_summary(engine)

@app.command()
def report(
    path: str = typer.Argument(".", help="Path to the project root"),
    out_dir: Path = typer.Option("reports", "--out", "-o", help="Directory to save reports"),
    config: Optional[Path] = typer.Option(None, "--config", "-c", help="Path to config file")
):
    """Generate detailed reports (JSON, CSV, HTML, etc.)."""
    engine = run_engine(path, config)
    out_dir.mkdir(exist_ok=True)

    reporter = Reporter(engine.issues, engine.metrics)

    console.print(f"Generating reports in [bold]{out_dir}[/bold]...")
    reporter.to_json(out_dir / "report.json")
    reporter.to_csv(out_dir / "report.csv")
    reporter.to_txt(out_dir / "report.txt")
    reporter.to_markdown(out_dir / "report.md")

    # Locate templates dir safely
    pkg_root = Path(backend_health_checker.__file__).parent
    template_dir = pkg_root / "templates"
    reporter.to_html(out_dir / "dashboard.html", template_dir)

    console.print("[green]Reports generated successfully![/green]")

@app.command()
def metrics(path: str = typer.Argument("."), config: Optional[Path] = None):
    """Only calculate and display project metrics."""
    engine = run_engine(path, config, selected_checkers=["MetricsScanner"])
    print_summary(engine)

@app.command()
def architecture(path: str = typer.Argument("."), config: Optional[Path] = None):
    """Only run architecture layered checks."""
    engine = run_engine(path, config, selected_checkers=["ArchitectureChecker"])
    print_summary(engine)

@app.command()
def security(path: str = typer.Argument("."), config: Optional[Path] = None):
    """Only run security checks."""
    engine = run_engine(path, config, selected_checkers=["SecurityChecker"])
    print_summary(engine)

@app.command()
def duplicate(path: str = typer.Argument("."), config: Optional[Path] = None):
    """Only run duplicate checks."""
    engine = run_engine(path, config, selected_checkers=["DuplicateChecker"])
    print_summary(engine)

@app.command()
def deadcode(path: str = typer.Argument("."), config: Optional[Path] = None):
    """Only run dead code checks."""
    engine = run_engine(path, config, selected_checkers=["DeadCodeChecker"])
    print_summary(engine)

@app.command()
def wrappers(path: str = typer.Argument("."), config: Optional[Path] = None):
    """Only run compatibility wrapper checks."""
    engine = run_engine(path, config, selected_checkers=["CompatibilityWrapperChecker"])
    print_summary(engine)

@app.command()
def imports(path: str = typer.Argument("."), config: Optional[Path] = None):
    """Only run import checks (including circular)."""
    engine = run_engine(path, config, selected_checkers=["ImportChecker", "CircularImportChecker"])
    print_summary(engine)

@app.command()
def dashboard(path: str = typer.Argument("."), out_dir: Path = typer.Option("reports"), config: Optional[Path] = None):
    """Generate the HTML dashboard standalone."""
    report(path, out_dir, config)
    console.print(f"[green]Dashboard available at {out_dir}/dashboard.html[/green]")

if __name__ == "__main__":
    app()
