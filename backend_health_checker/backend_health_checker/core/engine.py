import concurrent.futures
import threading
import logging
import hashlib
import os
from pathlib import Path
from typing import List, Type, Callable, Optional, Dict

from backend_health_checker.config.models import AppConfig
from backend_health_checker.models.issues import Issue, ProjectMetrics
from backend_health_checker.checkers.base import BaseChecker
from backend_health_checker.resolvers.symbols import SymbolTable
from backend_health_checker.cache.sqlite_cache import SQLiteCache

logger = logging.getLogger(__name__)

class EngineContext:
    def __init__(self, config: AppConfig, project_root: Path):
        self.config = config
        self.project_root = project_root
        self.symbols = SymbolTable()
        # Initialize SQLite cache in the project root's .healthcheck directory
        cache_dir = project_root / ".healthcheck"
        cache_dir.mkdir(exist_ok=True)
        self.cache = SQLiteCache(cache_dir / "cache.db")

class HealthCheckEngine:
    def __init__(self, config: AppConfig):
        self.config = config
        self.context = EngineContext(config, Path(config.project_root).resolve())
        self.issues: List[Issue] = []
        self.metrics = ProjectMetrics()
        self.checkers: List[BaseChecker] = []
        self._cancel_event = threading.Event()
        self._lock = threading.Lock()

    def register_checker(self, checker_class: Type[BaseChecker]):
        checker_instance = checker_class(self.config)
        if hasattr(checker_instance, 'set_context'):
            checker_instance.set_context(self.context)
        self.checkers.append(checker_instance)

    def cancel(self):
        logger.info("Cancellation requested.")
        self._cancel_event.set()

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

    def _get_file_hash(self, path: Path) -> str:
        try:
            return hashlib.sha256(path.read_bytes()).hexdigest()
        except OSError:
            return ""

    def _run_file_checkers(self, file_path: Path) -> List[Issue]:
        issues = []
        if self._cancel_event.is_set():
            return issues

        # Incremental scan check
        mtime = os.path.getmtime(file_path)
        content_hash = self._get_file_hash(file_path)

        cached_state = self.context.cache.get_file_state(str(file_path))
        if cached_state and cached_state['content_hash'] == content_hash and cached_state['mtime'] == mtime:
             # Fast path: we skip checking unless we want to retrieve cached issues
             # (For this iteration, we still run the fast AST pass to populate symbol tables,
             # but we could fully skip and load cached issues here).
             pass

        self.context.cache.set_file_state(str(file_path), content_hash, mtime)

        for checker in self.checkers:
            if self._cancel_event.is_set():
                break
            if hasattr(checker, 'check_file'):
                try:
                    checker_issues = checker.check_file(file_path)
                    if checker_issues:
                        issues.extend(checker_issues)
                except Exception as e:
                    logger.error(f"Checker {checker.name} failed on {file_path}: {e}")
        return issues

    def run_all(self, file_paths: List[Path], progress_callback: Optional[Callable[[int, int], None]] = None) -> None:
        self.metrics.total_files = len(file_paths)
        completed = 0

        with concurrent.futures.ThreadPoolExecutor(max_workers=self.config.threads) as executor:
            futures = {executor.submit(self._run_file_checkers, fp): fp for fp in file_paths}

            for future in concurrent.futures.as_completed(futures):
                if self._cancel_event.is_set():
                    executor.shutdown(wait=False, cancel_futures=True)
                    break

                path = futures[future]
                try:
                    file_issues = future.result()
                    with self._lock:
                        self.issues.extend(file_issues)
                except Exception as e:
                    logger.error(f"Error checking {path}: {e}")
                finally:
                    completed += 1
                    if progress_callback:
                        progress_callback(completed, len(file_paths))

        if self._cancel_event.is_set():
            return

        for checker in self.checkers:
            if self._cancel_event.is_set():
                break
            if hasattr(checker, 'check_project'):
                try:
                    proj_issues = checker.check_project(file_paths)
                    if proj_issues:
                        self.issues.extend(proj_issues)
                except Exception as e:
                    logger.error(f"Project checker {checker.name} failed: {e}")
            if hasattr(checker, 'update_metrics'):
                try:
                    checker.update_metrics(self.metrics, file_paths)
                except Exception as e:
                    logger.error(f"Metrics update for {checker.name} failed: {e}")

        self.metrics.calculate_health_score(self.issues)

# ... existing code ... (we will patch this safely later, for now we just verify the file exists)
