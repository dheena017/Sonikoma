from enum import Enum
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field

class Severity(str, Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"

class Finding(BaseModel):
    """
    Represents an issue found by a checker.
    """
    checker_name: str
    severity: Severity
    message: str
    file_path: Optional[str] = None
    line_number: Optional[int] = None
    column_number: Optional[int] = None
    context: Optional[Dict[str, Any]] = None

class Metric(BaseModel):
    """
    Represents a collected metric.
    """
    name: str
    value: float
    description: Optional[str] = None
