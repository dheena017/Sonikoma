import ast
from pathlib import Path
from typing import List
from .base import BaseChecker
from backend_health_checker.models.issues import Issue, Severity
from backend_health_checker.core.ast_cache import ast_cache

class TestDiscoveryChecker(BaseChecker):
    def check_file(self, file_path: Path) -> List[Issue]:
        issues = []
        # If it's a test file, make sure it has test functions
        if file_path.name.startswith("test_") or file_path.name.endswith("_test.py"):
            tree = ast_cache.get_ast(file_path)
            if not tree:
                return issues

            has_tests = False
            for node in ast.walk(tree):
                if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    if node.name.startswith("test_"):
                        has_tests = True
                        break

            if not has_tests:
                 issues.append(
                    Issue(
                        checker_name=self.name,
                        file_path=str(file_path),
                        line_number=0,
                        message=f"Test file '{file_path.name}' contains no test functions (functions starting with 'test_').",
                        severity=Severity.LOW
                    )
                )
        return issues

class EnvironmentChecker(BaseChecker):
    def check_file(self, file_path: Path) -> List[Issue]:
        issues = []
        tree = ast_cache.get_ast(file_path)
        if not tree:
            return issues

        for node in ast.walk(tree):
             # Check for os.environ without default fallbacks
             if isinstance(node, ast.Subscript):
                 if isinstance(node.value, ast.Attribute) and node.value.attr == "environ":
                     if isinstance(node.value.value, ast.Name) and node.value.value.id == "os":
                         issues.append(
                            Issue(
                                checker_name=self.name,
                                file_path=str(file_path),
                                line_number=node.lineno,
                                message="Using os.environ[...] can raise KeyError. Consider using os.getenv(..., default).",
                                severity=Severity.LOW
                            )
                        )
        return issues
