import concurrent.futures
from pathlib import Path
from typing import List, Type, Dict, Any
from backend_health_checker.config.models import AppConfig
from backend_health_checker.models.issues import Issue, ProjectMetrics
import time

class HealthCheckEngine:
    def __init__(self, config: AppConfig):
        self.config = config
        self.issues: List[Issue] = []
        self.metrics = ProjectMetrics()
        self.checkers = []

    def register_checker(self, checker_class: Type):
        checker_instance = checker_class(self.config)
        self.checkers.append(checker_instance)

    def _should_exclude(self, path: Path) -> bool:
        if path.name.startswith("."):
            return True
        for exc in self.config.checkers.exclude_dirs:
            if exc in path.parts:
                return True
        for exc in self.config.checkers.exclude_files:
            if path.name == exc:
                return True
        return False

    def discover_files(self) -> List[Path]:
        root = Path(self.config.project_root)
        files = []
        for path in root.rglob("*.py"):
            if not self._should_exclude(path):
                files.append(path)
        return files

    def _run_file_checkers(self, file_path: Path) -> List[Issue]:
        issues = []
        for checker in self.checkers:
            if hasattr(checker, 'check_file'):
                issues.extend(checker.check_file(file_path) or [])
        return issues

    def run_all(self, file_paths: List[Path]) -> None:
        self.metrics.total_files = len(file_paths)

        # Phase 1: File-level checkers using Multi-threading
        with concurrent.futures.ThreadPoolExecutor(max_workers=self.config.threads) as executor:
            futures = {executor.submit(self._run_file_checkers, fp): fp for fp in file_paths}
            for future in concurrent.futures.as_completed(futures):
                try:
                    file_issues = future.result()
                    self.issues.extend(file_issues)
                except Exception as e:
                    path = futures[future]
                    print(f"Error checking {path}: {e}")

        # Phase 2: Project-level checkers (Architecture, Cycles, Duplicates, Metrics)
        for checker in self.checkers:
            if hasattr(checker, 'check_project'):
                self.issues.extend(checker.check_project(file_paths) or [])
            if hasattr(checker, 'update_metrics'):
                checker.update_metrics(self.metrics, file_paths)

        self.metrics.calculate_health_score(self.issues)
