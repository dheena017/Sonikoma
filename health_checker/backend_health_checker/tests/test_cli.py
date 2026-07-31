import pytest
from typer.testing import CliRunner
from backend_health_checker.cli.main import app

runner = CliRunner()

def test_app_scan_help():
    result = runner.invoke(app, ["scan", "--help"])
    assert result.exit_code == 0
    assert "Run all health checks" in result.stdout

def test_app_metrics_help():
    result = runner.invoke(app, ["metrics", "--help"])
    assert result.exit_code == 0
    assert "calculate and display project metrics" in result.stdout
