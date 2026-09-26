"""
backend/app/services/video/video_compiler.py
─────────────────────────────────────────────────────────────────────────────
Video Compiler Engine: FFmpeg and MoviePy video compilation from comic panel strips,
audio narration, background music, and motion effects.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import io
import uuid
import base64
import shutil
import tempfile
import asyncio
import logging
import httpx
import numpy as np
from PIL import Image, ImageFilter
from typing import List, Dict, Any, Optional

from moviepy.editor import ImageClip, AudioFileClip, concatenate_videoclips
from proglog import ProgressBarLogger
from services.image.utils.image_utils import resolve_image_to_buffer
from services.jobs import job_manager
from services.audio.tts import generate_panel_audio
from core.cache import stitched_cache
from repositories.project import get_project, get_project_by_slug

logger = logging.getLogger("sonikoma.services.video.video_compiler")

_PROJECT_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "..")
)
_VIDEO_OUTPUT_DIR = os.path.join(_PROJECT_ROOT, "data", "media")


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


def build_panel_frame_image(
    background_image: Image.Image,
    foreground_image: Image.Image,
    target_width: int = 1920,
    target_height: int = 1080,
) -> Image.Image:
    target_width = max(1, target_width)
    target_height = max(1, target_height)

    bg_img = background_image.resize((target_width, target_height), Image.Resampling.LANCZOS)
    bg_img = bg_img.filter(ImageFilter.GaussianBlur(30))

    img_w, img_h = foreground_image.size
    img_w = max(1, img_w)
    img_h = max(1, img_h)

    scale = min(target_width / img_w, target_height / img_h)
    new_w = max(1, int(img_w * scale))
    new_h = max(1, int(img_h * scale))
    fg_img = foreground_image.resize((new_w, new_h), Image.Resampling.LANCZOS)

    frame = bg_img.copy()
    offset_x = max(0, (target_width - new_w) // 2)
    offset_y = max(0, (target_height - new_h) // 2)
    frame.paste(fg_img, (offset_x, offset_y))
    return frame.convert("RGB")


async def compile_video_from_panels(
    project_id: str,
    panels: List[Dict[str, Any]],
    output_dir: Optional[str] = None,
    target_width: int = 1920,
    target_height: int = 1080,
    voice: Optional[str] = None,
    enable_dialogue_audio: Optional[bool] = None,
    enable_narrative_audio: Optional[bool] = None,
    report_progress: Optional[Any] = None,
    **kwargs: Any
) -> str:
    if not panels:
        raise ValueError("No panels provided for video compilation.")

    if not output_dir:
        output_dir = _VIDEO_OUTPUT_DIR

    start_compilation_time = asyncio.get_event_loop().time()

    normalized_panels = []
    for p in panels:
        if isinstance(p, dict):
            normalized_panels.append(p)
        elif hasattr(p, "model_dump"):
            normalized_panels.append(p.model_dump())
        elif hasattr(p, "dict"):
            normalized_panels.append(p.dict())
        elif hasattr(p, "__dict__"):
            normalized_panels.append(p.__dict__)
        else:
            normalized_panels.append(dict(p))
    panels = normalized_panels

    # Look up database panels if project_id is available to ensure existing audio is discovered
    db_panels_map: Dict[str, Dict[str, Any]] = {}
    if project_id and not str(project_id).startswith("job_"):
        try:
            db_proj = get_project(project_id) or get_project_by_slug(project_id)
            if db_proj and isinstance(db_proj.get("panels"), list):
                for dp in db_proj["panels"]:
                    pid = str(dp.get("id"))
                    db_panels_map[pid] = dp
        except Exception as p_err:
            logger.debug(f"[Video Compiler] Project DB lookup note: {p_err}")

    backend_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    project_root = os.path.abspath(os.path.join(backend_root, ".."))
    data_dir = os.path.join(project_root, "data")
    temp_dir = os.path.join(data_dir, "temp")
    media_dir = os.path.join(data_dir, "media")

    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(temp_dir, exist_ok=True)
    os.makedirs(media_dir, exist_ok=True)

    first_panel = panels[0] if panels else {}
    series_slug = (first_panel.get("series_title") or first_panel.get("series_slug") or "series").lower()
    series_slug = "".join(c if c.isalnum() else "_" for c in series_slug).strip("_") or "series"
    ep_num = first_panel.get("episode_num") or first_panel.get("chapter_num") or "1"

    output_filename = f"{series_slug}_ep{ep_num}_compiled_{uuid.uuid4().hex[:8]}.mp4"
    output_path = os.path.join(output_dir, output_filename)

    clips = []
    audio_files_to_cleanup = []
    total_panels = len(panels)

    logger.info(
        f"[Video Compiler] >>> Starting video compilation for project '{project_id}' "
        f"({series_slug} EP #{ep_num}) with {total_panels} panel(s)."
    )

    for idx, panel in enumerate(panels):
        panel_id = panel.get("id") or (idx + 1)
        image_url = panel.get("image_url") or panel.get("url") or ""
        img_name = os.path.basename(image_url) if image_url else f"panel_{panel_id}"

        if not image_url:
            logger.warning(f"[Video Compiler] Panel {idx + 1}/{total_panels} (ID: {panel_id}): Missing image URL. Skipping.")
            continue

        suggested_duration = float(panel.get("duration") or 0)
        if suggested_duration <= 0:
            suggested_duration = 4.0

        # Determine audio prioritization: default is Narratives ON, Dialogue OFF
        narrative_preferred = enable_narrative_audio is not False
        db_p = db_panels_map.get(str(panel_id)) or {}

        if narrative_preferred:
            candidates = [
                panel.get("narrative_audio_url"),
                panel.get("audio_url"),
                panel.get("dialogue_audio_url"),
                panel.get("audio"),
                db_p.get("narrative_audio_url"),
                db_p.get("audio_url"),
                db_p.get("dialogue_audio_url"),
            ]
        else:
            candidates = [
                panel.get("audio_url"),
                panel.get("dialogue_audio_url"),
                panel.get("narrative_audio_url"),
                panel.get("audio"),
                db_p.get("audio_url"),
                db_p.get("dialogue_audio_url"),
                db_p.get("narrative_audio_url"),
            ]

        audio_target = next((c for c in candidates if c and isinstance(c, str) and c.strip()), None)

        audio_path = os.path.join(temp_dir, f"{series_slug}_ep{ep_num}_p{panel_id}_audio_{uuid.uuid4().hex[:6]}.mp3")
        actual_duration = suggested_duration
        has_audio = False

        # Step 1: Re-use pre-synthesized audio if present
        if audio_target and isinstance(audio_target, str) and audio_target.strip():
            audio_target_str = audio_target.strip()
            try:
                # 1a. Base64 Data URI
                if audio_target_str.startswith("data:audio") or audio_target_str.startswith("data:application/octet-stream"):
                    b64_part = audio_target_str.split(",", 1)[-1]
                    raw_audio_bytes = base64.b64decode(b64_part)
                    with open(audio_path, "wb") as f:
                        f.write(raw_audio_bytes)
                    if os.path.exists(audio_path) and os.path.getsize(audio_path) > 0:
                        has_audio = True
                        audio_files_to_cleanup.append(audio_path)
                # 1b. Stitched cache
                elif "/cached/" in audio_target_str:
                    cache_key = audio_target_str.split("/cached/")[-1].split("?")[0].strip("/")
                    cached_obj = stitched_cache.get(cache_key)
                    if cached_obj:
                        raw_data = cached_obj.get("data") if isinstance(cached_obj, dict) else cached_obj
                        if raw_data:
                            with open(audio_path, "wb") as f:
                                f.write(raw_data)
                            if os.path.exists(audio_path) and os.path.getsize(audio_path) > 0:
                                has_audio = True
                                audio_files_to_cleanup.append(audio_path)
                # 1c. Local media directory (/media/...)
                elif "/media/" in audio_target_str:
                    media_filename = audio_target_str.split("/media/")[-1].split("?")[0].strip("/")
                    local_cand = os.path.join(media_dir, media_filename)
                    if os.path.exists(local_cand) and os.path.getsize(local_cand) > 0:
                        shutil.copyfile(local_cand, audio_path)
                        has_audio = True
                        audio_files_to_cleanup.append(audio_path)
                # 1d. Local filesystem path
                elif os.path.exists(audio_target_str) and not os.path.isdir(audio_target_str):
                    shutil.copyfile(audio_target_str, audio_path)
                    if os.path.exists(audio_path) and os.path.getsize(audio_path) > 0:
                        has_audio = True
                        audio_files_to_cleanup.append(audio_path)
                # 1e. Remote HTTP / HTTPS URL
                elif audio_target_str.startswith("http://") or audio_target_str.startswith("https://"):
                    async with httpx.AsyncClient(timeout=15.0) as client:
                        resp = await client.get(audio_target_str)
                        if resp.status_code == 200 and len(resp.content) > 0:
                            with open(audio_path, "wb") as f:
                                f.write(resp.content)
                            if os.path.exists(audio_path) and os.path.getsize(audio_path) > 0:
                                has_audio = True
                                audio_files_to_cleanup.append(audio_path)
            except Exception as e:
                logger.warning(f"[Video Compiler] Panel {panel_id}: Could not load pre-generated audio '{audio_target_str[:50]}': {e}")

        # Check per-panel audio cache key
        if not has_audio:
            pre_cached = stitched_cache.get(f"audio_panel_{panel_id}")
            if pre_cached:
                raw_pre = pre_cached.get("data") if isinstance(pre_cached, dict) else pre_cached
                if raw_pre:
                    try:
                        with open(audio_path, "wb") as f:
                            f.write(raw_pre)
                        if os.path.exists(audio_path) and os.path.getsize(audio_path) > 0:
                            has_audio = True
                            audio_files_to_cleanup.append(audio_path)
                    except Exception:
                        pass

        # Step 2: Determine if audio is present or must be synthesized
        if has_audio:
            # Reusing pre-generated audio: DO NOT synthesize!
            try:
                test_audio = AudioFileClip(audio_path)
                if test_audio.duration and test_audio.duration > 0:
                    duration = max(test_audio.duration, 1.0)
                else:
                    duration = suggested_duration
                test_audio.close()
            except Exception:
                duration = suggested_duration

            logger.info(
                f"[Video Compiler] Panel {idx + 1}/{total_panels} (ID: {panel_id}, Image: {img_name}): "
                f"Reusing existing pre-generated audio ({duration:.1f}s) - Skipping synthesis."
            )
        else:
            # Audio is missing: only synthesize where audio was not created!
            narrative_text = (panel.get("narrative") or panel.get("narrativeText") or db_p.get("narrative") or "").strip()
            speech_text = (panel.get("speech_text") or db_p.get("speech_text") or "").strip()

            text_to_speak = ""
            if narrative_preferred and narrative_text:
                text_to_speak = narrative_text
            elif speech_text:
                text_to_speak = speech_text
            elif narrative_text:
                text_to_speak = narrative_text

            if text_to_speak:
                panel_voice = panel.get("voice") or voice or "en-US-GuyNeural"
                audio_kind = "Narrative" if text_to_speak == narrative_text else "Dialogue"
                logger.info(
                    f"[Video Compiler] Panel {idx + 1}/{total_panels} (ID: {panel_id}, Image: {img_name}): "
                    f"No existing audio found -> Synthesizing {audio_kind} on-the-fly with voice '{panel_voice}'..."
                )
                try:
                    _, actual_duration = await generate_panel_audio(
                        dialogue_list=[text_to_speak],
                        target_duration=suggested_duration,
                        output_path=audio_path,
                        voice=panel_voice,
                        force_duration=False,
                        context_info=f"Render Panel {idx + 1}/{total_panels}",
                    )
                    if os.path.exists(audio_path) and os.path.getsize(audio_path) > 0:
                        has_audio = True
                        audio_files_to_cleanup.append(audio_path)
                        duration = max(actual_duration, 1.0)
                        logger.info(
                            f"[Video Compiler] Panel {idx + 1}/{total_panels} (ID: {panel_id}, Image: {img_name}): "
                            f"Successfully synthesized audio ({actual_duration:.1f}s)."
                        )
                        # Save to cache so subsequent renders or retries find it immediately
                        try:
                            with open(audio_path, "rb") as af:
                                stitched_cache.set(f"audio_panel_{panel_id}", {"data": af.read(), "content_type": "audio/mpeg"})
                        except Exception:
                            pass
                except Exception as e:
                    logger.error(f"[Video Compiler] Panel {idx + 1}/{total_panels} (ID: {panel_id}): Audio synthesis failed: {e}")
                    duration = suggested_duration
            else:
                logger.info(
                    f"[Video Compiler] Panel {idx + 1}/{total_panels} (ID: {panel_id}, Image: {img_name}): "
                    f"No text to synthesize -> Using silent panel ({suggested_duration:.1f}s)."
                )
                duration = suggested_duration

        # Step 3: Fetch image and construct composite frame
        try:
            res = await resolve_image_to_buffer(image_url)
            image_bytes = res["data"]
        except Exception as e:
            logger.error(f"[Video Compiler] Panel {idx + 1}/{total_panels} (ID: {panel_id}): Failed to fetch image: {e}")
            continue

        try:
            with Image.open(io.BytesIO(image_bytes)).convert("RGB") as img:
                composite_frame = build_panel_frame_image(
                    background_image=img,
                    foreground_image=img,
                    target_width=target_width,
                    target_height=target_height,
                )
                frame_array = np.array(composite_frame, dtype=np.uint8)

        except Exception as e:
            logger.error(f"[Video Compiler] Panel {idx + 1}/{total_panels} (ID: {panel_id}): Failed to process frame image: {e}")
            continue

        try:
            composite_clip = ImageClip(frame_array).set_duration(duration)

            if has_audio:
                audio_clip = AudioFileClip(audio_path)
                audio_clip = audio_clip.set_duration(duration)
                composite_clip = composite_clip.set_audio(audio_clip)

            clips.append(composite_clip)
            logger.info(
                f"[Video Compiler] Panel {idx + 1}/{total_panels} (ID: {panel_id}, Image: {img_name}) -> "
                f"Clip ready ({target_width}x{target_height}, {duration:.1f}s, Audio: {'Yes' if has_audio else 'None'})"
            )

        except Exception as e:
            logger.error(f"[Video Compiler] Panel {idx + 1}/{total_panels} (ID: {panel_id}): Failed to build video clip: {e}")
            continue

        # Real-time progress update
        if report_progress:
            prog = 5.0 + ((idx + 1) / total_panels) * 80.0
            report_progress(round(prog, 1))

    if not clips:
        raise RuntimeError("No valid clips were generated. Cannot compile video.")

    logger.info(f"[Video Compiler] Concatenating {len(clips)} panel clips into final MP4 video...")
    if report_progress:
        report_progress(88.0)

    try:
        final_video = concatenate_videoclips(clips, method="chain")

        if report_progress:
            report_progress(92.0)

        def render_video():
            temp_mpy_sound = os.path.join(temp_dir, f"temp_mpy_{uuid.uuid4().hex[:8]}_snd.m4a")
            mpy_logger = MoviePyCompileLogger(report_progress=report_progress)
            final_video.write_videofile(
                output_path,
                fps=24,
                codec="libx264",
                audio_codec="aac",
                threads=4,
                preset="ultrafast",
                logger=mpy_logger,
                bitrate="10000k",
                temp_audiofile=temp_mpy_sound,
                remove_temp=True
            )

        await asyncio.to_thread(render_video)
        render_elapsed = asyncio.get_event_loop().time() - start_compilation_time
        logger.info(
            f"[Video Compiler] <<< Video compilation completed successfully in {render_elapsed:.1f}s: {output_path}"
        )
        if report_progress:
            report_progress(100.0)
    except Exception as e:
        logger.error(f"[Video Compiler] Failed to render final video file: {e}")
        raise e
    finally:
        logger.info("[Video Compiler] Cleaning up temporary working files...")
        for clip in clips:
            try:
                clip.close()
            except:
                pass
        for af in audio_files_to_cleanup:
            try:
                if os.path.exists(af):
                    os.remove(af)
            except:
                pass

    return output_filename


async def process_render_job(
    report_progress: Any,
    job_id: str,
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
    enable_dialogue_audio: Optional[bool] = None,
    enable_narrative_audio: Optional[bool] = None,
    project_id: Optional[str] = None,
) -> Dict[str, str]:
    logger.info(
        f"[VideoService] Starting render job_id='{job_id}' for project_id='{project_id or 'N/A'}' ({len(panels)} panels)"
    )
    report_progress(5.0)

    os.makedirs(_VIDEO_OUTPUT_DIR, exist_ok=True)

    output_filename = await compile_video_from_panels(
        project_id=project_id or job_id,
        panels=panels,
        output_dir=_VIDEO_OUTPUT_DIR,
        voice=voice,
        enable_dialogue_audio=enable_dialogue_audio,
        enable_narrative_audio=enable_narrative_audio,
        report_progress=report_progress,
    )

    video_url = f"/videos/{output_filename}"

    logger.info(
        f"[VideoService] Completed render job_id='{job_id}' -> {video_url} "
        f"(project_id='{project_id or 'N/A'}')"
    )
    return {"video_url": video_url}


# Human-readable aliases
compile_panels_to_video_file = compile_video_from_panels

