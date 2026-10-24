"""
backend/features/ai/analysis
─────────────────────────────────────────────────────────────────────────────
Looking at comic panels: vision breakdown, OCR bubbles, smart crop & emotions.
─────────────────────────────────────────────────────────────────────────────
"""

from features.ai.analysis.analyze_panel import read_panel
from features.ai.analysis.analyze_batch import read_many_panels
from features.ai.analysis.smart_crop import cut_out_panels
from features.ai.analysis.match_bubbles import match_bubbles_to_faces
from features.ai.analysis.detect_emotion import find_emotion
from features.ai.analysis.detect_sfx import find_sound_effects

__all__ = [
    "read_panel",
    "read_many_panels",
    "cut_out_panels",
    "match_bubbles_to_faces",
    "find_emotion",
    "find_sound_effects",
]
