import re
from typing import List, Any
from react_frontend_health_checker.checkers.base import BaseChecker, CheckerRegistry
from react_frontend_health_checker.parsers.parser import ASTNode

@CheckerRegistry.register
class PerformanceChecker(BaseChecker):
    """
    Checks for performance issues like missing memoization.
    """
    def check(self, file_path: str, ast: ASTNode, content: str) -> List[Any]:
        # Simplistic check: If a component has many props or complex logic but no useMemo/useCallback
        if '=>' in content and 'useMemo' not in content and 'useCallback' not in content:
            if len(content.split('\n')) > 100:
                 self.add_finding(
                    severity="INFO",
                    message="Large component might benefit from useMemo or useCallback.",
                    file_path=file_path
                )
        return self.findings

@CheckerRegistry.register
class SecurityChecker(BaseChecker):
    """
    Checks for hardcoded secrets, dangerous HTML, and eval.
    """
    def check(self, file_path: str, ast: ASTNode, content: str) -> List[Any]:
        lines = content.split('\n')
        for i, line in enumerate(lines):
            # Check for dangerous HTML
            if 'dangerouslySetInnerHTML' in line:
                self.add_finding(
                    severity="CRITICAL",
                    message="Usage of dangerouslySetInnerHTML detected.",
                    file_path=file_path,
                    line_number=i+1
                )
            # Check for eval
            if re.search(r'\beval\(', line):
                self.add_finding(
                    severity="CRITICAL",
                    message="Usage of eval() detected.",
                    file_path=file_path,
                    line_number=i+1
                )
            # Simplistic check for secrets
            if re.search(r'(?i)(secret|password|api_key|token)\s*=\s*[\'"][^\'"]+[\'"]', line):
                self.add_finding(
                    severity="CRITICAL",
                    message="Potential hardcoded secret or API key detected.",
                    file_path=file_path,
                    line_number=i+1
                )
        return self.findings

@CheckerRegistry.register
class CSSChecker(BaseChecker):
    """
    Checks for CSS issues.
    """
    def check(self, file_path: str, ast: ASTNode, content: str) -> List[Any]:
        if file_path.endswith('.css') or file_path.endswith('.scss'):
            if '!important' in content:
                self.add_finding(
                    severity="WARNING",
                    message="Usage of !important in CSS.",
                    file_path=file_path
                )
        return self.findings
