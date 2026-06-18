"""
backend/python/routes/video.py
─────────────────────────────────────────────────────────────────────────────
Cinematic video compilation routes.
Exposes computational compiler endpoints as well as the high-level
storyboard video converter and cached media serving endpoints.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import sys
import base64
import asyncio
import tempfile
import logging
import uuid
import shutil
import jwt
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Path, Request, Response
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel, Field

from services.video import compile_video
from services.audio import generate_panel_audio
from utils.image_utils import resolve_image_to_buffer
from utils.id_utils import generate_project_id
from utils.cache import stitched_cache
from utils.url_utils import parse_webtoon_url
import database.db as db

logger = logging.getLogger("anivox.routes.video")
router = APIRouter()

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "anivox_super_secret_key_change_me")
ALGORITHM = "HS256"

def get_optional_user_id(request: Request) -> Optional[str]:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        logger.info("[Auth] No Authorization header or Bearer prefix found.")
        return None
    try:
        token = auth_header.split(" ")[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        logger.info(f"[Auth] Successfully decoded token for user_id: {user_id}")
        return user_id
    except Exception as e:
        logger.warning(f"[Auth] Failed to decode JWT token: {e}", exc_info=True)
        return None

# ─── Schemas ──────────────────────────────────────────────────────────────────

class PanelData(BaseModel):
    image_path: str  = Field(...,  description="Absolute path to the panel image (PNG/JPG)")
    audio_path: Optional[str] = Field(None, description="Absolute path to the panel audio (MP3)")
    duration: float  = Field(4.5, ge=0.5, le=60.0, description="Nominal display duration in seconds")
    caption: Optional[str] = Field(None, description="Optional caption/subtitle text")


class VideoCompileRequest(BaseModel):
    panels: List[PanelData] = Field(..., min_length=1, description="Ordered list of panels to compile")
    bgm_path: Optional[str] = Field(None, description="Optional background music file path")
    target_width:  int  = Field(1920, ge=320, le=7680)
    target_height: int  = Field(1080, ge=180, le=4320)
    fps:           int  = Field(24,   ge=12,  le=60)
    zoom_factor:   float = Field(0.05, ge=0.0, le=0.3, description="Ken-Burns zoom intensity")
    ducking_volume: float = Field(0.15, ge=0.0, le=1.0, description="BGM volume during dialogue")
    return_base64:  bool = Field(True, description="Return video as base64 string")


class ConvertVideoPanel(BaseModel):
    image_url: str = Field(..., description="Panel image source URL")
    speech_text: Optional[str] = Field("", description="Panel narration or subtitle text")
    duration: Optional[float] = Field(0.0, description="Panel frame duration")


class ConvertVideoRequest(BaseModel):
    panels: List[ConvertVideoPanel] = Field(..., min_length=1, description="Panels to convert to video")
    url: Optional[str] = Field(None, description="Source Webtoon page URL")
    voice_actor: Optional[str] = Field(None, description="Selected voice actor character label")
    music_theme: Optional[str] = Field(None, description="Selected background music theme loop")
    project_id: Optional[str] = Field(None, description="Optional Project ID to update")


def download_bgm_to_temp(music_theme: Optional[str]) -> Optional[str]:
    if not music_theme or music_theme == "No Music (Dialogue Only)":
        return None
        
    theme_urls = {
        "Orchestral Battle Theme": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        "Mysterious Ambience": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        "Sci-Fi Synth Wave": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
        "Calm Acoustic Melancholy": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3"
    }
    
    url = theme_urls.get(music_theme)
    if not url:
        logger.warning(f"[BGM] Music theme '{music_theme}' not recognized. Skipping BGM.")
        return None
        
    import urllib.request
    import tempfile
    
    logger.info(f"[BGM] Mapping music theme '{music_theme}' to url: {url}")
    try:
        fd, path = tempfile.mkstemp(suffix=".mp3")
        os.close(fd)
        logger.info(f"[BGM] Downloading BGM loop from {url} to {path}...")
        urllib.request.urlretrieve(url, path)
        logger.info(f"[BGM] Download completed successfully. Size: {os.path.getsize(path)} bytes")
        return path
    except Exception as exc:
        logger.error(f"[BGM] Failed to download BGM theme '{music_theme}': {exc}", exc_info=True)
        return None


# ─── Routes ───────────────────────────────────────────────────────────────────

@router.post("/compile", summary="Compile panels into a cinematic MP4 video (computational)")
async def compile_video_route(body: VideoCompileRequest):
    """
    Combines panel images + TTS audio tracks into a cinematic MP4 video.
    Applies Ken-Burns pan/zoom, audio ducking for BGM, and AAC/H.264 encoding.
    """
    logger.info(f"[Video] Computational compile request received with {len(body.panels)} panels")
    project_id  = uuid.uuid4().hex[:8]
    output_path = os.path.join(tempfile.gettempdir(), "anivox_renders", f"render_{project_id}.mp4")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    panel_dicts: List[Dict[str, Any]] = [p.model_dump() for p in body.panels]

    logger.info(
        f"[{project_id}] Compiling {len(panel_dicts)} panels → {output_path} "
        f"({body.target_width}x{body.target_height} @ {body.fps}fps)"
    )

    try:
        saved_path = await compile_video(
            panel_data=panel_dicts,
            output_path=output_path,
            bgm_path=body.bgm_path,
            target_width=body.target_width,
            target_height=body.target_height,
            fps=body.fps,
            zoom_factor=body.zoom_factor,
            ducking_volume=body.ducking_volume,
        )

        if not os.path.exists(saved_path) or os.path.getsize(saved_path) == 0:
            raise HTTPException(status_code=500, detail="Video compilation produced empty file.")

        file_size_mb = round(os.path.getsize(saved_path) / 1024 / 1024, 2)
        logger.info(f"[{project_id}] Video compiled successfully: {file_size_mb}MB")

        if body.return_base64:
            with open(saved_path, "rb") as f:
                video_bytes = f.read()
            video_b64 = base64.b64encode(video_bytes).decode("utf-8")
            try:
                os.remove(saved_path)
            except OSError:
                pass
            return JSONResponse(content={
                "success": True,
                "project_id": project_id,
                "video_base64": video_b64,
                "mime_type": "video/mp4",
                "file_size_mb": file_size_mb,
                "panel_count": len(panel_dicts),
                "resolution": f"{body.target_width}x{body.target_height}",
                "fps": body.fps,
            })
        else:
            return JSONResponse(content={
                "success": True,
                "project_id": project_id,
                "video_path": saved_path,
                "file_size_mb": file_size_mb,
                "panel_count": len(panel_dicts),
            })

    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"[{project_id}] Video compilation failed: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


# ─── High Level API Routes (Migrated from Express server.ts / ai/video.ts) ───

@router.post("/convert-images-to-video", summary="Synthesize dialogue voice-over and bundle storyboard panels into MP4")
async def convert_images_to_video(request: Request, body: ConvertVideoRequest):
    """
    Accepts panel image URLs and dialogue text. Fetches images, synthesizes
    TTS voiceovers using edge-tts/pydub, and compiles a cinematic MP4 using MoviePy.
    Caches output video in memory and returns a cached video endpoint.
    """
    logger.info(f"[Video] High-level conversion request for {len(body.panels)} panels")
    project_id = body.project_id or generate_project_id()
    temp_dir = os.path.join(tempfile.gettempdir(), "webtoon_workspace", project_id)
    os.makedirs(temp_dir, exist_ok=True)

    compiled_panels = []
    bgm_temp_path = None

    try:
        # Resolve background music (BGM) loop if selected
        if body.music_theme and body.music_theme != "No Music (Dialogue Only)":
            bgm_temp_path = download_bgm_to_temp(body.music_theme)

        # Resolve voice actor code
        voice_map = {
            "Standard Comic Narrator (Male)": "en-US-GuyNeural",
            "Sultry Narrative Tone (Female)": "en-US-AriaNeural",
            "Shonen Protagonist (Energetic Male)": "en-GB-RyanNeural",
            "Dark Anti-Hero voice (Raspy Deep)": "en-US-GuyNeural"
        }
        voice_code = voice_map.get(body.voice_actor, "en-US-GuyNeural") if body.voice_actor else "en-US-GuyNeural"
        logger.info(f"[Compile Video] Selected voice actor: '{body.voice_actor or 'Default'}' -> Code: {voice_code}")

        # 1. Prepare panel assets concurrently (images and TTS audio)
        async def process_single_panel(idx: int, panel: ConvertVideoPanel):
            image_path = os.path.join(temp_dir, f"panel_{idx}.png")
            audio_path = os.path.join(temp_dir, f"panel_{idx}.mp3")

            async def process_image():
                logger.info(f"[Compile Video] Resolving image {idx} from: {panel.image_url[:60]}...")
                resolved = await resolve_image_to_buffer(panel.image_url)
                
                def write_image():
                    with open(image_path, "wb") as f:
                        f.write(resolved["data"])
                
                await asyncio.to_thread(write_image)
                img_size_kb = round(len(resolved["data"]) / 1024, 1)
                logger.info(f"[Compile Video] Saved panel_{idx}.png ({img_size_kb}KB)")

            async def process_audio():
                logger.info(f"[Narration/TTS] Generating dialogue audio for panel {idx} | Voice: {voice_code} | Text: '{panel.speech_text[:40]}...'")
                await generate_panel_audio(
                    dialogue_list=[panel.speech_text or ""],
                    target_duration=panel.duration or 4.5,
                    output_path=audio_path,
                    voice=voice_code
                )
                audio_size_kb = round(os.path.getsize(audio_path) / 1024, 1)
                logger.info(f"[Narration/TTS] Generated panel_{idx}.mp3 ({audio_size_kb}KB)")

            await asyncio.gather(process_image(), process_audio())

            return {
                "image_path": image_path,
                "audio_path": audio_path,
                "duration": panel.duration or 4.5,
                "caption": panel.speech_text or ""
            }

        tasks = [process_single_panel(idx, panel) for idx, panel in enumerate(body.panels)]
        compiled_panels = await asyncio.gather(*tasks)


        # 2. Run video compiler
        output_video_path = os.path.join(temp_dir, f"render_{project_id}.mp4")
        
        logger.info(f"[Compile Video] Starting video compiler for {len(compiled_panels)} panels with BGM={bgm_temp_path}.")
        saved_path = await compile_video(
            panel_data=compiled_panels,
            output_path=output_video_path,
            bgm_path=bgm_temp_path,
            target_width=1920,
            target_height=1080,
            fps=24,
            zoom_factor=0.05,
            ducking_volume=0.15
        )

        if not os.path.exists(saved_path) or os.path.getsize(saved_path) == 0:
            raise RuntimeError("Video compiler failed to produce video file.")

        # 3. Read generated video and cache it
        with open(saved_path, "rb") as f:
            video_bytes = f.read()
            
        video_cache_id = f"video_{project_id}"
        video_url = f"/api/video/cached/{video_cache_id}"

        # Store in stitchedCache
        stitched_cache.set(video_cache_id, {"data": video_bytes, "content_type": "video/mp4"})
        logger.info(f"[Video] Successfully compiled and cached video with ID: {video_cache_id}")

        user_id = get_optional_user_id(request)
        if user_id:
            try:
                existing = db.get_project(project_id)
                if existing:
                    db.update_project(project_id, {
                        "status": "completed",
                        "video_url": video_url,
                        "panels_count": len(body.panels)
                    })
                    db.delete_panels(project_id)
                else:
                    parsed = parse_webtoon_url(body.url) if body.url else {"title": "Untitled Webtoon", "genre": "general", "episode": "Chapter 1"}
                    db.insert_project({
                        "project_id": project_id,
                        "url": body.url or "",
                        "title": parsed["title"],
                        "genre": parsed["genre"],
                        "episode": parsed["episode"],
                        "status": "completed",
                        "panels_count": len(body.panels),
                        "video_url": video_url,
                        "user_id": user_id
                    })
                
                db_panels = []
                for p in body.panels:
                    db_panels.append({
                        "image_url": p.image_url,
                        "original_url": p.image_url,
                        "speech_text": p.speech_text or "",
                        "sfx": "",
                        "duration": p.duration or 4.5,
                        "motion_type": "zoom_in",
                    })
                db.insert_panels(project_id, db_panels)
                logger.info(f"[Database] Automatically updated project {project_id} with video URL and panels for user {user_id}")
            except Exception as db_err:
                logger.error(f"[Database] Failed to automatically save video output to project: {db_err}", exc_info=True)

        return {
            "success": True,
            "project_id": project_id,
            "video_url": video_url,
            "panels": [p.model_dump() for p in body.panels],
            "message": f"Successfully compiled {len(body.panels)} frames into cinematic motion sequence."
        }

    except Exception as e:
        logger.error(f"[Convert Video API] Video compilation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Video compilation failed: {e}")
    finally:
        # Cleanup temp directory and downloaded bgm track
        try:
            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir, ignore_errors=True)
            if bgm_temp_path and os.path.exists(bgm_temp_path):
                os.remove(bgm_temp_path)
                logger.info(f"[Compile Video] Cleaned up temporary BGM path: {bgm_temp_path}")
        except Exception as cleanup_err:
            logger.warning(f"[Compile Video] Cleanup failed: {cleanup_err}")



@router.get("/video/cached/{video_id}", summary="Retrieve compiled cached video stream")
async def get_cached_video(video_id: str = Path(...)):
    cached = stitched_cache.get(video_id)
    if not cached:
        logger.warning(f"[API] Cached video not found or expired: {video_id}")
        raise HTTPException(status_code=404, detail="Video not found or expired.")
        
    logger.info(f"[API] Serving cached video {video_id} ({len(cached['data']) / 1024 / 1024:.2f}MB)")
    return Response(
        content=cached["data"],
        media_type=cached["content_type"],
        headers={"Cache-Control": "public, max-age=86400"}
    )
