"""
api/v1/export/youtube.py
─────────────────────────────────────────────────────────────────────────────
Core YouTube upload workflow and associated API endpoints.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import logging
import tempfile
import aiohttp
from typing import Optional

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends

from api.dependencies.auth import get_current_user
from backend.schemas.export import YouTubeExportRequest
from repositories.youtube_repository import log_youtube_publication
from services.export.youtube.workflow import execute_youtube_upload_workflow
from domain.exceptions import ResourceNotFoundException, ProcessingException

try:
    import google_auth_oauthlib.flow  # noqa: F401
    import googleapiclient.discovery  # noqa: F401
    import googleapiclient.errors  # noqa: F401
    from googleapiclient.http import MediaFileUpload  # noqa: F401
    HAS_YOUTUBE_API = True
except ImportError:
    HAS_YOUTUBE_API = False

logger = logging.getLogger("sonikoma.api.export.youtube")
router = APIRouter()


@router.post("/youtube")
async def export_to_youtube(
    request: YouTubeExportRequest, current_user: dict = Depends(get_current_user)
):
    if not HAS_YOUTUBE_API:
        raise HTTPException(
            status_code=500,
            detail="Google API client libraries not installed. Run 'pip install google-api-python-client google-auth-oauthlib google-auth-httplib2'",
        )

    logger.info(f"Received YouTube export request for: {request.video_url}")

    is_remote = request.video_url.startswith("http://") or request.video_url.startswith("https://")
    tmp_video_path = None
    video_path = os.path.join(os.getcwd(), "data", "media", request.video_url.split("/")[-1])

    if is_remote:
        fd, tmp_video_path = tempfile.mkstemp(suffix=".mp4")
        os.close(fd)
        logger.info(f"Downloading remote video from {request.video_url} to {tmp_video_path}")
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(request.video_url) as resp:
                    if resp.status == 200:
                        with open(tmp_video_path, "wb") as f:
                            f.write(await resp.read())
                        video_path = tmp_video_path
                    else:
                        raise Exception(f"Failed to download video: HTTP {resp.status}")
        except Exception as e:
            if tmp_video_path and os.path.exists(tmp_video_path):
                os.remove(tmp_video_path)
            raise HTTPException(status_code=500, detail=f"Failed to fetch remote video: {e}")

    tmp_thumb_path = None
    thumbnail_path = None
    if request.thumbnail_url:
        is_remote_thumb = request.thumbnail_url.startswith("http://") or request.thumbnail_url.startswith("https://")
        if is_remote_thumb:
            fd_t, tmp_thumb_path = tempfile.mkstemp(suffix=".jpg")
            os.close(fd_t)
            logger.info(f"Downloading remote thumbnail from {request.thumbnail_url} to {tmp_thumb_path}")
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.get(request.thumbnail_url) as resp:
                        if resp.status == 200:
                            with open(tmp_thumb_path, "wb") as f:
                                f.write(await resp.read())
                            thumbnail_path = tmp_thumb_path
            except Exception as e:
                logger.warning(f"Failed to download remote thumbnail: {e}")

    try:
        res = await execute_youtube_upload_workflow(
            video_path=video_path,
            title=request.title,
            description=request.synopsis,
            tags=request.tags,
            category_id=request.category_id,
            privacy_status=request.privacy_status,
            is_short=request.is_short,
            thumbnail_path=thumbnail_path,
            user_id=current_user.get("id"),
        )
        try:
            user_id = current_user.get("id")
            log_youtube_publication(
                user_id=user_id,
                chapter_id=None,
                youtube_url=res["youtube_url"],
                title=request.title,
                privacy_status=request.privacy_status or "unlisted",
            )
            logger.info(f"[Database] Logged publication to database: {res['youtube_url']}")
        except Exception as db_err:
            logger.error(f"[Database] Failed to log YouTube publication: {db_err}")
        return res
    except ResourceNotFoundException as rnf:
        raise HTTPException(status_code=404, detail=str(rnf.message))
    except ProcessingException as pe:
        raise HTTPException(status_code=500, detail=str(pe.message))
    finally:
        if tmp_video_path and os.path.exists(tmp_video_path):
            try:
                os.remove(tmp_video_path)
            except OSError:
                pass
        if tmp_thumb_path and os.path.exists(tmp_thumb_path):
            try:
                os.remove(tmp_thumb_path)
            except OSError:
                pass


@router.post("/youtube/upload")
async def upload_and_export_to_youtube(
    file: UploadFile = File(...),
    title: str = Form(...),
    synopsis: str = Form(...),
    tags: Optional[str] = Form(None),
    privacy_status: Optional[str] = Form("unlisted"),
    category_id: Optional[str] = Form("1"),
    is_short: Optional[bool] = Form(False),
    thumbnail: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user),
):
    if not HAS_YOUTUBE_API:
        raise HTTPException(
            status_code=500,
            detail="Google API client libraries not installed. Run 'pip install google-api-python-client google-auth-oauthlib google-auth-httplib2'",
        )

    logger.info(f"Received YouTube local file export request: {file.filename}")

    fd, tmp_video_path = tempfile.mkstemp(suffix=".mp4")
    os.close(fd)

    tmp_thumb_path = None
    thumbnail_path = None

    try:
        with open(tmp_video_path, "wb") as f:
            f.write(await file.read())

        if thumbnail:
            fd_t, tmp_thumb_path = tempfile.mkstemp(suffix=".jpg")
            os.close(fd_t)
            with open(tmp_thumb_path, "wb") as f:
                f.write(await thumbnail.read())
            thumbnail_path = tmp_thumb_path
            logger.info(f"Received custom local thumbnail: {thumbnail.filename}")

        tags_list = None
        if tags:
            tags_list = [t.strip() for t in tags.split(",") if t.strip()]

        res = await execute_youtube_upload_workflow(
            video_path=tmp_video_path,
            title=title,
            description=synopsis,
            tags=tags_list,
            category_id=category_id,
            privacy_status=privacy_status,
            is_short=is_short,
            thumbnail_path=thumbnail_path,
            user_id=current_user.get("id"),
        )
        try:
            user_id = current_user.get("id")
            log_youtube_publication(
                user_id=user_id,
                chapter_id=None,
                youtube_url=res["youtube_url"],
                title=title,
                privacy_status=privacy_status or "unlisted",
            )
            logger.info(f"[Database] Logged multipart publication to database: {res['youtube_url']}")
        except Exception as db_err:
            logger.error(f"[Database] Failed to log YouTube publication: {db_err}")
        return res
    except ResourceNotFoundException as rnf:
        raise HTTPException(status_code=404, detail=str(rnf.message))
    except ProcessingException as pe:
        raise HTTPException(status_code=500, detail=str(pe.message))
    finally:
        if tmp_video_path and os.path.exists(tmp_video_path):
            try:
                os.remove(tmp_video_path)
            except OSError:
                pass
        if tmp_thumb_path and os.path.exists(tmp_thumb_path):
            try:
                os.remove(tmp_thumb_path)
            except OSError:
                pass
