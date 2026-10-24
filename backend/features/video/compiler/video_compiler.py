"""
backend/features/video/compiler/video_compiler.py
─────────────────────────────────────────────────────────────────────────────
Core video compilation pipeline: panel sequence assembly, audio-visual sync,
and MoviePy/FFmpeg rendering to master MP4 video.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import io
import uuid
import base64
import shutil
import asyncio
import logging
import httpx
from PIL import Image
from typing import List, Dict, Any, Optional

from moviepy.editor import AudioFileClip, CompositeAudioClip, concatenate_videoclips
from proglog import ProgressBarLogger

from common.media import resolve_image_to_buffer
from common.utils.formatting import slugify
from features.video.utils.resolutions import make_even_dimensions, get_resolution
from features.video.utils.media_resolver import MEDIA_VIDEOS_DIR, TEMP_DIR, MEDIA_DIR
from features.video.motion.motion_engine import apply_motion
from app.core.cache import stitched_cache
from features.platform.projects.repositories import get_project, get_project_by_slug

logger = logging.getLogger("sonikoma.features.video.compiler.video_compiler")

_PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
_VIDEO_OUTPUT_DIR = MEDIA_VIDEOS_DIR


class MoviePyCompileLogger(ProgressBarLogger):
    """
    Proglog logger that intercepts FFmpeg frame rendering from MoviePy and
    emits concise log messages every 10% as well as updating the job manager progress.
    """
    def __init__(self, report_progress=None):
        super().__init__()
        self.report_progress = report_progress
        self.last_pct = -1

    def bars_callback(self, bar, attr, value, old_value=None):
        if bar == "t" and attr == "index":
            total = self.bars.get(bar, {}).get("total", 0)
            if total > 0:
                pct = int((value / total) * 100)
                if pct % 10 == 0 and pct != self.last_pct:
                    self.last_pct = pct
                    logger.info(f"[Video Compiler] FFmpeg encoding progress: {pct}% ({value}/{total} frames)")
                    if self.report_progress:
                        prog = 88.0 + (pct / 100.0) * 11.0
                        self.report_progress(round(prog, 1))


# ─── TOP: Internal Helpers ───────────────────────────────────────────────────

def _normalize_panels(panels: List[Any]) -> List[Dict[str, Any]]:
    """Normalizes panel objects or dicts into uniform dictionary representation."""
    normalized = []
    for p in panels:
        if isinstance(p, dict):
            normalized.append(p)
        elif hasattr(p, "model_dump"):
            normalized.append(p.model_dump())
        elif hasattr(p, "dict"):
            normalized.append(p.dict())
        elif hasattr(p, "__dict__"):
            normalized.append(p.__dict__)
        else:
            normalized.append(dict(p))
    return normalized


def _resolve_output_filename(first_panel: Dict[str, Any]) -> str:
    """Builds descriptive output filename incorporating series slug and episode number."""
    raw_title = first_panel.get("series_title") or first_panel.get("series_slug") or "series"
    clean_series = slugify(raw_title, separator="-") or "series"
    clean_series = clean_series.replace("_", "-").strip("-")
    ep_num = first_panel.get("episode_num") or first_panel.get("chapter_num") or "1"
    try:
        ep_formatted = f"{int(ep_num):02d}"
    except (ValueError, TypeError):
        ep_formatted = str(ep_num)
    return f"{clean_series}-ep{ep_formatted}-video-render-{uuid.uuid4().hex[:8]}.mp4"


def _gather_audio_candidates(
    panel: Dict[str, Any],
    db_panel: Dict[str, Any],
    prefer_narrative: bool
) -> List[Optional[str]]:
    """Builds prioritized audio candidate URLs based on narrative vs dialogue preference."""
    if prefer_narrative:
        return [
            panel.get("narrative_audio_url"),
            panel.get("audio_url"),
            panel.get("dialogue_audio_url"),
            panel.get("audio"),
            db_panel.get("narrative_audio_url"),
            db_panel.get("audio_url"),
            db_panel.get("dialogue_audio_url"),
        ]
    return [
        panel.get("audio_url"),
        panel.get("dialogue_audio_url"),
        panel.get("narrative_audio_url"),
        panel.get("audio"),
        db_panel.get("audio_url"),
        db_panel.get("dialogue_audio_url"),
        db_panel.get("narrative_audio_url"),
    ]


async def _resolve_local_audio_file(audio_ref: str, temp_dir: str) -> Optional[str]:
    """Downloads or resolves a local filesystem path for an audio track reference."""
    if not audio_ref or not str(audio_ref).strip():
        return None

    ref = str(audio_ref).strip()
    if os.path.exists(ref) and os.path.isfile(ref):
        return ref

    if ref.startswith("http://") or ref.startswith("https://"):
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                res = await client.get(ref)
                if res.status_code == 200:
                    local_tmp = os.path.join(temp_dir, f"audio_{uuid.uuid4().hex[:8]}.mp3")
                    with open(local_tmp, "wb") as f:
                        f.write(res.content)
                    return local_tmp
        except Exception as e:
            logger.warning(f"[Video Compiler] Failed to fetch remote audio from '{ref}': {e}")

    return None


# ─── BOTTOM: Canonical Public APIs (Simplest English) ────────────────────────

async def compile_video(
    project_id: str,
    panels: List[Dict[str, Any]],
    output_dir: Optional[str] = None,
    target_width: int = 1920,
    target_height: int = 1080,
    voice: Optional[str] = None,
    enable_dialogue_audio: Optional[bool] = None,
    enable_narrative_audio: Optional[bool] = None,
    enable_subtitles: bool = False,
    report_progress: Optional[Any] = None,
    **kwargs: Any
) -> str:
    """Compiles comic panels into an output MP4 video file."""
    if not panels:
        raise ValueError("No panels provided for video compilation.")

    if not output_dir:
        output_dir = _VIDEO_OUTPUT_DIR

    target_width, target_height = make_even_dimensions(target_width, target_height)
    panels = _normalize_panels(panels)

    # Project database panel mapping lookup
    db_panels_map: Dict[str, Dict[str, Any]] = {}
    if project_id and not project_id.startswith("job_"):
        try:
            db_proj = get_project(project_id) or get_project_by_slug(project_id)
            if db_proj and isinstance(db_proj.get("panels"), list):
                for dp in db_proj["panels"]:
                    pid = str(dp.get("id"))
                    db_panels_map[pid] = dp
        except Exception as p_err:
            logger.debug(f"[Video Compiler] Project DB lookup note: {p_err}")

    temp_dir = TEMP_DIR
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(temp_dir, exist_ok=True)

    output_filename = _resolve_output_filename(panels[0] if panels else {})
    output_path = os.path.join(output_dir, output_filename)

    clips = []
    audio_files_to_cleanup = []
    total_panels = len(panels)
    narrative_preferred = enable_narrative_audio is not False

    logger.info(
        f"[Video Compiler] Starting compilation for project '{project_id}' with {total_panels} panel(s)."
    )

    for idx, panel in enumerate(panels):
        panel_id = panel.get("id") or (idx + 1)
        image_url = panel.get("image_url") or panel.get("url") or ""
        if not image_url:
            logger.warning(f"[Video Compiler] Panel {idx + 1}/{total_panels}: Missing image URL. Skipping.")
            continue

        suggested_duration = float(panel.get("duration") or 0)
        if suggested_duration <= 0:
            suggested_duration = 4.0

        db_p = db_panels_map.get(str(panel_id)) or {}
        candidates = _gather_audio_candidates(panel, db_p, narrative_preferred)

        resolved_audio_file = None
        for cand in candidates:
            if cand:
                resolved_audio_file = await _resolve_local_audio_file(cand, temp_dir)
                if resolved_audio_file:
                    break

        audio_clip = None
        clip_duration = suggested_duration
        if resolved_audio_file and os.path.exists(resolved_audio_file):
            try:
                audio_clip = AudioFileClip(resolved_audio_file)
                clip_duration = max(suggested_duration, audio_clip.duration + 0.3)
                audio_files_to_cleanup.append(resolved_audio_file)
            except Exception as a_err:
                logger.warning(f"[Video Compiler] Failed to load audio clip '{resolved_audio_file}': {a_err}")

        try:
            buf_meta = await resolve_image_to_buffer(image_url)
            buf = buf_meta["buffer"]
            buf.seek(0)
            img = Image.open(buf).convert("RGB")
        except Exception as img_err:
            logger.error(f"[Video Compiler] Failed loading panel image '{image_url}': {img_err}")
            continue

        motion_type = panel.get("motion_type")
        sub_text = panel.get("speech_text") or panel.get("narrative") or panel.get("narrativeText") if enable_subtitles else None

        v_clip, _ = apply_motion(
            img=img,
            target_width=target_width,
            target_height=target_height,
            duration=clip_duration,
            idx=idx,
            motion_type=motion_type,
            subtitle_text=sub_text
        )

        if audio_clip:
            v_clip = v_clip.set_audio(audio_clip)

        clips.append(v_clip)
        if report_progress:
            step_pct = 10.0 + (float(idx + 1) / total_panels) * 75.0
            report_progress(round(step_pct, 1))

    if not clips:
        raise RuntimeError("No valid visual clips could be generated for video compilation.")

    final_clip = concatenate_videoclips(clips, method="compose")

    encode_logger = MoviePyCompileLogger(report_progress=report_progress)
    await asyncio.to_thread(
        final_clip.write_videofile,
        output_path,
        fps=24,
        codec="libx264",
        audio_codec="aac",
        threads=4,
        preset="fast",
        logger=encode_logger
    )

    for tmp_a in audio_files_to_cleanup:
        try:
            if os.path.exists(tmp_a) and tmp_a.startswith(temp_dir):
                os.remove(tmp_a)
        except Exception:
            pass

    logger.info(f"[Video Compiler] Compilation finished successfully: {output_filename}")
    return output_filename


# Backward compatibility aliases
compile_video_from_panels = compile_video
compile_panels_to_video_file = compile_video

__all__ = [
    "MoviePyCompileLogger",
    "compile_video",
    "compile_video_from_panels",
    "compile_panels_to_video_file",
    "_PROJECT_ROOT",
    "_VIDEO_OUTPUT_DIR",
]
