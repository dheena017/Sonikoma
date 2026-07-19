from typing import List, Dict, Any, Type
from react_frontend_health_checker.models.finding import Finding
from react_frontend_health_checker.config.models import ProjectConfig
from react_frontend_health_checker.parsers.parser import ASTNode

class BaseChecker:
    """
    Base class for all checkers in the health checker suite.
    """
    def __init__(self, config: ProjectConfig):
        self.config = config
        self.findings: List[Finding] = []

    @property
    def name(self) -> str:
        """Returns the name of the checker."""
        return self.__class__.__name__

    def check(self, file_path: str, ast: ASTNode, content: str) -> List[Finding]:
        """
        Executes the checker logic.
        Must be implemented by subclasses.
        """
        raise NotImplementedError("Checkers must implement the 'check' method.")

    def add_finding(self, severity: str, message: str, file_path: str, line_number: int = None, column_number: int = None, context: Dict = None):
        """Helper to add a finding."""
        from react_frontend_health_checker.models.finding import Severity

        self.findings.append(Finding(
            checker_name=self.name,
            severity=Severity(severity),
            message=message,
            file_path=file_path,
            line_number=line_number,
            column_number=column_number,
            context=context or {}
        ))

class CheckerRegistry:
    """
    Maintains a registry of all available checkers.
    """
    _checkers: Dict[str, Type[BaseChecker]] = {}

    @classmethod
    def register(cls, checker_class: Type[BaseChecker]):
        cls._checkers[checker_class.__name__] = checker_class
        return checker_class

    @classmethod
    def get_all_checkers(cls) -> List[Type[BaseChecker]]:
        return list(cls._checkers.values())
