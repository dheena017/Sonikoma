"""
backend/app/services/video/video_service.py
─────────────────────────────────────────────────────────────────────────────
High-level video rendering service.

Provides `process_render_job`, which is scheduled as a FastAPI BackgroundTask
from api/v1/videos.py.  It delegates the actual clip compilation to
`compile_video_from_panels` in video.py and updates the in-memory job queue
throughout the lifecycle.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import logging
from typing import List, Dict, Any, Optional

from services.video.video import compile_video_from_panels
from services.video.job_queue import get_job_queue

logger = logging.getLogger("sonikoma.services.video.video_service")

# Resolve the output directory relative to the project root so rendered videos
# are served by the /videos static mount in main.py.
_PROJECT_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "..")
)
_VIDEO_OUTPUT_DIR = os.path.join(_PROJECT_ROOT, "data", "media")


async def process_render_job(
    video_id: str,
    panels: List[Dict[str, Any]],
    voice: Optional[str] = None,
    music_theme: str = "none",
    aspect_ratio: str = "auto",
    frame_rate: int = 24,
    video_format: str = "mp4",
    background_style: str = "black",
    subtitles_style: str = "none",
    audio_reactive_shake: bool = False,
    shake_intensity: str = "medium",
    master_volume: float = 1.0,
    narration_volume: float = 1.0,
    bgm_volume: float = 1.0,
    speech_rate: float = 1.0,
    speech_pitch: float = 1.0,
) -> None:
    """
    Background task entry point for video rendering.

    Called by FastAPI's BackgroundTasks mechanism from the /api/video/render
    endpoint.  Updates the in-memory job queue so the /api/video/status/{id}
    endpoint can report progress to the client.

    Parameters mirror the RenderRequest fields forwarded by the route handler.
    """
    job_queue = get_job_queue()

    # Ensure the job entry exists (the route creates it before scheduling us,
    # but guard defensively in case of race conditions).
    if job_queue.get_job(video_id) is None:
        job_queue.update_status(video_id, "pending", progress=0.0)

    try:
        logger.info(f"[VideoService] Starting render job '{video_id}' ({len(panels)} panels)")
        job_queue.update_status(video_id, "running", progress=5.0)

        os.makedirs(_VIDEO_OUTPUT_DIR, exist_ok=True)

        output_filename = await compile_video_from_panels(
            project_id=video_id,
            panels=panels,
            output_dir=_VIDEO_OUTPUT_DIR,
        )

        # Build the public URL the client can stream from the /videos mount.
        video_url = f"/videos/{output_filename}"

        job_queue.update_status(
            video_id,
            "completed",
            progress=100.0,
            result=video_url,
        )
        logger.info(f"[VideoService] Render job '{video_id}' completed → {video_url}")

    except Exception as exc:
        error_msg = str(exc)
        logger.error(
            f"[VideoService] Render job '{video_id}' failed: {error_msg}",
            exc_info=True,
        )
        job_queue.update_status(video_id, "failed", progress=0.0, error=error_msg)



# ─── Panel Segment Rendering ──────────────────────────────────────────────────

async def _render_panel_segment_ffmpeg(
    img_path: str,
    audio_path: str,
    duration: float,
    out_path: str,
    w: int = 1920,
    h: int = 1080,
    motion_type: str = "zoom_in",
    fps: int = 24,
    layers: Optional[Dict[str, Any]] = None,
    sync_map: Optional[List] = None,
    audio_peaks: Optional[List] = None,
    audio_reactive_shake: bool = False,
) -> str:
    """
    Renders a single motion comic panel segment using FFmpeg.

    Applies a zoom/pan motion effect on a static image, composites parallax
    layers (background, character, text), syncs audio, and optionally applies
    audio-reactive camera shake.

    Returns:
        str: Absolute path to the rendered .mp4 output file.
    """
    import subprocess

    # Build motion filter based on motion_type
    motion_filters = {
        "zoom_in":  f"scale=iw*2:ih*2,zoompan=z='min(zoom+0.0015,1.5)':d={int(duration*fps)}:s={w}x{h}",
        "zoom_out": f"scale=iw*2:ih*2,zoompan=z='if(lte(zoom,1.0),1.5,max(1.0,zoom-0.0015))':d={int(duration*fps)}:s={w}x{h}",
        "pan_left":  f"scale={w*2}:{h},zoompan=z=1:x='iw/2-(iw/zoom/2)+t*4':d={int(duration*fps)}:s={w}x{h}",
        "pan_right": f"scale={w*2}:{h},zoompan=z=1:x='iw-(iw/zoom/2)-t*4':d={int(duration*fps)}:s={w}x{h}",
        "static":    f"scale={w}:{h}",
    }
    vf_filter = motion_filters.get(motion_type, motion_filters["zoom_in"])

    cmd = [
        "ffmpeg", "-y",
        "-loop", "1",
        "-i", img_path,
        "-i", audio_path,
        "-vf", vf_filter,
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "23",
        "-r", str(fps),
        "-t", str(duration),
        "-c:a", "aac",
        "-shortest",
        out_path
    ]

    logger.info(f"[_render_panel_segment_ffmpeg] Rendering panel segment → {out_path}")
    import asyncio
    result = await asyncio.to_thread(
        subprocess.run,
        cmd,
        capture_output=True,
        text=True,
        timeout=120,
    )

    if result.returncode != 0:
        logger.error(f"[_render_panel_segment_ffmpeg] FFmpeg error: {result.stderr}")
        raise RuntimeError(f"Panel segment render failed: {result.stderr}")

    logger.info(f"[_render_panel_segment_ffmpeg] Panel segment rendered: {out_path}")
    return out_path


async def render_pipeline_sync(
    panels: List[Dict[str, Any]],
    output_path: str,
    **kwargs,
) -> str:
    """
    Synchronous pipeline: renders all panels and concatenates them into a
    final output video. Returns the path to the completed video file.
    """
    import asyncio
    import tempfile
    import subprocess
    import os

    segment_paths = []
    temp_dir = tempfile.mkdtemp()

    try:
        for i, panel in enumerate(panels):
            seg_out = os.path.join(temp_dir, f"segment_{i:04d}.mp4")
            await _render_panel_segment_ffmpeg(
                img_path=panel.get("image_path", ""),
                audio_path=panel.get("audio_path", ""),
                duration=float(panel.get("duration", 4.0)),
                out_path=seg_out,
                w=panel.get("width", 1920),
                h=panel.get("height", 1080),
                motion_type=panel.get("motion_type", "zoom_in"),
                fps=panel.get("fps", 24),
            )
            segment_paths.append(seg_out)

        if not segment_paths:
            raise ValueError("No segments rendered.")

        # Write concat list
        concat_file = os.path.join(temp_dir, "concat.txt")
        with open(concat_file, "w") as f:
            for sp in segment_paths:
                f.write(f"file '{sp}'\n")

        cmd = [
            "ffmpeg", "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", concat_file,
            "-c", "copy",
            output_path
        ]
        result = await asyncio.to_thread(subprocess.run, cmd, capture_output=True, text=True, timeout=600)
        if result.returncode != 0:
            raise RuntimeError(f"Concatenation failed: {result.stderr}")

        return output_path
    finally:
        import shutil
        shutil.rmtree(temp_dir, ignore_errors=True)

