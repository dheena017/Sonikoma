"""
CLI-specific logging configuration.
"""
import logging
from .console import console
from rich.logging import RichHandler
from typing import Optional

def configure_cli_logging(verbose: bool = False, log_file: Optional[str] = None) -> None:
    """Configure logging based on CLI flags."""
    level = logging.DEBUG if verbose else logging.INFO

    # Get root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(level)

    # Clear existing handlers to prevent duplicates
    if root_logger.hasHandlers():
        root_logger.handlers.clear()

    # Add Rich handler
    rich_handler = RichHandler(
        console=console,
        show_time=False,
        show_path=verbose,
        markup=True,
        rich_tracebacks=True
    )
    # Only show INFO and above on console unless verbose
    rich_handler.setLevel(logging.DEBUG if verbose else logging.INFO)
    root_logger.addHandler(rich_handler)

    # Add file handler if specified
    if log_file:
        file_handler = logging.FileHandler(log_file)
        file_formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )
        file_handler.setFormatter(file_formatter)
        file_handler.setLevel(logging.DEBUG) # Always log DEBUG to file if specified
        root_logger.addHandler(file_handler)
