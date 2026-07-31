"""
Issue model definitions.
"""
from pydantic import BaseModel, Field
from typing import List
from .finding import Finding

class Issue(BaseModel):
    """Represents a larger issue that may contain multiple findings."""
    issue_id: str = Field(..., description="Unique identifier for the issue")
    title: str = Field(..., description="Title of the issue")
    description: str = Field(..., description="Description of the issue")
    findings: List[Finding] = Field(default_factory=list, description="Associated findings")

    def add_finding(self, finding: Finding) -> None:
        """Add a finding to the issue."""
        self.findings.append(finding)
