"""
Progress tracking utilities using Rich.
"""
from rich.progress import (
    Progress,
    SpinnerColumn,
    TextColumn,
    BarColumn,
    TaskProgressColumn,
    TimeElapsedColumn,
    TimeRemainingColumn
)
from contextlib import contextmanager
from typing import Generator

def get_standard_progress() -> Progress:
    """Get a standard configured Rich Progress instance."""
    return Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        TaskProgressColumn(),
        TimeElapsedColumn(),
        TimeRemainingColumn(),
        expand=True
    )

def get_spinner_progress() -> Progress:
    """Get a simple spinner progress for indeterminate tasks."""
    return Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        TimeElapsedColumn()
    )

@contextmanager
def track_task(description: str, total: int = 100) -> Generator:
    """Context manager for a simple progress bar."""
    with get_standard_progress() as progress:
        task_id = progress.add_task(description, total=total)
        yield lambda adv=1: progress.advance(task_id, adv)

@contextmanager
def spin_task(description: str) -> Generator:
    """Context manager for a spinner task."""
    with get_spinner_progress() as progress:
        task_id = progress.add_task(description, total=None)
        yield
        progress.update(task_id, completed=1)
