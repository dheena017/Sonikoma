"""
Rich console utilities.
"""
from rich.console import Console
from rich.theme import Theme

# Custom theme for consistent styling across health checkers
custom_theme = Theme({
    "info": "cyan",
    "warning": "yellow",
    "danger": "bold red",
    "success": "bold green",
    "header": "bold magenta",
})

# Global console instance
console = Console(theme=custom_theme)

def print_header(title: str) -> None:
    """Print a styled header."""
    console.print(f"\n[header]=== {title} ===[/header]\n")

def print_success(message: str) -> None:
    """Print a success message."""
    console.print(f"[success]✓[/success] {message}")

def print_error(message: str) -> None:
    """Print an error message."""
    console.print(f"[danger]✗[/danger] {message}")

def print_warning(message: str) -> None:
    """Print a warning message."""
    console.print(f"[warning]![/warning] {message}")

def print_info(message: str) -> None:
    """Print an info message."""
    console.print(f"[info]i[/info] {message}")
