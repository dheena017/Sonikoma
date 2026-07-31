"""
Report model definitions.
"""
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

from .project import ProjectConfig
from .finding import Finding
from .issue import Issue
from .metrics import ProjectMetrics

class ReportMetadata(BaseModel):
    """Metadata about the generated report."""
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    generator: str = Field(default="health-checker-suite")
    version: str = Field(default="1.0")
    execution_time_ms: float = Field(default=0.0)

class FullReport(BaseModel):
    """Complete report model containing all data."""
    metadata: ReportMetadata = Field(default_factory=ReportMetadata)
    project: ProjectConfig
    metrics: ProjectMetrics = Field(default_factory=ProjectMetrics)
    findings: List[Finding] = Field(default_factory=list)
    issues: List[Issue] = Field(default_factory=list)
    summary: Dict[str, Any] = Field(default_factory=dict)
