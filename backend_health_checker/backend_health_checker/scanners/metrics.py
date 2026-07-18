import ast
from pathlib import Path
from typing import List
from backend_health_checker.checkers.base import BaseChecker
from backend_health_checker.models.issues import ProjectMetrics
from backend_health_checker.core.ast_cache import ast_cache

class MetricsScanner(BaseChecker):
    def update_metrics(self, metrics: ProjectMetrics, file_paths: List[Path]) -> None:
        total_lines = 0
        total_classes = 0
        total_functions = 0

        for file_path in file_paths:
            lines = ast_cache.get_lines(file_path)
            if lines:
                total_lines += len(lines)

            tree = ast_cache.get_ast(file_path)
            if tree:
                for node in ast.walk(tree):
                    if isinstance(node, ast.ClassDef):
                        total_classes += 1
                    elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                        total_functions += 1

        metrics.total_lines = total_lines
        metrics.total_classes = total_classes
        metrics.total_functions = total_functions
