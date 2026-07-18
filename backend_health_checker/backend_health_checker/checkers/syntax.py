import ast
from pathlib import Path
from typing import List
from .base import BaseChecker
from backend_health_checker.models.issues import Issue, Severity

class SyntaxChecker(BaseChecker):
    def check_file(self, file_path: Path) -> List[Issue]:
        issues = []
        try:
            content = file_path.read_text(encoding="utf-8")
            ast.parse(content, filename=str(file_path))
        except SyntaxError as e:
            issues.append(
                Issue(
                    checker_name=self.name,
                    file_path=str(file_path),
                    line_number=e.lineno,
                    message=f"Syntax Error: {e.msg}",
                    severity=Severity.CRITICAL,
                    context=e.text.strip() if e.text else None
                )
            )
        except UnicodeDecodeError as e:
             issues.append(
                Issue(
                    checker_name=self.name,
                    file_path=str(file_path),
                    line_number=0,
                    message=f"Encoding Error: File must be UTF-8 encoded ({str(e)})",
                    severity=Severity.CRITICAL,
                    context=None
                )
            )
        return issues
