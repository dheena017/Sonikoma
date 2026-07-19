"""
Shared generic CLI commands.
"""
import typer
from .console import console, print_header, print_info

def create_info_command(name: str, version: str, description: str) -> typer.Typer:
    """Create a sub-app with an 'info' command showing tool details."""
    app = typer.Typer(no_args_is_help=True)

    @app.command("info")
    def info():
        """Show information about this health checker."""
        print_header(f"Health Checker: {name}")
        print_info(f"Version: {version}")
        print_info(description)
        print_info("Powered by Health Checker Suite")

    return app
