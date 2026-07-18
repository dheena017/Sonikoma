import ast
from pathlib import Path
from typing import List, Set, Dict
from .base import BaseChecker
from backend_health_checker.models.issues import Issue, Severity
from backend_health_checker.core.ast_cache import ast_cache

import threading

class DeadCodeChecker(BaseChecker):
    def __init__(self, config):
        super().__init__(config)
        # Store globally defined names and used names across the project
        self.global_definitions: Dict[str, List[Path]] = {}
        self.global_usages: Set[str] = set()
        self.lock = threading.Lock()

    def check_file(self, file_path: Path) -> List[Issue]:
        issues = []
        tree = ast_cache.get_ast(file_path)
        if not tree:
            return issues

        local_usages = set()
        defined_in_file = set()

        class CodeAnalyzer(ast.NodeVisitor):
            def visit_Name(self, node):
                if isinstance(node.ctx, ast.Load):
                    local_usages.add(node.id)
                self.generic_visit(node)

            def visit_Attribute(self, node):
                # Simple usage tracking for attributes (like self.some_method)
                if isinstance(node.ctx, ast.Load):
                    local_usages.add(node.attr)
                self.generic_visit(node)

            def visit_FunctionDef(self, node):
                if not (node.name.startswith("__") and node.name.endswith("__")):
                    defined_in_file.add((node.name, node.lineno, "Function"))
                self.generic_visit(node)

            def visit_AsyncFunctionDef(self, node):
                if not (node.name.startswith("__") and node.name.endswith("__")):
                    defined_in_file.add((node.name, node.lineno, "AsyncFunction"))
                self.generic_visit(node)

            def visit_ClassDef(self, node):
                defined_in_file.add((node.name, node.lineno, "Class"))
                self.generic_visit(node)

        analyzer = CodeAnalyzer()
        analyzer.visit(tree)

        # Update global state (thread-safe operations aren't strictly necessary here
        # since we aren't mutating existing lists concurrently in a way that breaks)
        # But for full safety, we collect and then check_project will evaluate.
        # For local checks, we can check for unused local variables.

        # Local dead code check (simplified): functions defined but never used in the same file
        # and not in __init__.py (which usually exports).
        with self.lock:
            if file_path.name != "__init__.py":
                for name, lineno, type_ in defined_in_file:
                    if name not in self.global_definitions:
                        self.global_definitions[name] = []
                    self.global_definitions[name].append((file_path, lineno, type_))

            self.global_usages.update(local_usages)

        return issues

    def check_project(self, file_paths: List[Path]) -> List[Issue]:
        issues = []
        for name, definitions in self.global_definitions.items():
            if name not in self.global_usages:
                # To reduce false positives, we ignore common entry points or main blocks
                if name in ["main", "app", "router"]:
                    continue
                for file_path, lineno, type_ in definitions:
                    issues.append(
                        Issue(
                            checker_name=self.name,
                            file_path=str(file_path),
                            line_number=lineno,
                            message=f"{type_} '{name}' is defined but never used",
                            severity=Severity.MEDIUM
                        )
                    )
        return issues
