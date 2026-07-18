import ast
from pathlib import Path
from typing import List
from .base import BaseChecker
from backend_health_checker.models.issues import Issue, Severity
from backend_health_checker.core.ast_cache import ast_cache

class FastAPIChecker(BaseChecker):
    def check_file(self, file_path: Path) -> List[Issue]:
        issues = []
        tree = ast_cache.get_ast(file_path)
        if not tree:
            return issues

        is_fastapi_file = False
        for node in ast.walk(tree):
            if isinstance(node, ast.ImportFrom):
                if node.module == "fastapi":
                    is_fastapi_file = True
                    break

        if not is_fastapi_file:
            return issues

        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                # Check for missing return types on endpoints
                has_route_decorator = False
                for decorator in node.decorator_list:
                    if isinstance(decorator, ast.Call) and isinstance(decorator.func, ast.Attribute):
                        # e.g., @app.get, @router.post
                        if decorator.func.attr in ["get", "post", "put", "delete", "patch"]:
                            has_route_decorator = True
                            break

                if has_route_decorator:
                    if not node.returns:
                         issues.append(
                            Issue(
                                checker_name=self.name,
                                file_path=str(file_path),
                                line_number=node.lineno,
                                message=f"FastAPI route '{node.name}' is missing a return type hint.",
                                severity=Severity.MEDIUM
                            )
                        )
                    # Startup validation checks could theoretically attempt to load the module,
                    # but AST-based analysis is safer for a generic static health checker.
        return issues
