import pytest
from common.cli import HealthCheckerCLI, parse_csv_list, console
from typer.testing import CliRunner

runner = CliRunner()

def test_parse_csv_list():
    assert parse_csv_list("a,b, c ") == ["a", "b", "c"]
    assert parse_csv_list("") == []
    assert parse_csv_list(None) == []

def test_cli_app():
    cli = HealthCheckerCLI("test_cli")

    @cli.app.command("hello")
    def hello(name: str):
        console.print(f"Hello {name}")

    result = runner.invoke(cli.app, ["hello", "World"])
    assert result.exit_code == 0
    assert "Hello World" in result.stdout
