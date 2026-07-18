"""
Base reporter definition.
"""
from abc import ABC, abstractmethod
from typing import Any, Dict
from pathlib import Path
from ..models import FullReport

class BaseReporter(ABC):
    """
    Abstract base class for all reporters.
    All reporter implementations must subclass this and implement generate().
    """

    @abstractmethod
    def generate(self, report: FullReport, output_path: Path) -> None:
        """
        Generate the report to the specified path.

        Args:
            report: The complete report data model
            output_path: Path where the report should be saved
        """
        pass
