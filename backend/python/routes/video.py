import os
import uuid
import time
import logging
import asyncio
import aiohttp
import tempfile
import shutil
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from PIL import Image
import sys

# Ensure the parent package is on the path for service imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from services.audio import generate_panel_audio

# Try importing moviepy; fallback gracefully if not installed
try:
    from moviepy.editor import ImageClip, AudioFileClip, concatenate_videoclips, CompositeVideoClip, CompositeAudioClip
    from proglog import ProgressBarLogger
    HAS_MOVIEPY = True
except ImportError:
    HAS_MOVIEPY = False

router = APIRouter()
logger = logging.getLogger("sonikoma.api.video")

# In-memory job tracking
RENDER_JOBS = {}

class PanelData(BaseModel):
    id: int
    image_url: str
    duration: float = 3.0
    speech_text: Optional[str] = None
    sfx: Optional[str] = None
    audio_url: Optional[str] = None
    motion_type: Optional[str] = None

class RenderRequest(BaseModel):
    panels: List[PanelData]
    voice: Optional[str] = "en-US-GuyNeural"

async def download_asset(url: str, dest_path: str) -> bool:
    if not url:
        return False
    # Handle local API routes
    if url.startswith("/"):
        backend_port = os.getenv("PORT", "5173")
        url = f"http://127.0.0.1:{backend_port}{url}"
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=30) as response:
                if response.status == 200:
                    with open(dest_path, 'wb') as f:
                        f.write(await response.read())
                    return True
                else:
                    logger.error(f"Failed to download {url}: HTTP {response.status}")
                    return False
    except Exception as e:
        logger.error(f"Error downloading {url}: {e}")
        return False

def draw_subtitles_on_image(img: Image.Image, text: str) -> Image.Image:
    """
    Bakes subtitles directly onto a PIL image.
    """
    from PIL import ImageDraw, ImageFont
    w, h = img.size
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    
    try:
        font = ImageFont.truetype("arial.ttf", 40)
    except:
        font = ImageFont.load_default()
        
    lines = []
    words = text.split()
    curr_line = ""
    for word in words:
        test_line = curr_line + " " + word if curr_line else word
        try:
            tw = draw.textlength(test_line, font=font)
        except:
            tw = font.getsize(test_line)[0]

        if tw > w * 0.9:
            lines.append(curr_line)
            curr_line = word
        else:
            curr_line = test_line
    lines.append(curr_line)
    
    line_height = 50
    total_height = len(lines) * line_height
    start_y = h - total_height - 60
    
    # Background box for readability
    draw.rectangle([w*0.05, start_y - 10, w*0.95, start_y + total_height + 10], fill=(0, 0, 0, 160))
    
    for i, line in enumerate(lines):
        try:
            tw = draw.textlength(line, font=font)
        except:
            tw = font.getsize(line)[0]
        draw.text(((w - tw) / 2, start_y + i * line_height), line, font=font, fill=(255, 255, 255, 255))
        
    base_rgba = img.convert("RGBA")
    combined = Image.alpha_composite(base_rgba, overlay)
    return combined.convert("RGB")

class MoviePyProgressLogger(ProgressBarLogger):
    def __init__(self, video_id: str):
        super().__init__()
        self.video_id = video_id

    def bars_callback(self, bar, attr, value, old_value=None):
        if bar == "t" and attr == "index":
            total = self.bars[bar].get("total")
            if total and total > 0:
                progress = 50 + int((value / total) * 45)
                progress = min(progress, 95)
                if self.video_id in RENDER_JOBS:
                    RENDER_JOBS[self.video_id]["progress"] = progress

def render_pipeline_sync(video_id: str, panels_data: List[Dict[str, Any]], output_path: str):
    """
    Stitches panels together into a final video file.
    """
    if not HAS_MOVIEPY:
        raise Exception("moviepy is not installed.")
        
    clips = []
    sfx_clips = []
    current_global_time = 0.0
    
    for i, p in enumerate(panels_data):
        img_path = p["local_img"]
        audio_path = p.get("local_audio")
        # Start with requested duration, but audio will override if present
        duration = p["duration"]
        sfx_name = p.get("sfx")

        if not os.path.exists(img_path):
            logger.warning(f"Image not found for panel {i}: {img_path}")
            continue

        # CRITICAL: Match visual duration to natural audio duration
        if audio_path and os.path.exists(audio_path):
            try:
                audio_clip_temp = AudioFileClip(audio_path)
                duration = audio_clip_temp.duration
                audio_clip_temp.close()
                logger.info(f"Panel {i}: Synced duration to audio length: {duration:.2f}s")
            except Exception as e:
                logger.error(f"Failed to read audio duration for panel {i}: {e}")

        safe_duration = max(duration, 0.2) # Minimum duration safety
        # Avoid overlapping voices: MoviePy overlaps clips by 0.5s on concatenation.
        # To prevent the voice audio from overlapping with the next panel's voice,
        # we extend the visual duration of all non-last panels by 0.5s.
        if i < len(panels_data) - 1:
            safe_duration += 0.5

        clip = ImageClip(img_path).set_duration(safe_duration)
        
        # CRITICAL FIX: Downscale to 720p before animation.
        # Rendering 4K images with zoom/crop is extremely slow. 
        # 720p is visually indistinguishable in a 1080p final video but 60% faster to render.
        if clip.h > 720 or clip.w > 720:
            clip = clip.resize(height=720) # Resizes width proportionally

        # Attach audio to this visual clip
        if audio_path and os.path.exists(audio_path):
            try:
                # set_audio returns a copy
                raw_audio = AudioFileClip(audio_path)
                if safe_duration > raw_audio.duration:
                    panel_audio = CompositeAudioClip([raw_audio]).set_duration(safe_duration)
                else:
                    panel_audio = raw_audio.set_duration(safe_duration)
                clip = clip.set_audio(panel_audio)
            except Exception as e:
                logger.error(f"Failed to attach audio to clip {i}: {e}")

        # Schedule SFX
        if sfx_name and sfx_name.strip():
            sfx_path = os.path.join(os.getcwd(), "public", "audio", "sfx", f"{sfx_name.strip()}.mp3")
            if os.path.exists(sfx_path):
                try:
                    sfx_clip = AudioFileClip(sfx_path).volumex(0.4).set_start(current_global_time)
                    sfx_clips.append(sfx_clip)
                except Exception as e:
                    logger.error(f"Failed to load SFX {sfx_name}: {e}")

        # Basic Motion
        motion_type = p.get("motion_type")
        w, h = clip.size
        if motion_type == "zoom_in":
            clip = clip.resize(lambda t: 1 + 0.08 * (t / safe_duration))
        elif motion_type in ["pan_left", "pan_right", "pan_up", "pan_down"]:
            # Simple constant zoom for pans to avoid edge bleed
            clip = clip.resize(1.15)

        # Flatten layers (subtitles are pre-baked into the image in process_render_job)
        panel_composite = CompositeVideoClip([clip.set_position(('center', 'center'))], size=(w, h)).set_duration(safe_duration)

        # Crossfade transition (except first)
        if i > 0:
            panel_composite = panel_composite.crossfadein(0.5)

        clips.append(panel_composite)
        
        # Time tracking for global audio (SFX/BGM)
        # Note: concatenate_videoclips with padding -0.5 overlaps them
        current_global_time += safe_duration
        if i < len(panels_data) - 1:
            current_global_time -= 0.5

    if not clips:
        raise Exception("No valid clips were generated for rendering.")

    # Stitch video sequence
    final_video = concatenate_videoclips(clips, padding=-0.5, method="compose")
    
    # Mix Audio
    audio_tracks = []
    if final_video.audio:
        audio_tracks.append(final_video.audio)
    
    # BGM loop
    bgm_path = os.path.join(os.getcwd(), "public", "audio", "bgm", "theme.mp3")
    if os.path.exists(bgm_path):
        try:
            import moviepy.audio.fx.all as afx
            bgm_clip = AudioFileClip(bgm_path).volumex(0.1)
            audio_tracks.append(afx.audio_loop(bgm_clip, duration=final_video.duration))
        except Exception as e:
            logger.error(f"BGM Error: {e}")
            
    audio_tracks.extend(sfx_clips)
    
    if audio_tracks:
        try:
            final_audio = CompositeAudioClip(audio_tracks).set_duration(final_video.duration)
            final_video = final_video.set_audio(final_audio)
        except Exception as e:
            logger.error(f"Final audio mix error: {e}")
            
    # Render to disk
    progress_logger = MoviePyProgressLogger(video_id) if HAS_MOVIEPY else None
    final_video.write_videofile(
        output_path, 
        fps=24, 
        codec="libx264", 
        audio_codec="aac", 
        logger=progress_logger,
        threads=4,
        preset="ultrafast"
    )
    
    # Cleanup memory
    for c in clips:
        try: c.close()
        except: pass
    final_video.close()

async def process_render_job(video_id: str, panels: List[PanelData], voice: Optional[str]):
    work_dir = os.path.join(os.getcwd(), "temp", f"render_{video_id}")
    os.makedirs(work_dir, exist_ok=True)
    
    output_filename = f"final_render_{video_id}.mp4"
    output_path = os.path.join(os.getcwd(), "public", "videos", output_filename)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    try:
        panels_data = []
        RENDER_JOBS[video_id]["progress"] = 1

        # 1. Asset Downloads (1% to 25%)
        total_panels = len(panels)
        for idx, panel in enumerate(panels):
            img_ext = panel.image_url.split(".")[-1].split("?")[0] if "." in panel.image_url else "jpg"
            if len(img_ext) > 4: img_ext = "jpg"
            raw_img_path = os.path.join(work_dir, f"panel_raw_{idx}.{img_ext}")
            local_img_path = os.path.join(work_dir, f"panel_{idx}.jpg")
            
            p_dict = {
                "id": panel.id,
                "duration": panel.duration if panel.duration > 0 else 3.0,
                "local_img": local_img_path,
                "raw_img": raw_img_path,
                "local_audio": None,
                "speech_text": panel.speech_text,
                "motion_type": panel.motion_type,
                "sfx": panel.sfx
            }
            
            await download_asset(panel.image_url, raw_img_path)
            if panel.audio_url:
                audio_path = os.path.join(work_dir, f"audio_{idx}.mp3")
                if await download_asset(panel.audio_url, audio_path):
                    p_dict["local_audio"] = audio_path

            panels_data.append(p_dict)
            if total_panels > 0:
                progress = 1 + int(((idx + 1) / total_panels) * 24)
                RENDER_JOBS[video_id]["progress"] = min(progress, 25)

        # 2. Missing TTS Generation (25% to 40%)
        tts_tasks = []
        tts_mapping = []
        for idx, p_dict in enumerate(panels_data):
            if not p_dict["local_audio"] and p_dict["speech_text"] and p_dict["speech_text"].strip():
                audio_path = os.path.join(work_dir, f"audio_gen_{idx}.mp3")
                p_dict["local_audio"] = audio_path
                tts_tasks.append(generate_panel_audio(
                    dialogue_list=[p_dict["speech_text"].strip()],
                    target_duration=p_dict["duration"],
                    output_path=audio_path,
                    voice=voice or "en-US-GuyNeural",
                    force_duration=False
                ))
                tts_mapping.append(p_dict)

        if tts_tasks:
            logger.info(f"[Render] Generating TTS for {len(tts_tasks)} panels.")
            completed_tts = 0
            total_tts = len(tts_tasks)
            async def wrapped_tts_task(task, mapping_dict):
                nonlocal completed_tts
                res = await task
                completed_tts += 1
                progress = 25 + int((completed_tts / total_tts) * 15)
                RENDER_JOBS[video_id]["progress"] = min(progress, 40)
                return res
            
            wrapped_tasks = [wrapped_tts_task(task, tts_mapping[i]) for i, task in enumerate(tts_tasks)]
            results = await asyncio.gather(*wrapped_tasks)
            for i, (_, actual_dur) in enumerate(results):
                tts_mapping[i]["duration"] = actual_dur
        else:
            RENDER_JOBS[video_id]["progress"] = 40

        # 3. Image Prep (Layout) (40% to 50%)
        from PIL import Image
        tall_count = 0
        for p in panels_data:
            if os.path.exists(p["raw_img"]):
                try:
                    with Image.open(p["raw_img"]) as img:
                        if img.height > 8000:
                            raise Exception(f"Panel #{p['id']} is too tall ({img.height}px). Slice it first.")
                        if img.height > img.width: tall_count += 1
                except Exception as e:
                    if "too tall" in str(e): raise e

        target_w, target_h = (1080, 1920) if tall_count > len(panels_data)/2 else (1920, 1080)

        for idx, p in enumerate(panels_data):
            if os.path.exists(p["raw_img"]):
                with Image.open(p["raw_img"]) as img:
                    img = img.convert("RGB")
                    scale = min(target_w / img.width, target_h / img.height)
                    nw, nh = int(img.width * scale), int(img.height * scale)
                    # Even dims for ffmpeg
                    resized = img.resize((max(2, nw - nw%2), max(2, nh - nh%2)), Image.Resampling.LANCZOS)
                    bg = Image.new("RGB", (target_w, target_h), (0, 0, 0))
                    bg.paste(resized, ((target_w - resized.width)//2, (target_h - resized.height)//2))
                    
                    # Bake subtitles if present (Disabled as requested)
                    # if p.get("speech_text") and p["speech_text"].strip():
                    #     bg = draw_subtitles_on_image(bg, p["speech_text"].strip())
                        
                    bg.save(p["local_img"], "JPEG")
            
            if len(panels_data) > 0:
                progress = 40 + int(((idx + 1) / len(panels_data)) * 10)
                RENDER_JOBS[video_id]["progress"] = min(progress, 50)

        RENDER_JOBS[video_id]["progress"] = 50

        # 4. Rendering (50% to 95%)
        logger.info(f"[Render] Starting MoviePy pipeline for {video_id}")
        await asyncio.to_thread(render_pipeline_sync, video_id, panels_data, output_path)

        final_video_url = f"/videos/{output_filename}"

        # 5. Supabase Upload (95% to 100%)
        try:
            from supabase import create_client
            s_url = os.environ.get("SUPABASE_URL")
            s_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
            if s_url and s_key:
                RENDER_JOBS[video_id]["progress"] = 96
                with open(output_path, "rb") as f:
                    create_client(s_url, s_key).storage.from_("videos").upload(output_filename, f, {"content-type": "video/mp4", "upsert": "true"})
                final_video_url = create_client(s_url, s_key).storage.from_("videos").get_public_url(output_filename)
        except Exception as e:
            logger.error(f"Supabase Error: {e}")

        RENDER_JOBS[video_id].update({"progress": 100, "status": "completed", "url": final_video_url})
        logger.info(f"[Render] Successfully completed job {video_id}")

    except Exception as e:
        logger.error(f"[Render] Job {video_id} failed: {e}", exc_info=True)
        RENDER_JOBS[video_id].update({"status": "failed", "error": str(e)})
    finally:
        if os.path.exists(work_dir):
            shutil.rmtree(work_dir)
        # Cleanup local file if successfully uploaded or if job failed
        if os.path.exists(output_path):
            info = RENDER_JOBS.get(video_id, {})
            if info.get("status") == "failed" or info.get("url", "").startswith("http"):
                try: os.remove(output_path)
                except: pass

@router.post("/render")
async def render_video(request: RenderRequest, background_tasks: BackgroundTasks):
    if not HAS_MOVIEPY:
        raise HTTPException(status_code=500, detail="moviepy not installed on server.")
    if not request.panels:
        raise HTTPException(status_code=400, detail="Panel list is empty.")

    video_id = str(uuid.uuid4())[:8]
    RENDER_JOBS[video_id] = {"status": "processing", "progress": 0, "url": None}
    background_tasks.add_task(process_render_job, video_id, request.panels, request.voice)

    return {"success": True, "job_id": video_id}

@router.get("/status/{job_id}")
async def get_render_status(job_id: str):
    job = RENDER_JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
