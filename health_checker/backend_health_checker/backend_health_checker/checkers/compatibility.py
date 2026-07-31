import ast
from pathlib import Path
from typing import List
from .base import BaseChecker
from backend_health_checker.models.issues import Issue, Severity
from backend_health_checker.core.ast_cache import ast_cache

class CompatibilityWrapperChecker(BaseChecker):
    def check_file(self, file_path: Path) -> List[Issue]:
        issues = []
        tree = ast_cache.get_ast(file_path)
        if not tree:
            return issues

        # A module is a wrapper/shim if it mostly consists of imports and re-exports,
        # or contains specific keywords like proxy, wrapper, forward.
        lines = ast_cache.get_lines(file_path)
        if lines:
            for i, line in enumerate(lines):
                if any(kw in line.lower() for kw in ["wrapper(", "proxy(", "forward("]):
                    issues.append(
                         Issue(
                            checker_name=self.name,
                            file_path=str(file_path),
                            line_number=i + 1,
                            message="Detected potential compatibility wrapper/shim code.",
                            severity=Severity.MEDIUM,
                            context=line.strip()
                        )
                    )

        has_logic = False
        re_exports = 0
        wildcards = 0

        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
                has_logic = True
            elif isinstance(node, ast.ImportFrom):
                if any(alias.name == '*' for alias in node.names):
                    wildcards += 1
                    issues.append(
                         Issue(
                            checker_name="WildcardImportChecker",
                            file_path=str(file_path),
                            line_number=node.lineno,
                            message=f"Wildcard import used: from {node.module} import *",
                            severity=Severity.HIGH
                        )
                    )
                else:
                    re_exports += 1

        if not has_logic and (re_exports > 0 or wildcards > 0):
             issues.append(
                Issue(
                    checker_name=self.name,
                    file_path=str(file_path),
                    line_number=0,
                    message="Module appears to be a pure re-export/compatibility shim. Consider removing or migrating.",
                    severity=Severity.MEDIUM
                )
            )

        return issues
