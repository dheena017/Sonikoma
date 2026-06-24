import os
import uuid
import time
import logging
import asyncio
import aiohttp
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
import sys

# Try importing moviepy; fallback gracefully if not installed
try:
    from moviepy.editor import ImageClip, AudioFileClip, concatenate_videoclips
    HAS_MOVIEPY = True
except ImportError:
    HAS_MOVIEPY = False

router = APIRouter()
logger = logging.getLogger("sonikoma.api.video")

# Step 11: In-memory job tracking
RENDER_JOBS = {}

class PanelData(BaseModel):
    id: int
    image_url: str
    speech_text: Optional[str] = None
    sfx: Optional[str] = None
    audio_url: Optional[str] = None
    motion_type: Optional[str] = None

class RenderRequest(BaseModel):
    panels: List[PanelData]

async def download_asset(url: str, dest_path: str):
    if not url:
        return False
        
    # Handle local API routes
    if url.startswith("/"):
        backend_port = os.getenv("PORT", "5173")
        url = f"http://127.0.0.1:{backend_port}{url}"

    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
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

def create_subtitle_clip(text, w, h, duration):
    try:
        from moviepy.editor import TextClip
        # We try moviepy's TextClip which uses ImageMagick
        txt_clip = TextClip(text, fontsize=40, color='white', font='Arial-Bold', 
                            bg_color='rgba(0,0,0,0.6)', 
                            method='caption', size=(int(w*0.9), None))
        return txt_clip.set_duration(duration)
    except Exception as e:
        logger.warning(f"TextClip failed, using PIL fallback: {e}")
        from PIL import Image, ImageDraw, ImageFont
        import numpy as np
        from moviepy.editor import ImageClip
        
        img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        try:
            font = ImageFont.truetype("arial.ttf", 40)
        except:
            font = ImageFont.load_default()
            
        lines = []
        words = text.split()
        curr_line = ""
        for word in words:
            test_line = curr_line + " " + word if curr_line else word
            # Using basic textlength for compatibility
            text_w = draw.textlength(test_line, font=font) if hasattr(draw, 'textlength') else font.getsize(test_line)[0]
            if text_w > w * 0.9:
                lines.append(curr_line)
                curr_line = word
            else:
                curr_line = test_line
        lines.append(curr_line)
        
        line_height = 50
        total_height = len(lines) * line_height
        start_y = h - total_height - 40
        
        draw.rectangle([w*0.05, start_y - 10, w*0.95, start_y + total_height + 10], fill=(0, 0, 0, 160))
        
        for i, line in enumerate(lines):
            text_w = draw.textlength(line, font=font) if hasattr(draw, 'textlength') else font.getsize(line)[0]
            x = (w - text_w) / 2
            y = start_y + i * line_height
            draw.text((x, y), line, font=font, fill=(255, 255, 255, 255))
            
        return ImageClip(np.array(img)).set_duration(duration)

def render_pipeline_sync(panels_data, output_path, work_dir):
    """
    Synchronous function to run moviepy operations so we don't block the async loop.
    """
    if not HAS_MOVIEPY:
        raise Exception("moviepy is not installed. Run pip install moviepy.")
        
    from moviepy.editor import CompositeVideoClip

    clips = []
    sfx_clips = []
    current_global_time = 0.0
    
    for i, p in enumerate(panels_data):
        img_path = p["local_img"]
        audio_path = p.get("local_audio")
        duration = p["duration"]
        sfx_name = p.get("sfx")

        if not os.path.exists(img_path):
            continue

        clip = ImageClip(img_path).set_duration(duration)
        
        if audio_path and os.path.exists(audio_path):
            try:
                audio_clip = AudioFileClip(audio_path).set_duration(min(duration, AudioFileClip(audio_path).duration))
                clip = clip.set_audio(audio_clip)
            except Exception as e:
                logger.error(f"Failed to attach audio {audio_path}: {e}")

        # Step 12: Schedule SFX
        safe_duration = max(duration, 0.1)
        if sfx_name and sfx_name.strip():
            sfx_path = os.path.join(os.getcwd(), "public", "audio", "sfx", f"{sfx_name.strip()}.mp3")
            if os.path.exists(sfx_path):
                try:
                    from moviepy.editor import AudioFileClip
                    sfx_clip = AudioFileClip(sfx_path).volumex(0.4)
                    sfx_clip = sfx_clip.set_start(current_global_time)
                    sfx_clips.append(sfx_clip)
                except Exception as e:
                    logger.error(f"Failed to load SFX {sfx_path}: {e}")

        # Dynamic Camera Motion (Ken Burns Effect)
        motion_type = p.get("motion_type")
        w, h = clip.size

        if motion_type == "zoom_in":
            clip = clip.resize(lambda t: 1 + 0.08 * (t / safe_duration))
        elif motion_type == "pan_left":
            clip = clip.resize(1.15)
            clip = clip.crop(x1=lambda t: (clip.w - w) * (1 - t/safe_duration), y1=0, width=w, height=h)
        elif motion_type == "pan_right":
            clip = clip.resize(1.15)
            clip = clip.crop(x1=lambda t: (clip.w - w) * (t/safe_duration), y1=0, width=w, height=h)
        elif motion_type == "pan_up":
            clip = clip.resize(1.15)
            clip = clip.crop(x1=0, y1=lambda t: (clip.h - h) * (1 - t/safe_duration), width=w, height=h)
        elif motion_type == "pan_down":
            clip = clip.resize(1.15)
            clip = clip.crop(x1=0, y1=lambda t: (clip.h - h) * (t/safe_duration), width=w, height=h)

        # Step 9: Burned-in Subtitles
        speech_text = p.get("speech_text")
        layers = [clip.set_position(('center', 'center'))]
        
        if speech_text and speech_text.strip():
            txt_clip = create_subtitle_clip(speech_text, w, h, safe_duration)
            layers.append(txt_clip.set_position(('center', 'bottom')))
            
        # Lock everything into a static size container to prevent drift
        clip = CompositeVideoClip(layers, size=(w, h)).set_duration(safe_duration)

        # Basic Crossfade (0.5 second) between image sequences
        if i > 0:
            clip = clip.crossfadein(0.5)

        clips.append(clip)
        
        # Calculate start time for the next panel (accounting for -0.5s padding overlap)
        current_global_time += safe_duration
        current_global_time -= 0.5

    if not clips:
        raise Exception("No valid clips were generated.")

    # Stitch them together with a -0.5s overlap to enable the crossfade
    final_clip = concatenate_videoclips(clips, padding=-0.5, method="compose")
    
    # Step 10 & 12: Multi-Track Audio Mixing (BGM + SFX)
    from moviepy.editor import AudioFileClip, CompositeAudioClip
    import moviepy.audio.fx.all as afx
    
    audio_tracks = []
    if final_clip.audio is not None:
        audio_tracks.append(final_clip.audio)
    
    bgm_path = os.path.join(os.getcwd(), "public", "audio", "bgm", "theme.mp3")
    if os.path.exists(bgm_path):
        try:
            # Load BGM, lower volume to 10%, and loop to match total video duration
            bgm_clip = AudioFileClip(bgm_path).volumex(0.1)
            bgm_clip = afx.audio_loop(bgm_clip, duration=final_clip.duration)
            audio_tracks.append(bgm_clip)
        except Exception as e:
            logger.error(f"Failed to load BGM audio: {e}")
            
    # Add scheduled SFX tracks
    audio_tracks.extend(sfx_clips)
    
    if audio_tracks:
        try:
            final_audio = CompositeAudioClip(audio_tracks)
            final_clip = final_clip.set_audio(final_audio)
        except Exception as e:
            logger.error(f"Failed to mix final audio: {e}")
            
    # Write to file
    final_clip.write_videofile(
        output_path, 
        fps=24, 
        codec="libx264", 
        audio_codec="aac", 
        logger=None # Disable moviepy terminal spam
    )
    
    # Close clips
    for c in clips:
        c.close()
    final_clip.close()

async def process_render_job(video_id: str, panels: List[PanelData]):
    work_dir = os.path.join(os.getcwd(), "temp", f"render_{video_id}")
    os.makedirs(work_dir, exist_ok=True)
    
    output_filename = f"final_render_{video_id}.mp4"
    output_dir = os.path.join(os.getcwd(), "public", "videos")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, output_filename)

    try:
        panels_data = []
        download_tasks = []

        # 1. Download all assets
        RENDER_JOBS[video_id]["progress"] = 15
        for idx, panel in enumerate(panels):
            img_ext = panel.image_url.split(".")[-1].split("?")[0] if "." in panel.image_url else "jpg"
            if len(img_ext) > 4: img_ext = "jpg"
            img_path = os.path.join(work_dir, f"panel_{idx}.{img_ext}")
            
            p_data = {
                "id": panel.id,
                "duration": panel.duration if panel.duration > 0 else 3.0,
                "local_img": img_path,
                "local_audio": None,
                "speech_text": panel.speech_text,
                "motion_type": panel.motion_type,
                "sfx": panel.sfx
            }
            
            download_tasks.append(download_asset(panel.image_url, img_path))
            
            if panel.audio_url:
                audio_ext = "mp3"
                audio_path = os.path.join(work_dir, f"audio_{idx}.{audio_ext}")
                p_data["local_audio"] = audio_path
                download_tasks.append(download_asset(panel.audio_url, audio_path))
                
            panels_data.append(p_data)

        logger.info(f"Downloading {len(download_tasks)} assets...")
        results = await asyncio.gather(*download_tasks)
        if not any(results):
             raise Exception("Failed to download video assets.")

        RENDER_JOBS[video_id]["progress"] = 40

        # 2. Stitch using MoviePy in a thread
        logger.info("Starting video compilation using MoviePy...")
        await asyncio.to_thread(render_pipeline_sync, panels_data, output_path, work_dir)

        logger.info(f"Render completed: {output_path}")
        
        # Step 13: Supabase Storage Integration
        final_video_url = f"/videos/{output_filename}"
        try:
            from supabase import create_client, Client
            url = os.environ.get("SUPABASE_URL", "")
            key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", os.environ.get("SUPABASE_ANON_KEY", ""))
            
            if url and key:
                supabase: Client = create_client(url, key)
                with open(output_path, "rb") as f:
                    # Upload to 'videos' bucket
                    supabase.storage.from_("videos").upload(
                        file=f, 
                        path=output_filename, 
                        file_options={"content-type": "video/mp4", "upsert": "true"}
                    )
                
                # Get public URL
                final_video_url = supabase.storage.from_("videos").get_public_url(output_filename)
                logger.info(f"Uploaded to Supabase Storage: {final_video_url}")
            else:
                logger.warning("Supabase credentials not found. Falling back to local URL.")
        except Exception as e:
            logger.error(f"Supabase upload failed, falling back to local: {e}")
        
        RENDER_JOBS[video_id]["progress"] = 100
        RENDER_JOBS[video_id]["status"] = "completed"
        RENDER_JOBS[video_id]["url"] = final_video_url

    except Exception as e:
        logger.error(f"Render failed: {e}", exc_info=True)
        RENDER_JOBS[video_id]["status"] = "failed"
        RENDER_JOBS[video_id]["error"] = str(e)


@router.post("/render")
async def render_video(request: RenderRequest, background_tasks: BackgroundTasks):
    logger.info(f"Received render request for {len(request.panels)} panels.")
    
    if not HAS_MOVIEPY:
        logger.error("moviepy is not installed.")
        raise HTTPException(status_code=500, detail="moviepy is not installed on the backend.")

    if not request.panels:
        raise HTTPException(status_code=400, detail="No panels provided for rendering.")

    video_id = str(uuid.uuid4())[:8]
    
    # Initialize job tracking
    RENDER_JOBS[video_id] = {
        "status": "processing",
        "progress": 0,
        "url": None
    }
    
    # Delegate to background task
    background_tasks.add_task(process_render_job, video_id, request.panels)
    
    return {
        "success": True,
        "job_id": video_id,
        "message": "Render job started in the background."
    }

@router.get("/status/{job_id}")
async def get_render_status(job_id: str):
    job = RENDER_JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
