import ast
from pathlib import Path
from typing import List
from .base import BaseChecker
from backend_health_checker.models.issues import Issue, Severity
from backend_health_checker.core.ast_cache import ast_cache

class TypeHintChecker(BaseChecker):
    def check_file(self, file_path: Path) -> List[Issue]:
        issues = []
        tree = ast_cache.get_ast(file_path)
        if not tree:
            return issues

        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                if not (node.name.startswith("__") and node.name.endswith("__")):
                    if not node.returns:
                        issues.append(Issue(self.name, str(file_path), node.lineno, f"Missing return type hint for '{node.name}'.", Severity.LOW))
                    for arg in node.args.args:
                        if arg.arg != "self" and not arg.annotation:
                            issues.append(Issue(self.name, str(file_path), arg.lineno, f"Missing type hint for argument '{arg.arg}'.", Severity.LOW))
        return issues
