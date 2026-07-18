"""
Logging utilities for the Health Checker Suite.
"""
import logging
from rich.logging import RichHandler
from typing import Optional

def setup_logger(
    name: str = "health_checker",
    level: int = logging.INFO,
    log_file: Optional[str] = None
) -> logging.Logger:
    """
    Set up a logger with Rich formatting and optional file output.

    Args:
        name: Name of the logger
        level: Logging level
        log_file: Optional path to a log file

    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)
    logger.setLevel(level)

    # Avoid adding handlers multiple times
    if logger.handlers:
        return logger

    # Rich console handler
    rich_handler = RichHandler(rich_tracebacks=True, markup=True)
    formatter = logging.Formatter("%(message)s")
    rich_handler.setFormatter(formatter)
    logger.addHandler(rich_handler)

    # File handler if specified
    if log_file:
        file_handler = logging.FileHandler(log_file)
        file_formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        )
        file_handler.setFormatter(file_formatter)
        logger.addHandler(file_handler)

    return logger

# Default logger
logger = setup_logger()
