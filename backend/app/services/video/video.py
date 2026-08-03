import os
import io
import uuid
import tempfile
import asyncio
import logging
import numpy as np
from PIL import Image, ImageFilter
from typing import List, Dict, Any
from moviepy.editor import ImageClip, AudioFileClip, concatenate_videoclips
from media.audio.audio import generate_panel_audio
from services.image.utils.image_utils import resolve_image_to_buffer

logger = logging.getLogger("sonikoma.services.video")


def build_panel_frame_image(
    background_image: Image.Image,
    foreground_image: Image.Image,
    target_width: int = 1920,
    target_height: int = 1080,
) -> Image.Image:
    """Create a single RGB frame that combines a blurred background with a centered foreground."""
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
    output_dir: str,
    target_width: int = 1920,
    target_height: int = 1080
) -> str:
    """
    Compiles a final video from a list of panels.
    Each panel becomes a video clip containing:
    1. A blurred background (the panel stretched and blurred).
    2. The original panel centered in the foreground preserving its aspect ratio.
    3. Audio generated via TTS based on the panel's speech_text.
    """
    if not panels:
        raise ValueError("No panels provided for video compilation.")

    # Normalize panel items (e.g., Pydantic PanelData objects) to dicts
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

    # Resolve data root directory (c:\Users\dheen\project\Sonikoma\data)
    backend_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    project_root = os.path.abspath(os.path.join(backend_root, ".."))
    data_dir = os.path.join(project_root, "data")
    temp_dir = os.path.join(data_dir, "temp")
    media_dir = os.path.join(data_dir, "media")

    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(temp_dir, exist_ok=True)
    os.makedirs(media_dir, exist_ok=True)

    # Derive structured output filename (series_title_ep_1_panel_X...)
    first_panel = panels[0] if panels else {}
    series_slug = (first_panel.get("series_title") or first_panel.get("series_slug") or "series").lower()
    series_slug = "".join(c if c.isalnum() else "_" for c in series_slug).strip("_") or "series"
    ep_num = first_panel.get("episode_num") or first_panel.get("chapter_num") or "1"

    output_filename = f"{series_slug}_ep{ep_num}_compiled_{uuid.uuid4().hex[:8]}.mp4"
    output_path = os.path.join(output_dir, output_filename)

    clips = []
    audio_files_to_cleanup = []

    logger.info(f"[Video Compiler] Starting compilation for project {project_id} ({series_slug} EP #{ep_num}) with {len(panels)} panels.")

    for idx, panel in enumerate(panels):
        panel_id = panel.get("id") or (idx + 1)
        logger.info(f"[Video Compiler] Processing panel {idx + 1}/{len(panels)} (ID: {panel_id})")

        image_url = panel.get("image_url")
        if not image_url:
            logger.warning(f"Panel {idx + 1} is missing an image_url. Skipping.")
            continue

        # Initial suggested duration
        suggested_duration = float(panel.get("duration", 4.5))
        if suggested_duration <= 0:
            suggested_duration = 4.5

        speech_text = panel.get("speech_text", "").strip()

        # 1. Generate Audio first to get precise duration into data/temp
        audio_path = os.path.join(temp_dir, f"{series_slug}_ep{ep_num}_p{panel_id}_audio_{uuid.uuid4().hex[:6]}.mp3")
        actual_duration = suggested_duration
        has_audio = False

        try:
            dialogue_list = [speech_text] if speech_text else []
            if dialogue_list:
                _, actual_duration = await generate_panel_audio(
                    dialogue_list=dialogue_list,
                    target_duration=suggested_duration,
                    output_path=audio_path,
                    voice="en-US-GuyNeural",
                    force_duration=False # Use natural duration to avoid trailing silence
                )
                if os.path.exists(audio_path) and os.path.getsize(audio_path) > 0:
                    has_audio = True
                    audio_files_to_cleanup.append(audio_path)
                    # Use natural audio duration for the visual clip as well
                    duration = actual_duration
                else:
                    duration = suggested_duration
            else:
                duration = suggested_duration
        except Exception as e:
            logger.error(f"Failed to generate audio for panel {idx + 1}: {e}")
            duration = suggested_duration

        # 2. Fetch image buffer
        try:
            res = await resolve_image_to_buffer(image_url)
            image_bytes = res["data"]
        except Exception as e:
            logger.error(f"Failed to fetch image for panel {idx + 1}: {e}")
            continue

        # 3. Process images with PIL
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
            logger.error(f"Failed to process PIL images for panel {idx + 1}: {e}")
            continue

        # 4. Create MoviePy Clips
        try:
            composite_clip = ImageClip(frame_array).set_duration(duration)

            if has_audio:
                audio_clip = AudioFileClip(audio_path)
                audio_clip = audio_clip.set_duration(duration)
                composite_clip = composite_clip.set_audio(audio_clip)

        except Exception as e:
            logger.error(f"Failed to create MoviePy clip for panel {idx + 1}: {e}")
            continue

        clips.append(composite_clip)

    if not clips:
        raise RuntimeError("No valid clips were generated. Cannot compile video.")

    logger.info(f"[Video Compiler] Concatenating {len(clips)} clips...")

    # 5. Concatenate and Render into data/media directory
    try:
        final_video = concatenate_videoclips(clips, method="chain")

        def render_video():
            temp_mpy_sound = os.path.join(temp_dir, f"temp_mpy_{uuid.uuid4().hex[:8]}_snd.m4a")
            final_video.write_videofile(
                output_path,
                fps=24,
                codec="libx264",
                audio_codec="aac",
                threads=4,
                preset="ultrafast",
                logger=None,
                bitrate="10000k",
                temp_audiofile=temp_mpy_sound,
                remove_temp=True
            )

        await asyncio.to_thread(render_video)

        logger.info(f"[Video Compiler] Video compilation successful: {output_path}")
    except Exception as e:
        logger.error(f"[Video Compiler] Failed to render video: {e}")
        raise e
    finally:
        # Cleanup
        logger.info("[Video Compiler] Cleaning up temporary files...")
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
