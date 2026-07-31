import ast
from pathlib import Path
from typing import List
from .base import BaseChecker
from backend_health_checker.models.issues import Issue, Severity
from backend_health_checker.core.ast_cache import ast_cache

class ImportChecker(BaseChecker):
    def check_file(self, file_path: Path) -> List[Issue]:
        issues = []
        tree = ast_cache.get_ast(file_path)
        if not tree:
            return issues

        imported_names = set()
        used_names = set()

        class ImportVisitor(ast.NodeVisitor):
            def visit_Import(self, node):
                for alias in node.names:
                    imported_names.add((alias.asname or alias.name, node.lineno))
                self.generic_visit(node)

            def visit_ImportFrom(self, node):
                for alias in node.names:
                    if alias.name != '*':
                        imported_names.add((alias.asname or alias.name, node.lineno))
                self.generic_visit(node)

            def visit_Name(self, node):
                if isinstance(node.ctx, ast.Load):
                    used_names.add(node.id)
                self.generic_visit(node)

            def visit_Attribute(self, node):
                # When dealing with module attributes like os.path
                if isinstance(node.value, ast.Name):
                     used_names.add(node.value.id)
                self.generic_visit(node)

        visitor = ImportVisitor()
        visitor.visit(tree)

        # Unused Import Check (Ignore in __init__.py files as they might export them)
        if file_path.name != "__init__.py":
            for name, lineno in imported_names:
                # Naive check: if the base name of the module is not used
                base_name = name.split('.')[0]
                if base_name not in used_names:
                    issues.append(
                        Issue(
                            checker_name="UnusedImportChecker",
                            file_path=str(file_path),
                            line_number=lineno,
                            message=f"Unused import: '{name}'",
                            severity=Severity.LOW
                        )
                    )

        # Duplicate Import Check
        seen_imports = set()
        for node in ast.walk(tree):
             if isinstance(node, (ast.Import, ast.ImportFrom)):
                 import_str = ast.unparse(node).strip()
                 if import_str in seen_imports:
                      issues.append(
                        Issue(
                            checker_name="DuplicateImportChecker",
                            file_path=str(file_path),
                            line_number=node.lineno,
                            message=f"Duplicate import statement: '{import_str}'",
                            severity=Severity.LOW
                        )
                    )
                 seen_imports.add(import_str)

        return issues
