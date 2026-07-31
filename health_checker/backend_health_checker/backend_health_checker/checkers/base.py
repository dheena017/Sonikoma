from abc import ABC
from typing import List, Optional
from pathlib import Path
from backend_health_checker.config.models import AppConfig
from backend_health_checker.models.issues import Issue, ProjectMetrics

class BaseChecker(ABC):
    def __init__(self, config: AppConfig):
        self.config = config
        self.name = self.__class__.__name__
        self.context = None

    def set_context(self, context):
        self.context = context

    def check_file(self, file_path: Path) -> List[Issue]:
        return []

    def check_project(self, file_paths: List[Path]) -> List[Issue]:
        return []

    def update_metrics(self, metrics: ProjectMetrics, file_paths: List[Path]) -> None:
        pass
