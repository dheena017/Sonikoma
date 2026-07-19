"""
Metrics model definitions.
"""
from pydantic import BaseModel, Field
from typing import Dict, Any

class HealthScore(BaseModel):
    """Represents an overall health score."""
    score: float = Field(..., description="Overall score (0.0 to 100.0)")
    max_score: float = Field(default=100.0, description="Maximum possible score")
    components: Dict[str, float] = Field(default_factory=dict, description="Scores for individual components")

class ComplexityMetrics(BaseModel):
    """Code complexity metrics."""
    cyclomatic_complexity: int = Field(default=0, description="Total cyclomatic complexity")
    cognitive_complexity: int = Field(default=0, description="Total cognitive complexity")
    average_complexity: float = Field(default=0.0, description="Average complexity per unit")

class Statistics(BaseModel):
    """General project statistics."""
    total_files: int = Field(default=0, description="Total number of scanned files")
    total_lines: int = Field(default=0, description="Total lines of code")
    blank_lines: int = Field(default=0, description="Total blank lines")
    comment_lines: int = Field(default=0, description="Total comment lines")
    code_lines: int = Field(default=0, description="Total actual code lines")

class ProjectMetrics(BaseModel):
    """Aggregate metrics for a project."""
    health_score: HealthScore = Field(default_factory=lambda: HealthScore(score=0.0))
    complexity: ComplexityMetrics = Field(default_factory=ComplexityMetrics)
    statistics: Statistics = Field(default_factory=Statistics)
    custom_metrics: Dict[str, Any] = Field(default_factory=dict, description="Custom metrics data")
