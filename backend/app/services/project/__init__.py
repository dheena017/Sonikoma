"""Public interface for the project service package.

The authoritative implementation lives in project_service.py. This package
re-exports the main service symbols so imports such as
``from services.project import ProjectService`` work consistently.
"""

from .project_service import (
    ProjectService,
    sync_project_to_supabase,
    get_series_details,
    delete_temp_file,
)

__all__ = [
    "ProjectService",
    "sync_project_to_supabase",
    "get_series_details",
    "delete_temp_file",
]
