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

class PanelLayersData(BaseModel):
    background_url: str
    character_url: str
    text_url: str
    char_x: Optional[float] = 0.0
    char_y: Optional[float] = 0.0
    char_scale_x: Optional[float] = 1.0
    char_scale_y: Optional[float] = 1.0
    text_x: Optional[float] = 0.0
    text_y: Optional[float] = 0.0
    text_scale_x: Optional[float] = 1.0
    text_scale_y: Optional[float] = 1.0
    parallax_intensity: Optional[float] = 30.0

class DialogueSegmentData(BaseModel):
    start_time: float
    end_time: float

class PanelSyncMapData(BaseModel):
    dialogue_map: List[DialogueSegmentData]
    audio_peaks: Optional[List[float]] = None

class PanelData(BaseModel):
    id: int
    image_url: str
    duration: float = 3.0
    speech_text: Optional[str] = None
    sfx: Optional[str] = None
    audio_url: Optional[str] = None
    motion_type: Optional[str] = None
    layers: Optional[PanelLayersData] = None
    syncMap: Optional[PanelSyncMapData] = None
    audio_reactive_shake: Optional[bool] = False

class RenderRequest(BaseModel):
    panels: List[PanelData]
    voice: Optional[str] = "en-US-GuyNeural"
    music_theme: Optional[str] = "none"          # "none" | "action" | "adventure" | etc.
    aspect_ratio: Optional[str] = "auto"          # "auto" | "9:16" | "16:9"
    frame_rate: Optional[int] = 24
    video_format: Optional[str] = "mp4"           # "mp4" | "webm" | "mkv"
    background_style: Optional[str] = "black"     # "black" | "white" | "blurred"
    subtitles_style: Optional[str] = "none"       # "none" | "burn-in"
    audio_reactive_shake: Optional[bool] = False
    shake_intensity: Optional[str] = "medium"     # "low" | "medium" | "high" | "extreme"
    master_volume: Optional[float] = 1.0          # 0.0 to 1.0
    narration_volume: Optional[float] = 1.0       # 0.0 to 1.0
    bgm_volume: Optional[float] = 1.0             # 0.0 to 1.0
    speech_rate: Optional[float] = 1.0            # Speed factor
    speech_pitch: Optional[float] = 1.0           # Pitch factor

async def download_asset(url: str, dest_path: str) -> bool:
    if not url:
        return False
    # Handle local API routes
    if url.startswith("/"):
        backend_port = os.getenv("PORT", os.getenv("BACKEND_PORT", "5173"))
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


def _get_bg_zoompan(motion_type: str, w: int, h: int, duration: float, fps: int = 24) -> str:
    frames = max(1, int(duration * fps))
    if motion_type == "zoom_in":
        return f"zoompan=z='min(zoom+0.0015,1.5)':d={frames}:s={w}x{h}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':fps={fps}"
    elif motion_type == "zoom_out":
        return f"zoompan=z='max(1.5-0.0015*on,1.0)':d={frames}:s={w}x{h}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':fps={fps}"
    elif motion_type == "pan_left":
        return f"zoompan=z=1.15:x='(iw-iw/zoom)*(on/{frames})':y='(ih-ih/zoom)/2':d={frames}:s={w}x{h}:fps={fps}"
    elif motion_type == "pan_right":
        return f"zoompan=z=1.15:x='(iw-iw/zoom)*(1-on/{frames})':y='(ih-ih/zoom)/2':d={frames}:s={w}x{h}:fps={fps}"
    elif motion_type == "pan_up":
        return f"zoompan=z=1.15:x='(iw-iw/zoom)/2':y='(ih-ih/zoom)*(on/{frames})':d={frames}:s={w}x{h}:fps={fps}"
    elif motion_type == "pan_down":
        return f"zoompan=z=1.15:x='(iw-iw/zoom)/2':y='(ih-ih/zoom)*(1-on/{frames})':d={frames}:s={w}x{h}:fps={fps}"
    return f"zoompan=z=1.0:d={frames}:s={w}x{h}:fps={fps}"


def _get_char_zoompan(motion_type: str, w: int, h: int, duration: float, fps: int = 24, parallax_intensity: float = 30.0) -> str:
    frames = max(1, int(duration * fps))
    mult = 1.0 + (parallax_intensity / 100.0) * 2.0
    pan_mult = 1.0 + (parallax_intensity / 100.0) * 0.8

    char_zoom_in_rate = 0.0015 * mult
    char_zoom_out_rate = 0.0015 * mult
    char_pan_scale = 1.15 * pan_mult

    if motion_type == "zoom_in":
        return f"zoompan=z='min(zoom+{char_zoom_in_rate:.5f},1.5)':d={frames}:s={w}x{h}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':fps={fps}:pix_fmt=yuva420p"
    elif motion_type == "zoom_out":
        return f"zoompan=z='max(1.5-{char_zoom_out_rate:.5f}*on,1.0)':d={frames}:s={w}x{h}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':fps={fps}:pix_fmt=yuva420p"
    elif motion_type == "pan_left":
        return f"zoompan=z={char_pan_scale:.3f}:x='(iw-iw/zoom)*(on/{frames})*1.3':y='(ih-ih/zoom)/2':d={frames}:s={w}x{h}:fps={fps}:pix_fmt=yuva420p"
    elif motion_type == "pan_right":
        return f"zoompan=z={char_pan_scale:.3f}:x='(iw-iw/zoom)*(1-on/{frames})*1.3':y='(ih-ih/zoom)/2':d={frames}:s={w}x{h}:fps={fps}:pix_fmt=yuva420p"
    elif motion_type == "pan_up":
        return f"zoompan=z={char_pan_scale:.3f}:x='(iw-iw/zoom)/2':y='(ih-ih/zoom)*(on/{frames})*1.3':d={frames}:s={w}x{h}:fps={fps}:pix_fmt=yuva420p"
    elif motion_type == "pan_down":
        return f"zoompan=z={char_pan_scale:.3f}:x='(iw-iw/zoom)/2':y='(ih-ih/zoom)*(1-on/{frames})*1.3':d={frames}:s={w}x{h}:fps={fps}:pix_fmt=yuva420p"
    return f"zoompan=z=1.0:d={frames}:s={w}x{h}:fps={fps}:pix_fmt=yuva420p"


# Shake intensity → pixel amplitude mapping
_SHAKE_AMPLITUDES = {"low": 8, "medium": 16, "high": 24, "extreme": 40}


def _render_panel_segment_ffmpeg(
    img_path: str,
    audio_path: str | None,
    duration: float,
    out_path: str,
    w: int,
    h: int,
    motion_type: str | None,
    fps: int = 24,
    layers: dict | None = None,
    sync_map: list | None = None,
    audio_peaks: list | None = None,
    audio_reactive_shake: bool = False,
    shake_amplitude: int = 16,
) -> None:
    """
    Render a single panel as a self-contained .mp4 segment using pure ffmpeg.
    Supports multi-layer compositing and dialogue alignment.
    """
    import subprocess
    from PIL import Image

    # Determine camera shake if active
    shake_filter = ""
    if audio_reactive_shake and audio_peaks and len(audio_peaks) > 0:
        peaks_fps = 10.0
        spikes = []
        last_spike_time = -1.0
        for i, val in enumerate(audio_peaks):
            t_spike = i / peaks_fps
            if val > 0.85:
                if t_spike - last_spike_time >= 0.8:
                    spikes.append(t_spike)
                    last_spike_time = t_spike

        if len(spikes) > 0:
            between_conditions = [f"between(t,{s},{s+0.4})" for s in spikes]
            shake_active = "+".join(between_conditions)
            border = shake_amplitude * 2
            shake_filter = (
                f",crop=w='iw-{border}':h='ih-{border}'"
                f":x='{shake_amplitude}+{shake_amplitude}*sin(80*t)*({shake_active})'"
                f":y='{shake_amplitude}+{shake_amplitude}*cos(80*t)*({shake_active})',scale={w}:{h}"
            )

    if layers:
        # Load background layout size to align scaled layer offsets
        with Image.open(layers["background"]) as bg_img:
            bg_w, bg_h = bg_img.size
        with Image.open(layers["character"]) as char_img:
            char_w, char_h = char_img.size
        with Image.open(layers["text"]) as text_img:
            text_w, text_h = text_img.size

        # Protect against division-by-zero on malformed sizes
        bg_w = max(1, bg_w)
        bg_h = max(1, bg_h)
        char_w = max(1, char_w)
        char_h = max(1, char_h)
        text_w = max(1, text_w)
        text_h = max(1, text_h)

        scale_ratio = min(w / bg_w, h / bg_h)
        offset_x = (w - bg_w * scale_ratio) / 2
        offset_y = (h - bg_h * scale_ratio) / 2

        # 1. Background layout
        bg_scale_filter = f"scale={w}:{h}:force_original_aspect_ratio=decrease,pad={w}:{h}:(ow-iw)/2:(oh-ih)/2:black"

        # 2. Character layout
        char_x = layers.get("char_x")
        char_y = layers.get("char_y")
        char_scale_x = layers.get("char_scale_x") if layers.get("char_scale_x") is not None else 1.0
        char_scale_y = layers.get("char_scale_y") if layers.get("char_scale_y") is not None else 1.0

        if char_x is not None and char_y is not None:
            char_x_px = int(offset_x + char_x * scale_ratio)
            char_y_px = int(offset_y + char_y * scale_ratio)
            char_target_w = int(char_w * char_scale_x * scale_ratio)
            char_target_h = int(char_h * char_scale_y * scale_ratio)
        else:
            char_x_px = int(offset_x)
            char_y_px = int(offset_y)
            char_target_w = int(bg_w * scale_ratio)
            char_target_h = int(bg_h * scale_ratio)

        # Clamp offsets to prevent FFmpeg pad crash on negative values
        char_x_px = max(0, char_x_px)
        char_y_px = max(0, char_y_px)

        # Make character bounds even for x264 alignment
        char_target_w = max(2, char_target_w - char_target_w % 2)
        char_target_h = max(2, char_target_h - char_target_h % 2)

        char_scale_filter = f"scale={char_target_w}:{char_target_h},pad={w}:{h}:{char_x_px}:{char_y_px}:black@0"

        # 3. Text layout
        text_x = layers.get("text_x")
        text_y = layers.get("text_y")
        text_scale_x = layers.get("text_scale_x") if layers.get("text_scale_x") is not None else 1.0
        text_scale_y = layers.get("text_scale_y") if layers.get("text_scale_y") is not None else 1.0

        if text_x is not None and text_y is not None:
            text_x_px = int(offset_x + text_x * scale_ratio)
            text_y_px = int(offset_y + text_y * scale_ratio)
            text_target_w = int(text_w * text_scale_x * scale_ratio)
            text_target_h = int(text_h * text_scale_y * scale_ratio)
        else:
            text_x_px = int(offset_x)
            text_y_px = int(offset_y)
            text_target_w = int(bg_w * scale_ratio)
            text_target_h = int(bg_h * scale_ratio)

        # Clamp offsets to prevent FFmpeg pad crash on negative values
        text_x_px = max(0, text_x_px)
        text_y_px = max(0, text_y_px)

        text_target_w = max(2, text_target_w - text_target_w % 2)
        text_target_h = max(2, text_target_h - text_target_h % 2)

        text_scale_filter = f"scale={text_target_w}:{text_target_h},pad={w}:{h}:{text_x_px}:{text_y_px}:black@0"

        # Timed overlay condition
        text_enable = "1"
        if sync_map and len(sync_map) > 0:
            between_conditions = []
            for segment in sync_map:
                s_time = segment.get("start_time", 0.0)
                e_time = segment.get("end_time", duration)
                between_conditions.append(f"between(t,{s_time},{e_time})")
            text_enable = "+".join(between_conditions)

        parallax_intensity = layers.get("parallax_intensity", 30.0) if layers else 30.0

        filter_complex = (
            f"[0:v]{bg_scale_filter}[bg_scaled];"
            f"[bg_scaled]{_get_bg_zoompan(motion_type, w, h, duration, fps)}[bg_motion];"
            f"[1:v]{char_scale_filter}[char_scaled];"
            f"[char_scaled]{_get_char_zoompan(motion_type, w, h, duration, fps, parallax_intensity)}[char_motion];"
            f"[2:v]{text_scale_filter}[text_scaled];"
            f"[bg_motion][char_motion]overlay=0:0[bg_char_comp];"
            f"[bg_char_comp][text_scaled]overlay=0:0:enable='{text_enable}'{shake_filter},fade=t=in:st=0:d=0.5[final_comp]"
        )

        cmd = [
            "ffmpeg", "-y",
            "-loop", "1", "-t", str(duration), "-i", layers["background"],
            "-loop", "1", "-t", str(duration), "-i", layers["character"],
            "-loop", "1", "-t", str(duration), "-i", layers["text"],
        ]

        if audio_path and os.path.exists(audio_path):
            cmd += ["-i", audio_path]
            audio_input_idx = 3
        else:
            cmd += ["-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo"]
            audio_input_idx = 3

        cmd += [
            "-filter_complex", filter_complex,
            "-map", "[final_comp]",
            "-map", f"{audio_input_idx}:a",
            "-t", str(duration),
            "-r", str(fps),
            "-c:v", "libx264",
            "-preset", "ultrafast",
            "-pix_fmt", "yuv420p",
        ]

        if audio_path and os.path.exists(audio_path):
            cmd += ["-c:a", "aac", "-b:a", "192k", "-shortest", "-af", "apad"]
        else:
            cmd += ["-c:a", "aac", "-b:a", "128k", "-shortest"]

        cmd.append(out_path)
    else:
        # Fallback to single raw image rendering
        vf_parts = []
        vf_parts.append(f"scale={w}:{h}:force_original_aspect_ratio=decrease")
        vf_parts.append(f"pad={w}:{h}:(ow-iw)/2:(oh-ih)/2:black")

        if motion_type in ("zoom_in", "pan_left", "pan_right", "pan_up", "pan_down"):
            vf_parts.append(_build_zoompan_filter(motion_type, w, h, duration, fps))

        # Append shake filter if active
        if shake_filter:
            vf_parts.append(shake_filter.lstrip(","))

        vf_parts.append("fade=t=in:st=0:d=0.5")
        vf = ",".join(vf_parts)

        cmd = [
            "ffmpeg", "-y",
            "-loop", "1",
            "-i", img_path
        ]

        if audio_path and os.path.exists(audio_path):
            cmd += ["-i", audio_path]
        else:
            cmd += ["-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo"]

        cmd += [
            "-t", str(duration),
            "-vf", vf,
            "-r", str(fps),
            "-c:v", "libx264",
            "-preset", "ultrafast",
            "-tune", "stillimage",
            "-pix_fmt", "yuv420p",
        ]

        if audio_path and os.path.exists(audio_path):
            cmd += ["-c:a", "aac", "-b:a", "192k", "-shortest", "-af", "apad"]
        else:
            cmd += ["-c:a", "aac", "-b:a", "128k", "-shortest"]

    cmd.append(out_path)
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg panel render failed:\n{result.stderr[-800:]}")


def render_pipeline_sync(
    video_id: str,
    panels_data: List[Dict[str, Any]],
    output_path: str,
    frame_rate: int = 24,
    shake_amplitude: int = 16,
    music_theme: str = "none",
    video_format: str = "mp4",
    master_volume: float = 1.0,
    narration_volume: float = 1.0,
    bgm_volume: float = 1.0,
):
    """
    Stitches panels together into a final video file.

    Strategy (panel-count agnostic, fast for 160+ panels):
      1. Render each panel as an individual .mp4 segment via ffmpeg.
      2. Concatenate all segments with the ffmpeg concat demuxer.
      3. Optionally mix in synthetic BGM via FFmpeg sine oscillator.
      4. Final re-encode to the requested codec / output format.
    """
    import subprocess

    # ── Determine canvas size from first valid panel ──────────────────────────
    first_img = next((p["local_img"] for p in panels_data if os.path.exists(p["local_img"])), None)
    if first_img is None:
        raise Exception("No valid panel images found.")

    with Image.open(first_img) as img:
        raw_w, raw_h = img.size
    # Use the already-prepared canvas size stored in the first panel dict,
    # or fall back to orientation-based detection.
    canvas_w = panels_data[0].get("canvas_w", 1080 if raw_h > raw_w else 1920)
    canvas_h = panels_data[0].get("canvas_h", 1920 if raw_h > raw_w else 1080)

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
        durations.append(duration)

        seg_path = os.path.join(seg_dir, f"seg_{i:04d}.mp4")
        try:
            _render_panel_segment_ffmpeg(
                img_path             = img_path,
                audio_path           = audio_path,
                duration             = duration,
                out_path             = seg_path,
                w                    = canvas_w,
                h                    = canvas_h,
                motion_type          = p.get("motion_type"),
                fps                  = frame_rate,
                layers               = p.get("layers"),
                sync_map             = p.get("sync_map"),
                audio_peaks          = p.get("audio_peaks"),
                audio_reactive_shake = p.get("audio_reactive_shake", False),
                shake_amplitude      = shake_amplitude,
            )
            segment_paths.append(seg_path)
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

    # ── Step 3: Mix in BGM (synthetic sine drone, no static files needed) ─────
    # Map music themes to base frequencies (Hz)
    _BGM_FREQS = {
        "action":                  110,   # A2  — deep, driving
        "orchestral battle theme": 110,
        "adventure":               130,   # C3  — bold, heroic
        "drama":                   98,    # G2  — tense, emotional
        "mysterious ambience":     98,
        "romance":                 220,   # A3  — warm, melodic
        "calm acoustic melancholy": 220,
        "horror":                  55,    # A1  — dark, unsettling
        "comedy":                  174,   # F3  — bright, playful
        "fantasy":                 165,   # E3  — ethereal, magical
        "sci-fi":                  82,    # E2  — electronic, tense
        "sci-fi synth wave":       82,
    }

    va_vol = narration_volume * master_volume
    bgm_vol = bgm_volume * master_volume

    is_explicit_no_music = music_theme and music_theme.strip().lower() in ("none", "no music (dialogue only)", "no music")

    bgm_freq = _BGM_FREQS.get(music_theme.strip().lower()) if music_theme else None

    if is_explicit_no_music:
        # Explicitly no music, skip BGM overlay. Adjust narration volume if not 1.0
        logger.info("[Render] Explicitly no background music requested.")
        if abs(va_vol - 1.0) > 0.01:
            try:
                vol_out = os.path.join(seg_dir, "with_volume.mp4")
                vol_cmd = [
                    "ffmpeg", "-y",
                    "-i", concat_out,
                    "-af", f"volume={va_vol:.2f}",
                    "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
                    vol_out,
                ]
                rv = subprocess.run(vol_cmd, capture_output=True, text=True, timeout=300)
                if rv.returncode == 0:
                    concat_out = vol_out
                    logger.info(f"[Render] Narration volume adjusted to {va_vol:.2f}.")
                else:
                    logger.warning(f"[Render] Narration volume filter failed (skipped): {rv.stderr[-400:]}")
            except Exception as e:
                logger.warning(f"[Render] Volume filter error: {e}")
    elif bgm_freq:
        try:
            total_duration = sum(durations) + 2  # small tail
            bgm_audio_path = os.path.join(seg_dir, "bgm_synth.aac")
            # Generate synthetic ambient drone: base sine + slow pulsation
            bgm_gen_cmd = [
                "ffmpeg", "-y",
                "-f", "lavfi",
                "-i", f"sine=frequency={bgm_freq}:duration={int(total_duration + 5)}",
                "-af", "apulsator=hz=0.2,atempo=1.0,volume=0.09",
                "-c:a", "aac", "-b:a", "64k",
                bgm_audio_path,
            ]
            rg = subprocess.run(bgm_gen_cmd, capture_output=True, text=True, timeout=30)
            if rg.returncode == 0 and os.path.exists(bgm_audio_path):
                bgm_out = os.path.join(seg_dir, "with_bgm.mp4")
                bgm_mix_cmd = [
                    "ffmpeg", "-y",
                    "-i", concat_out,
                    "-i", bgm_audio_path,
                    "-filter_complex",
                    f"[0:a]volume={va_vol:.2f}[va];[1:a]volume={bgm_vol:.2f}[bgm];[va][bgm]amix=inputs=2:duration=first[aout]",
                    "-map", "0:v", "-map", "[aout]",
                    "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
                    "-shortest",
                    bgm_out,
                ]
                rb = subprocess.run(bgm_mix_cmd, capture_output=True, text=True, timeout=300)
                if rb.returncode == 0:
                    concat_out = bgm_out
                    logger.info(f"[Render] Synthetic BGM ({music_theme}, {bgm_freq}Hz) mixed in (BGM Vol: {bgm_vol:.2f}, Narration Vol: {va_vol:.2f}).")
                else:
                    logger.warning(f"[Render] BGM mix failed (skipped): {rb.stderr[-400:]}")
            else:
                logger.warning(f"[Render] BGM generation failed (skipped): {rg.stderr[-400:]}")
        except Exception as e:
            logger.warning(f"[Render] BGM error (skipped): {e}")
    else:
        # Legacy: attempt static file fallback (ONLY if BGM is NOT explicitly disabled)
        bgm_path = os.path.join(os.getcwd(), "public", "audio", "bgm", "theme.mp3")
        if os.path.exists(bgm_path):
            try:
                bgm_out = os.path.join(seg_dir, "with_bgm.mp4")
                bgm_cmd = [
                    "ffmpeg", "-y",
                    "-i", concat_out,
                    "-stream_loop", "-1", "-i", bgm_path,
                    "-filter_complex",
                    f"[0:a]volume={va_vol:.2f}[va];[1:a]volume={0.10 * bgm_vol:.2f}[bgm];[va][bgm]amix=inputs=2:duration=first[aout]",
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

    # ── Step 4: Final re-encode to target codec / output format ──────────────
    ext = video_format if video_format in ("mp4", "webm", "mkv") else "mp4"
    # Swap output extension if needed (output_path was already created with the
    # correct name by process_render_job; here we just build the codec flags).
    if ext == "webm":
        vcodec_flags = ["-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "33", "-row-mt", "1"]
        acodec_flags = ["-c:a", "libopus", "-b:a", "128k"]
    elif ext == "mkv":
        try:
            # Try HEVC first; fall back to x264 if not available
            probe = subprocess.run(
                ["ffmpeg", "-hide_banner", "-encoders"],
                capture_output=True, text=True, timeout=5
            )
            if "libx265" in probe.stdout:
                vcodec_flags = ["-c:v", "libx265", "-preset", "ultrafast", "-crf", "28"]
            else:
                vcodec_flags = ["-c:v", "libx264", "-preset", "ultrafast", "-crf", "23"]
        except Exception:
            vcodec_flags = ["-c:v", "libx264", "-preset", "ultrafast", "-crf", "23"]
        acodec_flags = ["-c:a", "aac", "-b:a", "192k"]
    else:  # mp4 default
        # Stream copy to avoid re-encoding overhead and potential ffmpeg crashes from concat timestamp issues.
        vcodec_flags = ["-c:v", "copy"]
        acodec_flags = ["-c:a", "copy", "-movflags", "+faststart"]

    final_cmd = ["ffmpeg", "-y", "-i", concat_out] + vcodec_flags + acodec_flags + [output_path]
    rf = subprocess.run(final_cmd, capture_output=True, text=True, timeout=600)
    if rf.returncode != 0:
        raise RuntimeError(f"ffmpeg final encode failed:\n{rf.stderr[-800:]}")

    logger.info(f"[Render] Done — {len(segment_paths)} panels → {output_path}")

    # ── Step 5: Generate quality variants (_480p, _720p, _1080p) ─────────────
    # Derive base path and extension for variant naming
    _base, _ext = os.path.splitext(output_path)
    _quality_variants = [
        ("480p",  854,  480),
        ("720p",  1280, 720),
        ("1080p", 1920, 1080),
    ]
    for _label, _vw, _vh in _quality_variants:
        # Skip 1080p if original canvas is smaller (upscaling wastes space)
        if _vh > canvas_h and _vh > canvas_w:
            continue
        _variant_path = f"{_base}_{_label}{_ext}"
        try:
            _variant_cmd = [
                "ffmpeg", "-y",
                "-i", output_path,
                "-vf", f"scale='if(gt(iw,ih),{_vw},-2)':'if(gt(iw,ih),-2,{_vh})',scale=trunc(iw/2)*2:trunc(ih/2)*2",
                "-c:v", "libx264", "-preset", "faster", "-crf", "23",
                "-c:a", "aac", "-b:a", "128k",
                "-movflags", "+faststart",
                _variant_path,
            ]
            _rv = subprocess.run(_variant_cmd, capture_output=True, text=True, timeout=300)
            if _rv.returncode == 0:
                logger.info(f"[Render] Quality variant created: {_label} → {_variant_path}")
            else:
                logger.warning(f"[Render] {_label} variant failed (skipped): {_rv.stderr[-300:]}")
        except Exception as _e:
            logger.warning(f"[Render] {_label} variant error (skipped): {_e}")



async def process_render_job(
    video_id: str,
    panels: List[PanelData],
    voice: Optional[str],
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
):
    work_dir = os.path.join(os.getcwd(), "temp", f"render_{video_id}")
    os.makedirs(work_dir, exist_ok=True)

    ext = video_format if video_format in ("mp4", "webm", "mkv") else "mp4"
    output_filename = f"final_render_{video_id}.{ext}"
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
                "sfx": panel.sfx,
                "layers": None,
                "sync_map": None,
                "audio_peaks": None,
                "audio_reactive_shake": panel.audio_reactive_shake or False
            }
            
            if panel.layers:
                bg_ext = "png" if ".png" in panel.layers.background_url.lower() else "webp"
                char_ext = "png" if ".png" in panel.layers.character_url.lower() else "webp"
                text_ext = "png" if ".png" in panel.layers.text_url.lower() else "webp"
                bg_path = os.path.join(work_dir, f"panel_{idx}_bg.{bg_ext}")
                char_path = os.path.join(work_dir, f"panel_{idx}_char.{char_ext}")
                text_path = os.path.join(work_dir, f"panel_{idx}_text.{text_ext}")

                bg_ok = await download_asset(panel.layers.background_url, bg_path)
                char_ok = await download_asset(panel.layers.character_url, char_path)
                text_ok = await download_asset(panel.layers.text_url, text_path)

                if bg_ok and char_ok and text_ok:
                    p_dict["layers"] = {
                        "background": bg_path,
                        "character": char_path,
                        "text": text_path,
                        "char_x": panel.layers.char_x,
                        "char_y": panel.layers.char_y,
                        "char_scale_x": panel.layers.char_scale_x,
                        "char_scale_y": panel.layers.char_scale_y,
                        "text_x": panel.layers.text_x,
                        "text_y": panel.layers.text_y,
                        "text_scale_x": panel.layers.text_scale_x,
                        "text_scale_y": panel.layers.text_scale_y,
                        "parallax_intensity": panel.layers.parallax_intensity if panel.layers.parallax_intensity is not None else 30.0,
                    }
                    # Set background as raw image for size validations
                    raw_img_path = bg_path
                    p_dict["raw_img"] = bg_path

                    if panel.syncMap:
                        if panel.syncMap.audio_peaks:
                            p_dict["audio_peaks"] = panel.syncMap.audio_peaks
                        if panel.syncMap.dialogue_map:
                            p_dict["sync_map"] = [
                                {"start_time": s.start_time, "end_time": s.end_time}
                                for s in panel.syncMap.dialogue_map
                            ]
                else:
                    # Fallback to single raw image if any layer fails to download
                    await download_asset(panel.image_url, raw_img_path)
            else:
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
                    force_duration=False,
                    speech_rate=speech_rate,
                    speech_pitch=speech_pitch,
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

        # Determine canvas from aspect_ratio setting (overrides auto-detection)
        if aspect_ratio == "9:16":
            target_w, target_h = 1080, 1920
        elif aspect_ratio == "16:9":
            target_w, target_h = 1920, 1080
        else:
            # auto: pick based on majority image orientation
            target_w, target_h = (1080, 1920) if tall_count > len(panels_data) / 2 else (1920, 1080)

        # Resolve background fill colour for PIL letterbox
        bg_color = (0, 0, 0)  # default black
        if background_style == "white":
            bg_color = (255, 255, 255)
        # "blurred" is handled per-panel via a flag; PIL layer uses black for now

        shake_amplitude = _SHAKE_AMPLITUDES.get(shake_intensity, 16)

        for idx, p in enumerate(panels_data):
            # Store canvas dims so render_pipeline_sync can read them
            p["canvas_w"] = target_w
            p["canvas_h"] = target_h

            if os.path.exists(p["raw_img"]):
                with Image.open(p["raw_img"]) as img:
                    img = img.convert("RGB")
                    scale = min(target_w / img.width, target_h / img.height)
                    nw, nh = int(img.width * scale), int(img.height * scale)
                    # Even dims for ffmpeg
                    resized = img.resize((max(2, nw - nw % 2), max(2, nh - nh % 2)), Image.Resampling.LANCZOS)

                    if background_style == "blurred":
                        # Blurred letterbox: scale image to fill canvas, blur, then overlay sharp centred
                        fill_scale = max(target_w / img.width, target_h / img.height)
                        fw = int(img.width * fill_scale)
                        fh = int(img.height * fill_scale)
                        fw = max(2, fw - fw % 2)
                        fh = max(2, fh - fh % 2)
                        blurred_bg = img.resize((fw, fh), Image.Resampling.LANCZOS)
                        try:
                            from PIL import ImageFilter
                            blurred_bg = blurred_bg.filter(ImageFilter.GaussianBlur(radius=18))
                        except Exception:
                            pass
                        bg = Image.new("RGB", (target_w, target_h), (0, 0, 0))
                        bg.paste(blurred_bg, ((target_w - fw) // 2, (target_h - fh) // 2))
                    else:
                        bg = Image.new("RGB", (target_w, target_h), bg_color)

                    bg.paste(resized, ((target_w - resized.width) // 2, (target_h - resized.height) // 2))

                    # Burn-in subtitles if requested
                    if subtitles_style == "burn-in" and p.get("speech_text") and p["speech_text"].strip():
                        bg = draw_subtitles_on_image(bg, p["speech_text"].strip())

                    bg.save(p["local_img"], "JPEG")

                    # Also apply shake flag from global setting
                    if audio_reactive_shake:
                        p["audio_reactive_shake"] = True

            if len(panels_data) > 0:
                progress = 40 + int(((idx + 1) / len(panels_data)) * 10)
                RENDER_JOBS[video_id]["progress"] = min(progress, 50)

        RENDER_JOBS[video_id]["progress"] = 50

        # 4. Rendering (50% to 95%)
        logger.info(f"[Render] Starting FFmpeg pipeline for {video_id}")
        await asyncio.to_thread(
            render_pipeline_sync,
            video_id, panels_data, output_path,
            frame_rate, shake_amplitude, music_theme, ext,
            master_volume, narration_volume, bgm_volume,
        )

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

    background_tasks.add_task(
        process_render_job,
        video_id,
        request.panels,
        request.voice,
        request.music_theme or "none",
        request.aspect_ratio or "auto",
        request.frame_rate or 24,
        request.video_format or "mp4",
        request.background_style or "black",
        request.subtitles_style or "none",
        request.audio_reactive_shake or False,
        request.shake_intensity or "medium",
        request.master_volume if request.master_volume is not None else 1.0,
        request.narration_volume if request.narration_volume is not None else 1.0,
        request.bgm_volume if request.bgm_volume is not None else 1.0,
        request.speech_rate if request.speech_rate is not None else 1.0,
        request.speech_pitch if request.speech_pitch is not None else 1.0,
    )

    return {"success": True, "job_id": video_id, "low_balance": new_balance < LOW_BALANCE_THRESHOLD}

@router.get("/status/{job_id}")
async def get_render_status(job_id: str):
    job = RENDER_JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
