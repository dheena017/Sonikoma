import ast
from pathlib import Path
from typing import List
from .base import BaseChecker
from backend_health_checker.models.issues import Issue, Severity
from backend_health_checker.core.ast_cache import ast_cache

class DeadCodeChecker(BaseChecker):
    def check_file(self, file_path: Path) -> List[Issue]:
        issues = []
        tree = ast_cache.get_ast(file_path)
        if not tree:
            return issues

        class CodeAnalyzer(ast.NodeVisitor):
            def __init__(self, context, current_file):
                self.context = context
                self.current_file = current_file

            def visit_Name(self, node):
                if isinstance(node.ctx, ast.Load) and self.context:
                    # We just track the raw name usage for now.
                    # A true symbol resolver would check the imports table here.
                    resolved = self.context.symbols.resolve_usage(node.id, self.current_file)
                    self.context.symbols.add_usage(resolved, self.current_file)
                self.generic_visit(node)

            def visit_Attribute(self, node):
                if isinstance(node.ctx, ast.Load) and self.context:
                    self.context.symbols.add_usage(node.attr, self.current_file)
                self.generic_visit(node)

            def visit_FunctionDef(self, node):
                if not (node.name.startswith("__") and node.name.endswith("__")) and self.context:
                    self.context.symbols.add_definition(node.name, self.current_file, node.lineno, "Function")
                self.generic_visit(node)

            def visit_AsyncFunctionDef(self, node):
                if not (node.name.startswith("__") and node.name.endswith("__")) and self.context:
                    self.context.symbols.add_definition(node.name, self.current_file, node.lineno, "AsyncFunction")
                self.generic_visit(node)

            def visit_ClassDef(self, node):
                if self.context:
                    self.context.symbols.add_definition(node.name, self.current_file, node.lineno, "Class")
                self.generic_visit(node)

            def visit_Import(self, node):
                 if self.context:
                     for alias in node.names:
                         name = alias.asname or alias.name
                         self.context.symbols.add_import(self.current_file, name, alias.name)
                 self.generic_visit(node)

            def visit_ImportFrom(self, node):
                 if self.context:
                     for alias in node.names:
                         if alias.name != '*':
                             name = alias.asname or alias.name
                             original = f"{node.module}.{alias.name}" if node.module else alias.name
                             self.context.symbols.add_import(self.current_file, name, original)
                 self.generic_visit(node)

        analyzer = CodeAnalyzer(self.context, file_path)
        analyzer.visit(tree)

        return issues

    def check_project(self, file_paths: List[Path]) -> List[Issue]:
        issues = []
        if not self.context:
            return issues

        for name, definitions in self.context.symbols.definitions.items():
            if name not in self.context.symbols.usages:
                # Ignore common entry points, main blocks, or routes
                if name in ["main", "app", "router", "setUp", "tearDown"] or name.startswith("test_"):
                    continue
                for file_path, lineno, type_ in definitions:
                    issues.append(
                        Issue(
                            checker_name=self.name,
                            file_path=str(file_path),
                            line_number=lineno,
                            message=f"{type_} '{name}' is defined but never used across the project.",
                            severity=Severity.MEDIUM
                        )
                    )
        return issues
