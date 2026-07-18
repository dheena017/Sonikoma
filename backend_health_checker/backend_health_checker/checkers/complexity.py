import ast
from pathlib import Path
from typing import List
from .base import BaseChecker
from backend_health_checker.models.issues import Issue, Severity
from backend_health_checker.core.ast_cache import ast_cache

class ComplexityChecker(BaseChecker):
    def _calculate_complexity(self, node: ast.AST) -> int:
        """Calculate cyclomatic complexity of a function/method."""
        complexity = 1 # Base complexity
        for child in ast.walk(node):
            if isinstance(child, (ast.If, ast.While, ast.For, ast.AsyncFor, ast.ExceptHandler, ast.With, ast.AsyncWith)):
                complexity += 1
            elif isinstance(child, ast.BoolOp) and isinstance(child.op, (ast.And, ast.Or)):
                complexity += len(child.values) - 1
        return complexity

    def check_file(self, file_path: Path) -> List[Issue]:
        issues = []
        lines = ast_cache.get_lines(file_path)
        if lines is None:
            return issues

        # File Size Checker
        if len(lines) > self.config.checkers.max_file_lines:
            issues.append(
                Issue(
                    checker_name="FileSizeChecker",
                    file_path=str(file_path),
                    line_number=0,
                    message=f"File is too long ({len(lines)} lines > {self.config.checkers.max_file_lines})",
                    severity=Severity.MEDIUM
                )
            )

        tree = ast_cache.get_ast(file_path)
        if not tree:
            return issues

        for node in ast.walk(tree):
            if isinstance(node, ast.ClassDef):
                end_line = getattr(node, 'end_lineno', node.lineno)
                lines_count = end_line - node.lineno + 1
                if lines_count > self.config.checkers.max_class_lines:
                     issues.append(
                        Issue(
                            checker_name="LargeClassChecker",
                            file_path=str(file_path),
                            line_number=node.lineno,
                            message=f"Class '{node.name}' is too long ({lines_count} lines > {self.config.checkers.max_class_lines})",
                            severity=Severity.MEDIUM
                        )
                    )
            elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                end_line = getattr(node, 'end_lineno', node.lineno)
                lines_count = end_line - node.lineno + 1
                if lines_count > self.config.checkers.max_function_lines:
                     issues.append(
                        Issue(
                            checker_name="LargeFunctionChecker",
                            file_path=str(file_path),
                            line_number=node.lineno,
                            message=f"Function '{node.name}' is too long ({lines_count} lines > {self.config.checkers.max_function_lines})",
                            severity=Severity.MEDIUM
                        )
                    )

                complexity = self._calculate_complexity(node)
                if complexity > self.config.checkers.max_complexity:
                     issues.append(
                        Issue(
                            checker_name="ComplexityChecker",
                            file_path=str(file_path),
                            line_number=node.lineno,
                            message=f"Function '{node.name}' has high cyclomatic complexity ({complexity} > {self.config.checkers.max_complexity})",
                            severity=Severity.HIGH
                        )
                    )
        return issues
