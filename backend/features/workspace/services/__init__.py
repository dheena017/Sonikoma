"""
backend/features/workspace/services/__init__.py
─────────────────────────────────────────────────────────────────────────────
Workspace services package exporting modular domain services:
- shell_service: Editor shell context, viewport state, workspace modes
- storyboard_service: AI storyboard timeline sequencing and saving
- storyboard_ai: AI narrative generation and fallback panel builder
- viewer_service: Comic reader pages streaming and reading progress
- imported_assets_service: Project asset uploads, directory listing, deletion
─────────────────────────────────────────────────────────────────────────────
"""

from .shell_service import (
    WORKSPACE_MODES,
    ShellService,
    shell_service,
)
from .storyboard_service import (
    StoryboardService,
    storyboard_service,
)
from .storyboard_ai import (
    get_programmatic_panels,
    generate_dynamic_panels,
    generate_storyboard_ai,
)
from .viewer_service import (
    ViewerService,
    viewer_service,
)
from .imported_assets_service import (
    format_bytes,
    get_asset_type,
    ImportedAssetsService,
    imported_assets_service,
)

__all__ = [
    # Shell
    "WORKSPACE_MODES",
    "ShellService",
    "shell_service",
    # Storyboard
    "StoryboardService",
    "storyboard_service",
    "get_programmatic_panels",
    "generate_dynamic_panels",
    "generate_storyboard_ai",
    # Viewer
    "ViewerService",
    "viewer_service",
    # Imported Assets
    "format_bytes",
    "get_asset_type",
    "ImportedAssetsService",
    "imported_assets_service",
]
