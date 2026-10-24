"""
backend/features/image/crop/__init__.py
─────────────────────────────────────────────────────────────────────────────
Crop Services Module:
- margin_crop_service: 4-directional margin crop & aspect ratio snap
- long_panels_crop_service: Multi-panel batch slicer with bleed guards
- panel_splitter_service: Automatic gutter-variance strip cutter
- manual_split_service: Interactive percentage line cutter
─────────────────────────────────────────────────────────────────────────────
"""

from .margin_crop_service import crop_panel_margins
from .long_panels_crop_service import crop_long_panels_batch
from .panel_splitter_service import split_strip_by_gutters
from .manual_split_service import cut_strip_at_positions

__all__ = [
    "crop_panel_margins",
    "crop_long_panels_batch",
    "split_strip_by_gutters",
    "cut_strip_at_positions",
]
