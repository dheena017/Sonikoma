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
from services.audio import generate_panel_audio

# Try importing moviepy; fallback gracefully if not installed
try:
    from moviepy.editor import ImageClip, AudioFileClip, concatenate_videoclips, CompositeVideoClip, CompositeAudioClip
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
    duration: float = 3.0
    speech_text: Optional[str] = None
    sfx: Optional[str] = None
    audio_url: Optional[str] = None
    motion_type: Optional[str] = None

class RenderRequest(BaseModel):
    panels: List[PanelData]
    voice: Optional[str] = "en-US-GuyNeural"

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

        # Prioritize natural audio length if available
        if audio_path and os.path.exists(audio_path):
            try:
                audio_clip_temp = AudioFileClip(audio_path)
                duration = audio_clip_temp.duration
                audio_clip_temp.close()
            except Exception as e:
                logger.error(f"Failed to read audio duration for panel {i}: {e}")

        safe_duration = max(duration, 0.1)
        clip = ImageClip(img_path).set_duration(safe_duration)
        
        if audio_path and os.path.exists(audio_path):
            try:
                audio_clip = AudioFileClip(audio_path).set_duration(safe_duration)
                clip = clip.set_audio(audio_clip)
            except Exception as e:
                logger.error(f"Failed to attach audio {audio_path}: {e}")

        # Step 12: Schedule SFX
        if sfx_name and sfx_name.strip():
            sfx_path = os.path.join(os.getcwd(), "public", "audio", "sfx", f"{sfx_name.strip()}.mp3")
            if os.path.exists(sfx_path):
                try:
                    sfx_clip = AudioFileClip(sfx_path).volumex(0.4)
                    sfx_clip = sfx_clip.set_start(current_global_time)
                    sfx_clips.append(sfx_clip)
                except Exception as e:
                    logger.error(f"Failed to load SFX {sfx_path}: {e}")

        # Dynamic Camera Motion (Ken Burns Effect)
        motion_type = p.get("motion_type")
        w, h = clip.size

        def apply_dynamic_crop(c, x1_func, y1_func, cw, ch):
            def make_frame(get_frame, t):
                frame = get_frame(t)
                x = int(max(0, min(x1_func(t), c.w - cw)))
                y = int(max(0, min(y1_func(t), c.h - ch)))
                return frame[y:y+ch, x:x+cw]
            new_c = c.fl(make_frame)
            new_c.size = (cw, ch)
            return new_c

        if motion_type == "zoom_in":
            clip = clip.resize(lambda t: 1 + 0.08 * (t / safe_duration))
            clip = apply_dynamic_crop(clip, lambda t: (clip.w - w)/2, lambda t: (clip.h - h)/2, w, h)
        elif motion_type == "pan_left":
            clip = clip.resize(1.15)
            clip = apply_dynamic_crop(clip, lambda t: (clip.w - w) * (1 - t/safe_duration), lambda t: 0, w, h)
        elif motion_type == "pan_right":
            clip = clip.resize(1.15)
            clip = apply_dynamic_crop(clip, lambda t: (clip.w - w) * (t/safe_duration), lambda t: 0, w, h)
        elif motion_type == "pan_up":
            clip = clip.resize(1.15)
            clip = apply_dynamic_crop(clip, lambda t: 0, lambda t: (clip.h - h) * (1 - t/safe_duration), w, h)
        elif motion_type == "pan_down":
            clip = clip.resize(1.15)
            clip = apply_dynamic_crop(clip, lambda t: 0, lambda t: (clip.h - h) * (t/safe_duration), w, h)

        # Step 9: Burned-in Subtitles
        speech_text = p.get("speech_text")
        layers = [clip.set_position(('center', 'center'))]
        
        if speech_text and speech_text.strip():
            txt_clip = create_subtitle_clip(speech_text, w, h, safe_duration)
            layers.append(txt_clip.set_position(('center', 'bottom')))
            
        clip = CompositeVideoClip(layers, size=(w, h)).set_duration(safe_duration)

        if i > 0:
            clip = clip.crossfadein(0.5)

        clips.append(clip)
        
        current_global_time += safe_duration
        if i < len(panels_data) - 1:
            current_global_time -= 0.5

    if not clips:
        raise Exception("No valid clips were generated.")

    final_clip = concatenate_videoclips(clips, padding=-0.5, method="compose")
    import moviepy.audio.fx.all as afx
    
    audio_tracks = []
    if final_clip.audio is not None:
        audio_tracks.append(final_clip.audio)
    
    bgm_path = os.path.join(os.getcwd(), "public", "audio", "bgm", "theme.mp3")
    if os.path.exists(bgm_path):
        try:
            bgm_clip = AudioFileClip(bgm_path).volumex(0.1)
            bgm_clip = afx.audio_loop(bgm_clip, duration=final_clip.duration)
            audio_tracks.append(bgm_clip)
        except Exception as e:
            logger.error(f"Failed to load BGM audio: {e}")
            
    audio_tracks.extend(sfx_clips)
    
    if audio_tracks:
        try:
            final_audio = CompositeAudioClip(audio_tracks).set_duration(final_clip.duration)
            final_clip = final_clip.set_audio(final_audio)
        except Exception as e:
            logger.error(f"Failed to mix final audio: {e}")
            
    final_clip.write_videofile(
        output_path, 
        fps=24, 
        codec="libx264", 
        audio_codec="aac", 
        logger=None
    )
    
    for c in clips:
        c.close()
    final_clip.close()

async def process_render_job(video_id: str, panels: List[PanelData], voice: Optional[str] = "en-US-GuyNeural"):
    work_dir = os.path.join(os.getcwd(), "temp", f"render_{video_id}")
    os.makedirs(work_dir, exist_ok=True)
    
    output_filename = f"final_render_{video_id}.mp4"
    output_dir = os.path.join(os.getcwd(), "public", "videos")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, output_filename)

    try:
        panels_data = []
        download_tasks = []

        RENDER_JOBS[video_id]["progress"] = 15
        for idx, panel in enumerate(panels):
            img_ext = panel.image_url.split(".")[-1].split("?")[0] if "." in panel.image_url else "jpg"
            if len(img_ext) > 4: img_ext = "jpg"
            
            raw_img_path = os.path.join(work_dir, f"panel_raw_{idx}.{img_ext}")
            final_img_path = os.path.join(work_dir, f"panel_{idx}.jpg")
            
            p_data = {
                "id": panel.id,
                "duration": panel.duration if panel.duration > 0 else 3.0,
                "local_img": final_img_path,
                "raw_img": raw_img_path,
                "local_audio": None,
                "speech_text": panel.speech_text,
                "motion_type": panel.motion_type,
                "sfx": panel.sfx
            }
            
            download_tasks.append(download_asset(panel.image_url, raw_img_path))
            if panel.audio_url:
                audio_path = os.path.join(work_dir, f"audio_{idx}.mp3")
                p_data["local_audio"] = audio_path
                download_tasks.append(download_asset(panel.audio_url, audio_path))
            panels_data.append(p_data)

        logger.info(f"Downloading {len(download_tasks)} assets...")
        await asyncio.gather(*download_tasks)

        tts_tasks = []
        for idx, p_data in enumerate(panels_data):
            panel = panels[idx]
            if not p_data["local_audio"] and panel.speech_text and panel.speech_text.strip():
                audio_path = os.path.join(work_dir, f"audio_{idx}.mp3")
                p_data["local_audio"] = audio_path
                tts_tasks.append(
                    generate_panel_audio(
                        dialogue_list=[panel.speech_text.strip()],
                        target_duration=p_data["duration"],
                        output_path=audio_path,
                        voice=voice,
                        force_duration=False
                    )
                )
        if tts_tasks:
            logger.info(f"Generating missing TTS audio for {len(tts_tasks)} panels...")
            tts_results = await asyncio.gather(*tts_tasks)
            # Update p_data duration with natural natural duration
            tts_ptr = 0
            for p_data in panels_data:
                if p_data["local_audio"] and not any(panel.audio_url for panel in panels if panel.id == p_data["id"]):
                    _, actual_dur = tts_results[tts_ptr]
                    p_data["duration"] = actual_dur
                    tts_ptr += 1

        from PIL import Image
        tall_count = 0
        wide_count = 0
        for p_data in panels_data:
            if os.path.exists(p_data["raw_img"]):
                try:
                    with Image.open(p_data["raw_img"]) as img:
                        w, h = img.size
                        if h > 8000:
                            raise Exception(f"Panel #{p_data['id']} image is extremely tall ({h}px). Please slice it before rendering.")
                        if h > w: tall_count += 1
                        else: wide_count += 1
                except Exception as e:
                    if "extremely tall" in str(e): raise e
                    logger.warning(f"Failed to inspect dimensions: {e}")
                    
        target_width, target_height = (1080, 1920) if tall_count >= wide_count else (1920, 1080)

        for p_data in panels_data:
            if os.path.exists(p_data["raw_img"]):
                try:
                    with Image.open(p_data["raw_img"]) as img:
                        img = img.convert("RGB")
                        img_w, img_h = img.size
                        scale = min(target_width / img_w, target_height / img_h)
                        new_w, new_h = int(img_w * scale), int(img_h * scale)
                        if new_w % 2 != 0: new_w -= 1
                        if new_h % 2 != 0: new_h -= 1
                        resized = img.resize((max(2, new_w), max(2, new_h)), Image.Resampling.LANCZOS)
                        bg = Image.new("RGB", (target_width, target_height), (0, 0, 0))
                        bg.paste(resized, ((target_width - resized.width) // 2, (target_height - resized.height) // 2))
                        bg.save(p_data["local_img"], "JPEG")
                except Exception as e:
                    logger.error(f"Failed to process image: {e}")

        RENDER_JOBS[video_id]["progress"] = 40
        logger.info("Starting video compilation...")
        await asyncio.to_thread(render_pipeline_sync, panels_data, output_path, work_dir)

        final_video_url = f"/videos/{output_filename}"
        try:
            from supabase import create_client
            url, key = os.environ.get("SUPABASE_URL"), os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
            if url and key:
                supabase = create_client(url, key)
                with open(output_path, "rb") as f:
                    supabase.storage.from_("videos").upload(output_filename, f, {"content-type": "video/mp4", "upsert": "true"})
                final_video_url = supabase.storage.from_("videos").get_public_url(output_filename)
        except Exception as e:
            logger.error(f"Supabase upload failed: {e}")
        
        RENDER_JOBS[video_id].update({"progress": 100, "status": "completed", "url": final_video_url})
    except Exception as e:
        logger.error(f"Render failed: {e}", exc_info=True)
        RENDER_JOBS[video_id].update({"status": "failed", "error": str(e)})
    finally:
        import shutil
        if os.path.exists(work_dir): shutil.rmtree(work_dir)
        if os.path.exists(output_path):
            info = RENDER_JOBS.get(video_id, {})
            if info.get("status") == "failed" or (info.get("url") and info.get("url").startswith("http")):
                os.remove(output_path)

@router.post("/render")
async def render_video(request: RenderRequest, background_tasks: BackgroundTasks):
    if not HAS_MOVIEPY:
        raise HTTPException(status_code=500, detail="moviepy is not installed")
    if not request.panels:
        raise HTTPException(status_code=400, detail="No panels provided")
    video_id = str(uuid.uuid4())[:8]
    RENDER_JOBS[video_id] = {"status": "processing", "progress": 0, "url": None}
    background_tasks.add_task(process_render_job, video_id, request.panels, request.voice)
    return {"success": True, "job_id": video_id}

@router.get("/status/{job_id}")
async def get_render_status(job_id: str):
    job = RENDER_JOBS.get(job_id)
    if not job: raise HTTPException(status_code=404, detail="Job not found")
    return job
