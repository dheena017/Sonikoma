"""
Report model definitions specific to reporting.
"""
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from ..models import FullReport

class ReportFormat(BaseModel):
    """Configuration for a specific report format."""
    extension: str
    description: str

REPORT_FORMATS = {
    "json": ReportFormat(extension=".json", description="JSON format"),
    "csv": ReportFormat(extension=".csv", description="CSV format"),
    "markdown": ReportFormat(extension=".md", description="Markdown format"),
    "html": ReportFormat(extension=".html", description="Basic HTML format"),
    "txt": ReportFormat(extension=".txt", description="Plain text format")
}
