import os
import io
import uuid
import tempfile
import asyncio
import logging
import numpy as np
from PIL import Image, ImageFilter
from typing import List, Dict, Any
try:
    from moviepy import ImageClip, CompositeVideoClip, AudioFileClip, concatenate_videoclips
except ImportError:
    from moviepy.editor import ImageClip, CompositeVideoClip, AudioFileClip, concatenate_videoclips
from services.audio import generate_panel_audio
from utils.image_utils import resolve_image_to_buffer

logger = logging.getLogger("anivox.services.video")

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

    os.makedirs(output_dir, exist_ok=True)
    temp_dir = tempfile.gettempdir()
    
    output_filename = f"compiled_{project_id}_{uuid.uuid4().hex[:8]}.mp4"
    output_path = os.path.join(output_dir, output_filename)

    clips = []
    audio_files_to_cleanup = []

    logger.info(f"[Video Compiler] Starting compilation for project {project_id} with {len(panels)} panels.")

    for idx, panel in enumerate(panels):
        logger.info(f"[Video Compiler] Processing panel {idx + 1}/{len(panels)}")
        
        image_url = panel.get("image_url")
        if not image_url:
            logger.warning(f"Panel {idx + 1} is missing an image_url. Skipping.")
            continue

        duration = float(panel.get("duration", 4.5))
        if duration <= 0:
            duration = 4.5

        speech_text = panel.get("speech_text", "").strip()

        # 1. Fetch image buffer
        try:
            res = await resolve_image_to_buffer(image_url)
            image_bytes = res["data"]
        except Exception as e:
            logger.error(f"Failed to fetch image for panel {idx + 1}: {e}")
            continue

        # 2. Process images with PIL
        try:
            img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            img_w, img_h = img.size

            # Create blurred background
            # We want it to cover the entire target area. We can crop to aspect ratio then resize, or just resize and distort.
            # Usually, stretching and heavily blurring looks fine for background.
            bg_img = img.resize((target_width, target_height), Image.Resampling.LANCZOS)
            bg_img = bg_img.filter(ImageFilter.GaussianBlur(30)) # Heavy blur
            bg_array = np.array(bg_img)

            # Create foreground image maintaining aspect ratio
            scale = min(target_width / img_w, target_height / img_h)
            new_w = max(1, int(img_w * scale))
            new_h = max(1, int(img_h * scale))
            fg_img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
            fg_array = np.array(fg_img)

        except Exception as e:
            logger.error(f"Failed to process PIL images for panel {idx + 1}: {e}")
            continue

        # 3. Create MoviePy Clips
        try:
            bg_clip = ImageClip(bg_array).set_duration(duration)
            fg_clip = ImageClip(fg_array).set_duration(duration).set_position("center")
            
            composite_clip = CompositeVideoClip([bg_clip, fg_clip], size=(target_width, target_height))
        except Exception as e:
            logger.error(f"Failed to create MoviePy clip for panel {idx + 1}: {e}")
            continue

        # 4. Generate Audio
        audio_path = os.path.join(temp_dir, f"audio_{uuid.uuid4().hex[:8]}.mp3")
        try:
            dialogue_list = [speech_text] if speech_text else []
            await generate_panel_audio(
                dialogue_list=dialogue_list,
                target_duration=duration,
                output_path=audio_path,
                voice="en-US-GuyNeural"
            )
            
            if os.path.exists(audio_path):
                audio_clip = AudioFileClip(audio_path)
                # Ensure the audio matches the video duration exactly
                audio_clip = audio_clip.set_duration(duration)
                composite_clip = composite_clip.set_audio(audio_clip)
                audio_files_to_cleanup.append(audio_path)
        except Exception as e:
            logger.error(f"Failed to generate audio for panel {idx + 1}: {e}")
            # Will proceed without audio if generation fails

        clips.append(composite_clip)

    if not clips:
        raise RuntimeError("No valid clips were generated. Cannot compile video.")

    logger.info(f"[Video Compiler] Concatenating {len(clips)} clips...")
    
    # 5. Concatenate and Render
    try:
        final_video = concatenate_videoclips(clips, method="compose")
        
        # We must use asyncio.to_thread because moviepy's write_videofile is blocking
        def render_video():
            final_video.write_videofile(
                output_path,
                fps=24,
                codec="libx264",
                audio_codec="aac",
                threads=4,
                preset="ultrafast",
                logger=None # Disable moviepy console bar logging which pollutes stdout
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
