"""
backend/features/video/motion/__init__.py
─────────────────────────────────────────────────────────────────────────────
Camera motion, oscillation dynamics, 2.5D parallax, and transitions facade.
─────────────────────────────────────────────────────────────────────────────
"""

from features.video.motion.motion_engine import (
    apply_motion,
    build_cinematic_motion_clip,
)
from features.video.motion.camera_shake_engine import (
    apply_shake,
    build_camera_shake_clip,
)
from features.video.motion.parallax_engine import (
    apply_parallax,
    build_parallax_motion_clip,
)
from features.video.motion.transition_engine import (
    apply_transition,
    apply_clip_transition,
)

__all__ = [
    "apply_motion",
    "build_cinematic_motion_clip",
    "apply_shake",
    "build_camera_shake_clip",
    "apply_parallax",
    "build_parallax_motion_clip",
    "apply_transition",
    "apply_clip_transition",
]
