import re
from typing import List, Any
from react_frontend_health_checker.checkers.base import BaseChecker, CheckerRegistry
from react_frontend_health_checker.parsers.parser import ASTNode

@CheckerRegistry.register
class ReactHookUsageChecker(BaseChecker):
    """
    Checks that hooks are used according to React rules.
    (Simplistic implementation checking naming and basic usage).
    """
    def check(self, file_path: str, ast: ASTNode, content: str) -> List[Any]:
        lines = content.split('\n')
        for i, line in enumerate(lines):
            # Very simplistic regex check for hook usage inside loops/conditionals
            if re.search(r'(if|for|while|switch)\s*\(.*?\)\s*\{[^}]*use[A-Z]', line):
                self.add_finding(
                    severity="ERROR",
                    message="React Hook called conditionally or inside a loop.",
                    file_path=file_path,
                    line_number=i+1
                )
        return self.findings

@CheckerRegistry.register
class LargeComponentChecker(BaseChecker):
    """
    Checks for oversized React components.
    """
    def check(self, file_path: str, ast: ASTNode, content: str) -> List[Any]:
        # Count lines of code in file (simplistic component size proxy)
        if len(content.split('\n')) > 300:
            self.add_finding(
                severity="WARNING",
                message="Component file exceeds 300 lines, consider refactoring.",
                file_path=file_path
            )
        return self.findings

@CheckerRegistry.register
class StateManagementChecker(BaseChecker):
    """
    Checks for common state management antipatterns (Redux/Zustand).
    """
    def check(self, file_path: str, ast: ASTNode, content: str) -> List[Any]:
        # Example: checking for multiple Zustand stores in one file
        create_count = content.count('create(')
        if create_count > 1 and 'zustand' in content:
            self.add_finding(
                severity="WARNING",
                message="Multiple Zustand stores created in a single file. Consider splitting.",
                file_path=file_path
            )
        return self.findings
