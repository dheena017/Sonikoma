"""
backend/app/services/processing/__init__.py
─────────────────────────────────────────────────────────────────────────────
Processing services package for compound media processing workflows.
─────────────────────────────────────────────────────────────────────────────
"""

from services.processing.compound_processor import (
    get_compound_processor,
    CompoundProcessor,
    WorkflowType,
    WorkflowProgress,
)

__all__ = [
    "get_compound_processor",
    "CompoundProcessor",
    "WorkflowType",
    "WorkflowProgress",
]
