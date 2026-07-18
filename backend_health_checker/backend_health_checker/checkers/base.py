from abc import ABC, abstractmethod
from typing import List, Optional
from pathlib import Path
from backend_health_checker.config.models import AppConfig
from backend_health_checker.models.issues import Issue, ProjectMetrics

class BaseChecker(ABC):
    def __init__(self, config: AppConfig):
        self.config = config
        self.name = self.__class__.__name__

    def check_file(self, file_path: Path) -> List[Issue]:
        """Override to implement file-level checks."""
        return []

    def check_project(self, file_paths: List[Path]) -> List[Issue]:
        """Override to implement project-level checks (e.g., circular imports, architecture)."""
        return []

    def update_metrics(self, metrics: ProjectMetrics, file_paths: List[Path]) -> None:
        """Override to collect and update project metrics."""
        pass
