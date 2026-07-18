"""
backend/app/engines/video/edit_helpers.py
─────────────────────────────────────────────────────────────────────────────
FFmpeg video visual filters mapping and command builder helper utilities.
─────────────────────────────────────────────────────────────────────────────
"""

from engines.video.types import FilterType


def get_ffmpeg_filter_string(filter_type: FilterType, intensity: float = 1.0) -> str:
    """Returns the FFmpeg filter string for the corresponding visual filter."""
    filters = {
        FilterType.BLUR: f"boxblur={intensity}",
        FilterType.BRIGHTEN: f"eq=brightness={intensity}",
        FilterType.DARKEN: f"eq=brightness=-{intensity}",
        FilterType.SATURATE: f"eq=saturation={1.0 + intensity}",
        FilterType.DESATURATE: f"eq=saturation={1.0 - intensity}",
        FilterType.GRAYSCALE: "format=gray",
        FilterType.SEPIA: "colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131",
        FilterType.INVERT: "negate",
        FilterType.SHARPEN: f"unsharp=5:5:{intensity}",
        FilterType.DENOISE: "nlmeans=s=10:p=4:r=16",
    }
    
    return filters.get(filter_type, "")
