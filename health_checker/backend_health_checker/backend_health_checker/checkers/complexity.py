import ast
import math
from pathlib import Path
from typing import List, Set
from .base import BaseChecker
from backend_health_checker.models.issues import Issue, Severity
from backend_health_checker.core.ast_cache import ast_cache

class ComplexityChecker(BaseChecker):
    def _calculate_complexity(self, node: ast.AST) -> int:
        complexity = 1
        for child in ast.walk(node):
            if isinstance(child, (ast.If, ast.While, ast.For, ast.AsyncFor, ast.ExceptHandler, ast.With, ast.AsyncWith)):
                complexity += 1
            elif isinstance(child, ast.BoolOp) and isinstance(child.op, (ast.And, ast.Or)):
                complexity += len(child.values) - 1
        return complexity

    def _calculate_cognitive_complexity(self, node: ast.AST) -> int:
        """Simplified Cognitive Complexity."""
        complexity = 0
        def _visit(n, nesting_level):
            nonlocal complexity
            if isinstance(n, (ast.If, ast.While, ast.For, ast.AsyncFor, ast.ExceptHandler)):
                complexity += (1 + nesting_level)
                for child in ast.iter_child_nodes(n):
                    _visit(child, nesting_level + 1)
            elif isinstance(n, ast.BoolOp):
                 complexity += 1
                 for child in ast.iter_child_nodes(n):
                    _visit(child, nesting_level)
            else:
                 for child in ast.iter_child_nodes(n):
                    _visit(child, nesting_level)

        for child in ast.iter_child_nodes(node):
             _visit(child, 0)
        return complexity

    def _calculate_halstead(self, node: ast.AST):
        operators = set()
        operands = set()
        N1, N2 = 0, 0

        for child in ast.walk(node):
             if isinstance(child, (ast.Add, ast.Sub, ast.Mult, ast.Div, ast.Mod, ast.Eq, ast.NotEq, ast.Lt, ast.Gt)):
                 operators.add(type(child).__name__)
                 N1 += 1
             elif isinstance(child, ast.Name):
                 operands.add(child.id)
                 N2 += 1
             elif isinstance(child, ast.Constant):
                 operands.add(str(child.value))
                 N2 += 1

        n1 = len(operators)
        n2 = len(operands)
        N = N1 + N2
        n = n1 + n2

        volume = N * math.log2(n) if n > 0 else 0
        difficulty = (n1 / 2) * (N2 / n2) if n2 > 0 else 0
        effort = volume * difficulty

        return volume, effort

    def check_file(self, file_path: Path) -> List[Issue]:
        issues = []
        lines = ast_cache.get_lines(file_path)
        if lines is None:
            return issues

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
                lines_count = getattr(node, 'end_lineno', node.lineno) - node.lineno + 1
                if lines_count > self.config.checkers.max_class_lines:
                     issues.append(Issue("LargeClassChecker", str(file_path), node.lineno, f"Class '{node.name}' too long ({lines_count} lines).", Severity.MEDIUM))
            elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                lines_count = getattr(node, 'end_lineno', node.lineno) - node.lineno + 1
                if lines_count > self.config.checkers.max_function_lines:
                     issues.append(Issue("LargeFunctionChecker", str(file_path), node.lineno, f"Function '{node.name}' too long ({lines_count} lines).", Severity.MEDIUM))

                cyclo = self._calculate_complexity(node)
                cog = self._calculate_cognitive_complexity(node)

                if cyclo > self.config.checkers.max_complexity:
                     issues.append(Issue("CyclomaticComplexityChecker", str(file_path), node.lineno, f"High Cyclomatic Complexity ({cyclo}).", Severity.HIGH))
                if cog > 15: # Arbitrary enterprise threshold
                     issues.append(Issue("CognitiveComplexityChecker", str(file_path), node.lineno, f"High Cognitive Complexity ({cog}). Code is hard to read.", Severity.MEDIUM))

        return issues
