"""
Finding model definitions.
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from enum import Enum

class Severity(str, Enum):
    """Severity levels for findings."""
    INFO = "info"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class Finding(BaseModel):
    """Represents a single finding detected by a checker."""
    rule_id: str = Field(..., description="Identifier for the rule that generated the finding")
    title: str = Field(..., description="Short title of the finding")
    description: str = Field(..., description="Detailed description")
    severity: Severity = Field(default=Severity.INFO, description="Severity level")
    file_path: Optional[str] = Field(default=None, description="Path to the file where finding occurred")
    line_number: Optional[int] = Field(default=None, description="Line number where finding occurred")
    column_number: Optional[int] = Field(default=None, description="Column number")
    snippet: Optional[str] = Field(default=None, description="Code snippet related to the finding")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
