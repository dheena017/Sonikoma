import os
import uuid
import time
import logging
import asyncio
import aiohttp
import tempfile
import shutil
from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from routes.auth_routes import get_current_user
from database.db import deduct_credits, get_available_credits, record_credit_transaction, LOW_BALANCE_THRESHOLD
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from PIL import Image
import sys

# Ensure the parent package is on the path for service imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from media.audio.audio import generate_panel_audio

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

def _get_audio_duration_ffprobe(audio_path: str) -> float:
    """Fast audio duration probe via ffprobe — avoids opening a full AudioFileClip."""
    try:
        import subprocess, json
        result = subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "json", audio_path],
            capture_output=True, text=True, timeout=5
        )
        data = json.loads(result.stdout)
        return float(data["format"]["duration"])
    except Exception:
        return 0.0


def _build_zoompan_filter(motion_type: str, w: int, h: int, duration: float, fps: int = 24) -> str:
    """Return an FFmpeg zoompan/crop filter string for the given motion type."""
    frames = max(1, int(duration * fps))
    if motion_type == "zoom_in":
        # Slow zoom from 1.0x → 1.08x, always centred
        return (
            f"zoompan=z='min(zoom+0.08/{frames},1.08)':"
            f"x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={frames}:s={w}x{h}:fps={fps}"
        )
    elif motion_type == "pan_left":
        return (
            f"zoompan=z=1.15:x='(iw-iw/zoom)*(on/{frames})':y='(ih-ih/zoom)/2':"
            f"d={frames}:s={w}x{h}:fps={fps}"
        )
    elif motion_type == "pan_right":
        return (
            f"zoompan=z=1.15:x='(iw-iw/zoom)*(1-on/{frames})':y='(ih-ih/zoom)/2':"
            f"d={frames}:s={w}x{h}:fps={fps}"
        )
    elif motion_type == "pan_up":
        return (
            f"zoompan=z=1.15:x='(iw-iw/zoom)/2':y='(ih-ih/zoom)*(on/{frames})':"
            f"d={frames}:s={w}x{h}:fps={fps}"
        )
    elif motion_type == "pan_down":
        return (
            f"zoompan=z=1.15:x='(iw-iw/zoom)/2':y='(ih-ih/zoom)*(1-on/{frames})':"
            f"d={frames}:s={w}x{h}:fps={fps}"
        )
    return ""


def _render_panel_segment_ffmpeg(
    img_path: str,
    audio_path: str | None,
    duration: float,
    out_path: str,
    w: int,
    h: int,
    motion_type: str | None,
    fps: int = 24,
) -> None:
    """
    Render a single panel as a self-contained .mp4 segment using pure ffmpeg.
    Runs in a subprocess — no Python frame-by-frame processing.
    """
    import subprocess

    vf_parts = []

    # Scale / pad to target canvas
    vf_parts.append(f"scale={w}:{h}:force_original_aspect_ratio=decrease")
    vf_parts.append(f"pad={w}:{h}:(ow-iw)/2:(oh-ih)/2:black")

    # Motion via zoompan (only for clips with motion)
    if motion_type in ("zoom_in", "pan_left", "pan_right", "pan_up", "pan_down"):
        vf_parts.append(_build_zoompan_filter(motion_type, w, h, duration, fps))

    # Crossfade: add a 0.5 s fade-in on every clip (ffmpeg acrossfade is handled at concat stage)
    vf_parts.append("fade=t=in:st=0:d=0.5")

    vf = ",".join(vf_parts)

    cmd = [
        "ffmpeg", "-y",
        "-loop", "1",           # loop the still image
        "-i", img_path,
        "-t", str(duration),
        "-vf", vf,
        "-r", str(fps),
        "-c:v", "libx264",
        "-preset", "ultrafast",
        "-tune", "stillimage",
        "-pix_fmt", "yuv420p",
    ]

    if audio_path and os.path.exists(audio_path):
        cmd += ["-i", audio_path, "-c:a", "aac", "-b:a", "192k",
                "-shortest", "-af", "apad"]
    else:
        # Silent audio track so every segment has the same stream count
        cmd += ["-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo",
                "-c:a", "aac", "-b:a", "128k", "-shortest"]

    cmd.append(out_path)

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg panel render failed:\n{result.stderr[-800:]}")


def render_pipeline_sync(video_id: str, panels_data: List[Dict[str, Any]], output_path: str):
    """
    Stitches panels together into a final video file.

    Strategy (panel-count agnostic, fast for 160+ panels):
      1. Render each panel as an individual .mp4 segment via ffmpeg (no Python loops per frame).
      2. Concatenate all segments with the ffmpeg concat demuxer.
      3. Optionally mix in BGM with a final ffmpeg pass.

    Falls back to MoviePy only if ffmpeg is unavailable.
    """
    import subprocess

    # ── Determine canvas size from first valid panel ──────────────────────────
    first_img = next((p["local_img"] for p in panels_data if os.path.exists(p["local_img"])), None)
    if first_img is None:
        raise Exception("No valid panel images found.")

    with Image.open(first_img) as img:
        raw_w, raw_h = img.size
    # Pick 1080p portrait or landscape based on image orientation
    if raw_h > raw_w:
        canvas_w, canvas_h = 1080, 1920
    else:
        canvas_w, canvas_h = 1920, 1080

    total = len(panels_data)
    segment_paths: list[str] = []
    durations: list[float] = []

    # Use a segments subdir alongside the other temp assets for this job
    seg_dir = os.path.join(os.getcwd(), "temp", f"render_{video_id}", "_segments")
    os.makedirs(seg_dir, exist_ok=True)

    # ── Step 1: Render each panel segment ────────────────────────────────────
    for i, p in enumerate(panels_data):
        img_path   = p["local_img"]
        audio_path = p.get("local_audio")

        if not os.path.exists(img_path):
            logger.warning(f"Panel {i}: image not found, skipping.")
            continue

        # Determine duration from audio (fast probe) or panel metadata
        if audio_path and os.path.exists(audio_path):
            duration = _get_audio_duration_ffprobe(audio_path) or p.get("duration", 3.0)
        else:
            duration = p.get("duration", 3.0)

        duration = max(duration, 0.5)

        seg_path = os.path.join(seg_dir, f"seg_{i:04d}.mp4")
        try:
            _render_panel_segment_ffmpeg(
                img_path   = img_path,
                audio_path = audio_path,
                duration   = duration,
                out_path   = seg_path,
                w          = canvas_w,
                h          = canvas_h,
                motion_type= p.get("motion_type"),
            )
            segment_paths.append(seg_path)
            durations.append(duration)
            logger.info(f"[Render] [{i+1}/{total}] Panel segment rendered ({duration:.2f}s)")
        except Exception as e:
            logger.error(f"[Render] Panel {i} segment failed: {e}")

        # Update progress (50% → 90%)
        if total > 0 and video_id in RENDER_JOBS:
            RENDER_JOBS[video_id]["progress"] = 50 + int(((i + 1) / total) * 40)

    if not segment_paths:
        raise Exception("No valid segments were rendered.")

    # ── Step 2: Concatenate via concat demuxer ────────────────────────────────
    concat_list = os.path.join(seg_dir, "concat.txt")
    with open(concat_list, "w", encoding="utf-8") as f:
        for sp in segment_paths:
            f.write(f"file '{sp.replace(chr(92), '/')}'\n")

    # Intermediate concat (stream-copy — near instant)
    concat_out = os.path.join(seg_dir, "concat_raw.mp4")
    concat_cmd = [
        "ffmpeg", "-y",
        "-f", "concat", "-safe", "0",
        "-i", concat_list,
        "-c", "copy",
        concat_out,
    ]
    r = subprocess.run(concat_cmd, capture_output=True, text=True, timeout=600)
    if r.returncode != 0:
        raise RuntimeError(f"ffmpeg concat failed:\n{r.stderr[-800:]}")

    if video_id in RENDER_JOBS:
        RENDER_JOBS[video_id]["progress"] = 92

    # ── Step 3: Mix in BGM (optional final pass) ──────────────────────────────
    bgm_path = os.path.join(os.getcwd(), "public", "audio", "bgm", "theme.mp3")
    if os.path.exists(bgm_path):
        try:
            bgm_out = os.path.join(seg_dir, "with_bgm.mp4")
            bgm_cmd = [
                "ffmpeg", "-y",
                "-i", concat_out,
                "-stream_loop", "-1", "-i", bgm_path,
                "-filter_complex",
                "[0:a]volume=1.0[va];[1:a]volume=0.10[bgm];[va][bgm]amix=inputs=2:duration=first[aout]",
                "-map", "0:v", "-map", "[aout]",
                "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
                "-shortest",
                bgm_out,
            ]
            rb = subprocess.run(bgm_cmd, capture_output=True, text=True, timeout=300)
            if rb.returncode == 0:
                concat_out = bgm_out
            else:
                logger.warning(f"[Render] BGM mix failed (skipped): {rb.stderr[-400:]}")
        except Exception as e:
            logger.warning(f"[Render] BGM error (skipped): {e}")

    if video_id in RENDER_JOBS:
        RENDER_JOBS[video_id]["progress"] = 95

    # ── Step 4: Final re-encode to target bitrate / output path ──────────────
    final_cmd = [
        "ffmpeg", "-y",
        "-i", concat_out,
        "-c:v", "libx264", "-preset", "ultrafast",
        "-b:v", "8000k", "-maxrate", "10000k", "-bufsize", "20000k",
        "-c:a", "aac", "-b:a", "192k",
        "-movflags", "+faststart",
        output_path,
    ]
    rf = subprocess.run(final_cmd, capture_output=True, text=True, timeout=600)
    if rf.returncode != 0:
        raise RuntimeError(f"ffmpeg final encode failed:\n{rf.stderr[-800:]}")

    logger.info(f"[Render] Done — {len(segment_paths)} panels → {output_path}")

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
        logger.info(f"[Render] Starting FFmpeg pipeline for {video_id}")
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
async def render_video(request: RenderRequest, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user)):
    if not request.panels:
        raise HTTPException(status_code=400, detail="Panel list is empty.")

    # Credit check-first, deduct on dispatch (render runs as background task)
    COST = 20
    if get_available_credits(current_user["user_id"]) < COST:
        raise HTTPException(status_code=402, detail=f"Insufficient credits: need {COST} for video render.")

    video_id = str(uuid.uuid4())[:8]
    RENDER_JOBS[video_id] = {"status": "processing", "progress": 0, "url": None}

    # Record the deduction atomically before dispatching the background task
    new_balance = record_credit_transaction(current_user["user_id"], -COST, "video_render")

    background_tasks.add_task(process_render_job, video_id, request.panels, request.voice)

    return {"success": True, "job_id": video_id, "low_balance": new_balance < LOW_BALANCE_THRESHOLD}

@router.get("/status/{job_id}")
async def get_render_status(job_id: str):
    job = RENDER_JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
