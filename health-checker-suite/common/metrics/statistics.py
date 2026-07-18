"""
Code statistics logic.
"""
from ..models import Statistics
from pathlib import Path

class StatisticsCollector:
    """Collects general project statistics like lines of code."""

    def __init__(self):
        self.stats = Statistics()

    def add_file_stats(self, file_path: Path, total_lines: int, blank_lines: int, comment_lines: int) -> None:
        """Add statistics for a single file."""
        self.stats.total_files += 1
        self.stats.total_lines += total_lines
        self.stats.blank_lines += blank_lines
        self.stats.comment_lines += comment_lines
        self.stats.code_lines += (total_lines - blank_lines - comment_lines)

    def get_statistics(self) -> Statistics:
        """Return the aggregated statistics."""
        return self.stats
