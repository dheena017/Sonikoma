import ast
import re
from pathlib import Path
from typing import List
from .base import BaseChecker
from backend_health_checker.models.issues import Issue, Severity
from backend_health_checker.core.ast_cache import ast_cache

class NamingChecker(BaseChecker):
    CAMEL_CASE = re.compile(r"^[A-Z][a-zA-Z0-9]*$")
    SNAKE_CASE = re.compile(r"^[a-z_][a-z0-9_]*$")
    UPPER_SNAKE = re.compile(r"^[A-Z_][A-Z0-9_]*$")

    def check_file(self, file_path: Path) -> List[Issue]:
        issues = []
        tree = ast_cache.get_ast(file_path)
        if not tree:
            return issues

        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef):
                if not self.CAMEL_CASE.match(node.name):
                    issues.append(
                        Issue(
                            checker_name=self.name,
                            file_path=str(file_path),
                            line_number=node.lineno,
                            message=f"Class name '{node.name}' should use CamelCase",
                            severity=Severity.LOW
                        )
                    )
            elif isinstance(node, ast.FunctionDef) or isinstance(node, ast.AsyncFunctionDef):
                # Ignore dunder methods
                if not (node.name.startswith("__") and node.name.endswith("__")):
                    if not self.SNAKE_CASE.match(node.name):
                        issues.append(
                            Issue(
                                checker_name=self.name,
                                file_path=str(file_path),
                                line_number=node.lineno,
                                message=f"Function/Method name '{node.name}' should use snake_case",
                                severity=Severity.LOW
                            )
                        )
        return issues
