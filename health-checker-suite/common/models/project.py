"""
Project model definitions.
"""
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from pathlib import Path

class ProjectConfig(BaseModel):
    """Configuration for a health checker project."""
    name: str = Field(..., description="Name of the project")
    path: str = Field(..., description="Root path of the project")
    exclude_paths: List[str] = Field(default_factory=list, description="Paths to exclude from scanning")
    include_paths: List[str] = Field(default_factory=list, description="Specific paths to include")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional project metadata")

class ProjectContext(BaseModel):
    """Execution context for a running health checker."""
    config: ProjectConfig
    root_path: Path
    scanned_files: int = 0
    start_time: float = 0.0

    model_config = {
        "arbitrary_types_allowed": True
    }
