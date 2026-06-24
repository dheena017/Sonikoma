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

class PanelData(BaseModel):
    id: int
    image_url: str
    duration: float
    speech_text: Optional[str] = None
    sfx: Optional[str] = None
    audio_url: Optional[str] = None

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

def render_pipeline_sync(panels_data, output_path, work_dir):
    """
    Synchronous function to run moviepy operations so we don't block the async loop.
    """
    if not HAS_MOVIEPY:
        raise Exception("moviepy is not installed. Run pip install moviepy.")

    clips = []
    for p in panels_data:
        img_path = p["local_img"]
        audio_path = p.get("local_audio")
        duration = p["duration"]

        if not os.path.exists(img_path):
            continue

        clip = ImageClip(img_path).set_duration(duration)
        
        if audio_path and os.path.exists(audio_path):
            try:
                audio_clip = AudioFileClip(audio_path).set_duration(min(duration, AudioFileClip(audio_path).duration))
                clip = clip.set_audio(audio_clip)
            except Exception as e:
                logger.error(f"Failed to attach audio {audio_path}: {e}")

        # Basic Crossfade (1 second) if needed, simplified for placeholder
        clips.append(clip)

    if not clips:
        raise Exception("No valid clips were generated.")

    # Stitch them together
    final_clip = concatenate_videoclips(clips, method="compose")
    
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

@router.post("/render")
async def render_video(request: RenderRequest):
    logger.info(f"Received render request for {len(request.panels)} panels.")
    
    if not HAS_MOVIEPY:
        logger.error("moviepy is not installed.")
        raise HTTPException(status_code=500, detail="moviepy is not installed on the backend.")

    if not request.panels:
        raise HTTPException(status_code=400, detail="No panels provided for rendering.")

    video_id = str(uuid.uuid4())[:8]
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
        for idx, panel in enumerate(request.panels):
            img_ext = panel.image_url.split(".")[-1].split("?")[0] if "." in panel.image_url else "jpg"
            if len(img_ext) > 4: img_ext = "jpg"
            img_path = os.path.join(work_dir, f"panel_{idx}.{img_ext}")
            
            p_data = {
                "id": panel.id,
                "duration": panel.duration if panel.duration > 0 else 3.0,
                "local_img": img_path,
                "local_audio": None
            }
            
            # Queue image download
            download_tasks.append(download_asset(panel.image_url, img_path))
            
            if panel.audio_url:
                audio_ext = "mp3"
                audio_path = os.path.join(work_dir, f"audio_{idx}.{audio_ext}")
                p_data["local_audio"] = audio_path
                download_tasks.append(download_asset(panel.audio_url, audio_path))
                
            panels_data.append(p_data)

        # Wait for all downloads
        logger.info(f"Downloading {len(download_tasks)} assets...")
        results = await asyncio.gather(*download_tasks)
        if not any(results):
             raise HTTPException(status_code=500, detail="Failed to download video assets.")

        # 2. Stitch using MoviePy in a thread
        logger.info("Starting video compilation using MoviePy...")
        await asyncio.to_thread(render_pipeline_sync, panels_data, output_path, work_dir)

        logger.info(f"Render completed: {output_path}")
        
        return {
            "success": True,
            "video_url": f"/videos/{output_filename}"
        }

    except Exception as e:
        logger.error(f"Render failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
