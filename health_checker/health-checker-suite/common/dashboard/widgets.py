"""
Widget definitions for the dashboard.
"""
from pydantic import BaseModel
from typing import List, Any

class SummaryWidget(BaseModel):
    """A simple card displaying a metric."""
    title: str
    value: str

class TableWidget(BaseModel):
    """A data table."""
    title: str
    headers: List[str]
    rows: List[List[Any]]

from .charts import ChartWidget
