"""
Exceptions for the Health Checker Suite.
"""

class HealthCheckerError(Exception):
    """Base exception for all Health Checker Suite errors."""
    pass

class ConfigurationError(HealthCheckerError):
    """Raised when there is an error in the configuration."""
    pass

class ValidationError(HealthCheckerError):
    """Raised when validation fails."""
    pass

class ReportError(HealthCheckerError):
    """Raised when report generation or export fails."""
    pass

class DashboardError(HealthCheckerError):
    """Raised when dashboard generation fails."""
    pass

class GraphError(HealthCheckerError):
    """Raised when a graph operation fails."""
    pass

class CycleDetectedError(GraphError):
    """Raised when a cycle is detected in a dependency graph."""
    def __init__(self, cycle: list[str]):
        self.cycle = cycle
        super().__init__(f"Cycle detected: {' -> '.join(cycle)}")
