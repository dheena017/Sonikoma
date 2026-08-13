"""
backend/app/services/video/video_service.py
─────────────────────────────────────────────────────────────────────────────
Backward-compatibility proxy.
Re-exports video service rendering functions from `services.video.video_compiler`.
─────────────────────────────────────────────────────────────────────────────
"""

from services.video.video_compiler import *

async def _render_panel_segment_ffmpeg(
    img_path: str,
    audio_path: str,
    duration: float,
    out_path: str,
    w: int = 640,
    h: int = 360,
    motion_type: str = "zoom_in",
    fps: int = 24,
    layers: dict | None = None,
    sync_map: dict | None = None,
    audio_peaks: list | None = None,
    audio_reactive_shake: bool = False
):
    import subprocess
    cmd = ["ffmpeg", "-y", "-loop", "1", "-i", img_path, "-i", audio_path, "-t", str(duration), "-pix_fmt", "yuv420p", out_path]
    subprocess.run(cmd, capture_output=True, check=False)

