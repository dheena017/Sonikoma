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
                func_name = ""
                if isinstance(node.func, ast.Name):
                    func_name = node.func.id
                elif isinstance(node.func, ast.Attribute):
                    func_name = node.func.attr

                # Phase 11: Dangerous Functions
                if func_name in ["eval", "exec"]:
                    issues.append(
                        Issue(
                            checker_name=self.name,
                            file_path=str(file_path),
                            line_number=node.lineno,
                            message=f"Dangerous function used: {func_name}() can execute arbitrary code.",
                            severity=Severity.CRITICAL
                        )
                    )
                # Unsafe Deserialization
                elif func_name in ["loads", "load"]:
                    # Simple heuristic: if it looks like pickle or yaml.load without SafeLoader
                    if isinstance(node.func, ast.Attribute) and isinstance(node.func.value, ast.Name):
                        module_name = node.func.value.id
                        if module_name == "pickle":
                            issues.append(
                                Issue(
                                    checker_name=self.name,
                                    file_path=str(file_path),
                                    line_number=node.lineno,
                                    message="Unsafe deserialization: using pickle.loads() is vulnerable to RCE.",
                                    severity=Severity.CRITICAL
                                )
                            )
                        elif module_name == "yaml" and func_name == "load":
                             issues.append(
                                Issue(
                                    checker_name=self.name,
                                    file_path=str(file_path),
                                    line_number=node.lineno,
                                    message="Unsafe YAML load: use yaml.safe_load() instead to prevent RCE.",
                                    severity=Severity.HIGH
                                )
                            )
                # Weak Hashing
                elif func_name in ["md5", "sha1"]:
                     issues.append(
                        Issue(
                            checker_name=self.name,
                            file_path=str(file_path),
                            line_number=node.lineno,
                            message=f"Weak cryptographic hash used: {func_name}(). Use SHA-256 or stronger.",
                            severity=Severity.MEDIUM
                        )
                    )
                # Command Injection / Unsafe Subprocess
                elif func_name in ["system", "popen", "Popen", "call", "check_call", "check_output", "run"]:
                    # Very naive check for shell=True
                    has_shell_true = False
                    for kw in node.keywords:
                        if kw.arg == "shell" and isinstance(kw.value, ast.Constant) and kw.value.value is True:
                            has_shell_true = True
                    if has_shell_true:
                         issues.append(
                            Issue(
                                checker_name=self.name,
                                file_path=str(file_path),
                                line_number=node.lineno,
                                message=f"Subprocess call with shell=True detected. High risk of Command Injection.",
                                severity=Severity.CRITICAL
                            )
                        )

            # Phase 11: Hardcoded Secrets
            elif isinstance(node, ast.Assign):
                for target in node.targets:
                    if isinstance(target, ast.Name):
                        name_lower = target.id.lower()
                        if any(kw in name_lower for kw in ["password", "secret", "api_key", "token", "jwt_"]):
                            if isinstance(node.value, ast.Constant) and isinstance(node.value.value, str):
                                if len(node.value.value) > 3: # Ignore empty/very short strings
                                    issues.append(
                                        Issue(
                                            checker_name=self.name,
                                            file_path=str(file_path),
                                            line_number=node.lineno,
                                            message=f"Potential hardcoded secret in variable '{target.id}'.",
                                            severity=Severity.HIGH
                                        )
                                    )
        return issues
