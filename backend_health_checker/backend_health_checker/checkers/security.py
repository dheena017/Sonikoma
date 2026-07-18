import ast
from pathlib import Path
from typing import List
from .base import BaseChecker
from backend_health_checker.models.issues import Issue, Severity
from backend_health_checker.core.ast_cache import ast_cache

class SecurityChecker(BaseChecker):
    def check_file(self, file_path: Path) -> List[Issue]:
        issues = []
        tree = ast_cache.get_ast(file_path)
        if not tree:
            return issues

        for node in ast.walk(tree):
            if isinstance(node, ast.Call):
                if isinstance(node.func, ast.Name):
                    func_name = node.func.id
                    # Detect eval/exec
                    if func_name in ["eval", "exec"]:
                        issues.append(
                            Issue(
                                checker_name=self.name,
                                file_path=str(file_path),
                                line_number=node.lineno,
                                message=f"Dangerous function used: {func_name}()",
                                severity=Severity.CRITICAL
                            )
                        )
            # Detect hardcoded secrets/passwords
            elif isinstance(node, ast.Assign):
                for target in node.targets:
                    if isinstance(target, ast.Name):
                        name_lower = target.id.lower()
                        if any(kw in name_lower for kw in ["password", "secret", "api_key", "token"]):
                            if isinstance(node.value, ast.Constant) and isinstance(node.value.value, str):
                                # It's assigning a string literal to a sensitive variable name
                                if len(node.value.value) > 0: # not empty string
                                    issues.append(
                                        Issue(
                                            checker_name=self.name,
                                            file_path=str(file_path),
                                            line_number=node.lineno,
                                            message=f"Potential hardcoded secret/password in variable '{target.id}'",
                                            severity=Severity.HIGH
                                        )
                                    )
        return issues
