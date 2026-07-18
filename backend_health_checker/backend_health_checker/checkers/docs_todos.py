import ast
from pathlib import Path
from typing import List
from .base import BaseChecker
from backend_health_checker.models.issues import Issue, Severity
from backend_health_checker.core.ast_cache import ast_cache

class DocumentationChecker(BaseChecker):
    def check_file(self, file_path: Path) -> List[Issue]:
        issues = []
        tree = ast_cache.get_ast(file_path)
        if not tree:
            return issues

        # Check module docstring
        if not ast.get_docstring(tree):
            issues.append(
                Issue(
                    checker_name=self.name,
                    file_path=str(file_path),
                    line_number=0,
                    message="Missing module-level docstring",
                    severity=Severity.INFO
                )
            )

        for node in ast.walk(tree):
            if isinstance(node, (ast.ClassDef, ast.FunctionDef, ast.AsyncFunctionDef)):
                # Ignore private methods and dunders, but strictly enforce for public interfaces
                if node.name.startswith("_") and not (node.name.startswith("__") and node.name.endswith("__")):
                    continue
                if not ast.get_docstring(node):
                    type_name = "Class" if isinstance(node, ast.ClassDef) else "Function/Method"
                    issues.append(
                        Issue(
                            checker_name=self.name,
                            file_path=str(file_path),
                            line_number=node.lineno,
                            message=f"Missing docstring for public {type_name.lower()} '{node.name}'",
                            severity=Severity.LOW
                        )
                    )
        return issues

class TodoChecker(BaseChecker):
    def check_file(self, file_path: Path) -> List[Issue]:
        issues = []
        lines = ast_cache.get_lines(file_path)
        if lines is None:
            return issues

        for i, line in enumerate(lines):
            line_upper = line.upper()
            if "TODO" in line_upper or "FIXME" in line_upper:
                issues.append(
                    Issue(
                        checker_name=self.name,
                        file_path=str(file_path),
                        line_number=i + 1,
                        message="Found TODO/FIXME comment",
                        severity=Severity.INFO,
                        context=line.strip()
                    )
                )
        return issues
