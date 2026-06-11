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
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Path, Request, Response
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel, Field

from services.video import compile_video
from services.audio import generate_panel_audio
from utils.image_utils import resolve_image_to_buffer
from utils.id_utils import generate_project_id
from utils.cache import stitched_cache

logger = logging.getLogger("anivox.routes.video")
router = APIRouter()

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
    duration: Optional[float] = Field(4.5, description="Panel frame duration")


class ConvertVideoRequest(BaseModel):
    panels: List[ConvertVideoPanel] = Field(..., min_length=1, description="Panels to convert to video")
    url: Optional[str] = Field(None, description="Source Webtoon page URL")


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
async def convert_images_to_video(body: ConvertVideoRequest):
    """
    Accepts panel image URLs and dialogue text. Fetches images, synthesizes
    TTS voiceovers using edge-tts/pydub, and compiles a cinematic MP4 using MoviePy.
    Caches output video in memory and returns a cached video endpoint.
    """
    logger.info(f"[Video] High-level conversion request for {len(body.panels)} panels")
    project_id = generate_project_id()
    temp_dir = os.path.join(tempfile.gettempdir(), "webtoon_workspace", project_id)
    os.makedirs(temp_dir, exist_ok=True)

    compiled_panels = []

    try:
        # 1. Prepare panel assets (images and TTS audio)
        for idx, panel in enumerate(body.panels):
            image_path = os.path.join(temp_dir, f"panel_{idx}.png")
            audio_path = os.path.join(temp_dir, f"panel_{idx}.mp3")

            # Resolve image and save to file
            logger.info(f"[Compile Video] Resolving image {idx} from: {panel.image_url[:60]}...")
            resolved = await resolve_image_to_buffer(panel.image_url)
            with open(image_path, "wb") as f:
                f.write(resolved["data"])
            img_size_kb = round(len(resolved["data"]) / 1024, 1)
            logger.info(f"[Compile Video] Saved panel_{idx}.png ({img_size_kb}KB)")

            # Generate TTS audio
            logger.info(f"[Narration/TTS] Generating dialogue audio for panel {idx} | Text: '{panel.speech_text[:40]}...'")
            await generate_panel_audio(
                dialogue_list=[panel.speech_text or ""],
                target_duration=panel.duration or 4.5,
                output_path=audio_path
            )
            audio_size_kb = round(os.path.getsize(audio_path) / 1024, 1)
            logger.info(f"[Narration/TTS] Generated panel_{idx}.mp3 ({audio_size_kb}KB)")

            compiled_panels.append({
                "image_path": image_path,
                "audio_path": audio_path,
                "duration": panel.duration or 4.5,
                "caption": panel.speech_text or ""
            })

        # 2. Run video compiler
        output_video_path = os.path.join(temp_dir, f"render_{project_id}.mp4")
        
        logger.info(f"[Compile Video] Starting video compiler for {len(compiled_panels)} panels.")
        saved_path = await compile_video(
            panel_data=compiled_panels,
            output_path=output_video_path,
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
        # Cleanup temp directory asynchronously or in try block
        try:
            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir, ignore_errors=True)
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
