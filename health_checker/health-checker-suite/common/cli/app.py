"""
Typer CLI application base wrapper.
"""
import typer
from typing import Callable, Any
from .console import console, print_error
import sys

class HealthCheckerCLI:
    """Base CLI wrapper for health checkers."""

    def __init__(self, name: str, help_text: str = ""):
        self.app = typer.Typer(name=name, help=help_text, no_args_is_help=True)
        self.name = name

        # Add a default error handler callback
        @self.app.callback(invoke_without_command=True)
        def main(ctx: typer.Context):
            pass

    def add_command(self, func: Callable, name: str = None, **kwargs) -> None:
        """Register a command with the Typer app."""
        self.app.command(name=name, **kwargs)(func)

    def add_sub_app(self, app: typer.Typer, name: str, **kwargs) -> None:
        """Register a sub-app (group of commands)."""
        self.app.add_typer(app, name=name, **kwargs)

    def run(self) -> None:
        """Execute the CLI application."""
        try:
            self.app()
        except Exception as e:
            print_error(f"Fatal error: {str(e)}")
            sys.exit(1)
