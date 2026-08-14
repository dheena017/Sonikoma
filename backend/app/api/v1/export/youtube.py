"""
api/v1/export/youtube.py
─────────────────────────────────────────────────────────────────────────────
Core YouTube upload workflow and associated API endpoints.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import json
import hmac
import time
import uuid
import hashlib
import logging
import tempfile
import urllib.parse
import aiohttp
import requests
from typing import Optional

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, Request
from fastapi.responses import RedirectResponse, JSONResponse

from api.dependencies.auth import get_current_user
from schemas.export import YouTubeExportRequest
from repositories.youtube import (
    log_youtube_publication,
    save_youtube_oauth_tokens, get_youtube_oauth_tokens,
    save_selected_youtube_channel, get_selected_youtube_channel,
)
from services.export.youtube.workflow import execute_youtube_upload_workflow
from services.export.youtube.oauth import fetch_user_youtube_channels
from services.export.youtube.service import YouTubeService
from app.core.exceptions import ResourceNotFoundException, ProcessingException
from app.core.config import APP_URL, JWT_SECRET_KEY
from database.engine import get_db_connection

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

# Cookie name for tracking YouTube OAuth state (separate from Sonikoma login cookie)
YT_OAUTH_STATE_COOKIE = "yt_oauth_state"

# Scopes for full YouTube channel management, statistics & video publishing
YOUTUBE_SCOPES = [
    "https://www.googleapis.com/auth/youtube",
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.force-ssl",
]


def _generate_signed_state(user_id: str) -> str:
    """Generate a cryptographically signed state parameter tying the OAuth request to user_id."""
    nonce = uuid.uuid4().hex
    timestamp = str(int(time.time()))
    payload = f"{user_id}:{nonce}:{timestamp}"
    sig = hmac.new(JWT_SECRET_KEY.encode(), payload.encode(), hashlib.sha256).hexdigest()
    return f"{payload}:{sig}"


def _verify_signed_state(state: Optional[str]) -> Optional[str]:
    """Verify HMAC signature & 5-minute expiration of the state token, returning user_id if valid."""
    if not state or ":" not in state:
        return None
    parts = state.split(":")
    if len(parts) != 4:
        return None
    user_id, nonce, timestamp_str, sig = parts
    payload = f"{user_id}:{nonce}:{timestamp_str}"
    expected_sig = hmac.new(JWT_SECRET_KEY.encode(), payload.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(sig, expected_sig):
        logger.warning(f"HMAC state signature mismatch for state payload user_id={user_id}")
        return None
    try:
        ts = int(timestamp_str)
        if time.time() - ts > 300:  # 5 minutes expiration
            logger.warning(f"YouTube OAuth state expired (age: {int(time.time() - ts)}s)")
            return None
    except ValueError:
        return None
    return user_id



def _load_google_secrets() -> tuple[str, str]:
    """Load Google OAuth client_id and client_secret from env or client_secrets.json."""
    env_client_id = os.getenv("GOOGLE_CLIENT_ID")
    env_client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    if env_client_id and env_client_secret:
        return env_client_id, env_client_secret

    base_dir = os.path.dirname(__file__)
    project_root = os.path.abspath(os.path.join(base_dir, "..", "..", "..", "..", ".."))
    candidates = [
        os.path.join(project_root, "backend", "client_secrets.json"),
        os.path.join(project_root, "client_secrets.json"),
        os.path.join(os.getcwd(), "client_secrets.json"),
    ]
    client_secrets_file = next((p for p in candidates if os.path.exists(p)), None)
    if not client_secrets_file:
        raise HTTPException(
            status_code=400,
            detail="Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env",
        )
    with open(client_secrets_file, "r", encoding="utf-8") as f:
        secrets_data = json.load(f)
    key = "web" if "web" in secrets_data else "installed"
    return secrets_data[key]["client_id"], secrets_data[key].get("client_secret", "")


def _get_user_id(current_user: Optional[dict]) -> Optional[str]:
    """Safely extract user ID from authenticated user dictionary regardless of key formatting (id vs user_id)."""
    if not current_user or not isinstance(current_user, dict):
        return None
    return current_user.get("id") or current_user.get("user_id") or current_user.get("sub")


def _get_youtube_redirect_uri(request: Request) -> str:
    """Determine the YouTube-specific OAuth redirect URI."""
    env_uri = os.getenv("YOUTUBE_OAUTH_REDIRECT_URI")
    if env_uri:
        return env_uri
    if APP_URL:
        base = APP_URL.rstrip("/")
        return f"{base}/api/export/youtube/oauth/callback"
    host = request.headers.get("host", "localhost:8000")
    scheme = "https" if request.url.scheme == "https" else "http"
    return f"{scheme}://{host}/api/export/youtube/oauth/callback"


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
            user_id=_get_user_id(current_user),
        )
        try:
            user_id = _get_user_id(current_user)
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
    title: str = Form("Untitled Video"),
    synopsis: Optional[str] = Form(""),
    tags: Optional[str] = Form(None),
    privacy_status: Optional[str] = Form("unlisted"),
    category_id: Optional[str] = Form("1"),
    is_short: Optional[str] = Form("false"),
    thumbnail: Optional[UploadFile] = File(None),
    playlist: Optional[str] = Form(None),
    author_name: Optional[str] = Form(None),
    artist_name: Optional[str] = Form(None),
    webtoon_platform: Optional[str] = Form(None),
    custom_platform: Optional[str] = Form(None),
    chapter_start: Optional[str] = Form(None),
    chapter_end: Optional[str] = Form(None),
    subtitles_type: Optional[str] = Form(None),
    subtitles_language: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user),
):
    if not HAS_YOUTUBE_API:
        raise HTTPException(
            status_code=500,
            detail="Google API client libraries not installed. Run 'pip install google-api-python-client google-auth-oauthlib google-auth-httplib2'",
        )

    # Normalize is_short: FormData sends strings "true"/"false"
    is_short_bool: bool = str(is_short).lower() in ("true", "1", "yes", "on")

    logger.info(f"Received YouTube local file export request: {file.filename} | is_short={is_short_bool} | title={title}")

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
            is_short=is_short_bool,
            thumbnail_path=thumbnail_path,
            user_id=_get_user_id(current_user),
        )
        try:
            user_id = _get_user_id(current_user)
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


@router.get("/youtube/channels")
async def get_youtube_channels(
    current_user: Optional[dict] = Depends(get_current_user)
):
    """
    Returns all YouTube channels/accounts linked to the authenticated user's Google account.
    Returns needs_reauth=True when the user has no stored YouTube OAuth tokens.
    """
    user_id = _get_user_id(current_user)
    if not user_id:
        return {"channels": [], "count": 0, "needs_reauth": True, "message": "User session required"}

    # Check if the user has dedicated YouTube OAuth tokens or custom credentials
    has_youtube_tokens = False
    try:
        tokens = get_youtube_oauth_tokens(user_id)
        if tokens and (tokens.get("access_token") or tokens.get("refresh_token")):
            has_youtube_tokens = True
    except Exception:
        pass

    if not has_youtube_tokens:
        return {
            "channels": [],
            "count": 0,
            "needs_reauth": True,
            "message": "YouTube authorization required. Please connect your YouTube account.",
        }

    service = YouTubeService(user_id=user_id)
    channels = await service.get_channels()
    return {
        "channels": channels,
        "count": len(channels),
        "needs_reauth": False,
    }


@router.post("/youtube/channel/lookup", summary="Search or add a YouTube channel by handle or ID")
async def lookup_youtube_channel_route(
    payload: dict,
    current_user: dict = Depends(get_current_user),
):
    """
    Looks up a YouTube channel by handle (e.g. '@motivatenow-t1e') or ID ('UC...'),
    verifies it against YouTube Data API, and stores it in the user's channel list.
    """
    user_id = _get_user_id(current_user)
    query = payload.get("query", "").strip()
    if not query:
        raise HTTPException(status_code=400, detail="Channel handle or ID is required")

    from services.export.youtube.oauth import lookup_youtube_channel_by_handle
    channel = await lookup_youtube_channel_by_handle(user_id=user_id, query=query)
    if not channel:
        raise HTTPException(status_code=404, detail=f"No YouTube channel found for '{query}'")

    return {
        "success": True,
        "channel": channel,
        "message": f"Found channel: {channel.get('title')}",
    }


@router.delete("/youtube/channel/{channel_id}", summary="Remove a channel from user's channel list")
async def delete_youtube_channel_route(
    channel_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Removes a channel from the user's saved channels."""
    user_id = _get_user_id(current_user)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    from repositories.youtube.repository import delete_user_youtube_channel
    deleted = delete_user_youtube_channel(user_id=user_id, channel_id=channel_id)
    return {"success": deleted, "channel_id": channel_id}



@router.get("/youtube/playlists")
async def get_youtube_playlists(
    current_user: Optional[dict] = Depends(get_current_user)
):
    """Returns all playlists under the user's YouTube channel."""
    user_id = _get_user_id(current_user)
    service = YouTubeService(user_id=user_id)
    playlists = await service.get_playlists()
    return {"playlists": playlists, "count": len(playlists)}


@router.post("/youtube/playlists", summary="Create a new YouTube playlist")
async def create_youtube_playlist(
    payload: dict,
    current_user: dict = Depends(get_current_user),
):
    """Creates a new playlist on the user's YouTube channel."""
    user_id = _get_user_id(current_user)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    title = payload.get("title", "").strip()
    if not title:
        raise HTTPException(status_code=400, detail="Playlist title is required")
    description = payload.get("description", "")
    privacy = payload.get("privacy", "public")
    video_ids = payload.get("video_ids", [])
    service = YouTubeService(user_id=user_id)
    try:
        playlist = await service.create_playlist(
            title=title,
            description=description,
            privacy=privacy,
            video_ids=video_ids,
        )
        return {"success": True, "playlist": playlist}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create playlist: {e}")

@router.get("/youtube/playlist/{playlist_id}/items", summary="Fetch videos in a YouTube playlist")
async def get_youtube_playlist_items_route(
    playlist_id: str,
    max_results: int = 50,
    current_user: Optional[dict] = Depends(get_current_user),
):
    """Returns all video items inside a playlist."""
    user_id = _get_user_id(current_user)
    service = YouTubeService(user_id=user_id)
    items = await service.get_playlist_items(playlist_id=playlist_id, max_results=max_results)
    return {"items": items, "count": len(items)}


@router.get("/youtube/channel/details")
async def get_youtube_channel_details(
    current_user: Optional[dict] = Depends(get_current_user)
):
    """Returns complete channel header, banner, subscriber count, and total views."""
    user_id = _get_user_id(current_user)
    service = YouTubeService(user_id=user_id)
    return await service.get_channel_overview()


@router.get("/youtube/profile")
async def get_youtube_profile_details(
    current_user: Optional[dict] = Depends(get_current_user)
):
    """Returns full YouTube profile details, user identity, avatar, description, and connected channels."""
    user_id = _get_user_id(current_user)
    service = YouTubeService(user_id=user_id)
    overview = await service.get_channel_overview()
    channels = await service.get_channels()

    has_tokens = False
    if user_id:
        try:
            tokens = get_youtube_oauth_tokens(user_id)
            if tokens and (tokens.get("access_token") or tokens.get("refresh_token")):
                has_tokens = True
        except Exception:
            pass

    is_authenticated = overview.get("authenticated", False) or has_tokens

    return {
        "authenticated": is_authenticated,
        "user_email": current_user.get("email") if current_user else None,
        "user_name": current_user.get("name") or current_user.get("full_name") if current_user else None,
        "user_picture": current_user.get("picture") or current_user.get("avatar_url") if current_user else None,
        "overview": overview,
        "channels": channels,
    }


@router.get("/youtube/videos")
async def get_youtube_videos(
    max_results: int = 24,
    current_user: Optional[dict] = Depends(get_current_user)
):
    """Returns uploaded videos feed with real-time statistics."""
    user_id = _get_user_id(current_user)
    service = YouTubeService(user_id=user_id)
    videos = await service.get_user_videos(max_results=max_results)
    return {"videos": videos, "count": len(videos)}


@router.get("/youtube/comments/{video_id}")
async def get_youtube_video_comments(
    video_id: str,
    current_user: Optional[dict] = Depends(get_current_user)
):
    """Fetches live comments for a YouTube video."""
    user_id = _get_user_id(current_user)
    service = YouTubeService(user_id=user_id)
    comments = await service.get_video_comments(video_id=video_id)
    return {"comments": comments, "count": len(comments)}


@router.post("/youtube/seo/generate")
async def generate_youtube_seo_metadata(
    payload: dict,
    current_user: Optional[dict] = Depends(get_current_user)
):
    """Generates AI-optimized titles, descriptions, hashtags & SEO score."""
    user_id = _get_user_id(current_user)
    service = YouTubeService(user_id=user_id)
    title = payload.get("title", "")
    series = payload.get("series", "")
    return await service.generate_seo_metadata(title=title, series=series)


@router.post("/youtube/playlist/ai-generate", summary="Real AI generation for playlist title, description, tags and video sequencing")
async def generate_youtube_playlist_ai_route(
    payload: dict,
    current_user: Optional[dict] = Depends(get_current_user),
):
    """
    Analyzes available YouTube videos and creator theme/prompt with real LLM to synthesize
    a viral title, comprehensive SEO description, indexed hashtags, and optimal video sequencing.
    """
    user_id = _get_user_id(current_user)
    service = YouTubeService(user_id=user_id)
    prompt = payload.get("prompt", "")
    videos = payload.get("videos", [])
    channel_name = payload.get("channel_name", "")
    return await service.generate_playlist_ai_metadata(
        prompt=prompt,
        videos=videos,
        channel_name=channel_name,
    )



@router.post("/youtube/copyright-check")
async def check_youtube_copyright(
    payload: dict,
    current_user: Optional[dict] = Depends(get_current_user)
):
    """Pre-scans background audio for YouTube copyright safety."""
    user_id = _get_user_id(current_user)
    service = YouTubeService(user_id=user_id)
    audio_path = payload.get("audio_path")
    return await service.perform_copyright_precheck(audio_path=audio_path)


@router.get("/youtube/quota")
async def get_youtube_quota_telemetry(
    current_user: Optional[dict] = Depends(get_current_user)
):
    """Returns API quota metrics and rate limiting health."""
    user_id = _get_user_id(current_user)
    service = YouTubeService(user_id=user_id)
    return await service.get_quota_telemetry()



# ── YouTube-Specific OAuth Connect Flow ────────────────────────────────────
# This is COMPLETELY SEPARATE from the Sonikoma Google login at /api/auth/google/login.
# It initiates a YouTube-only authorization with YouTube API scopes, and its callback
# redirects back to the YouTube page (not the dashboard) so the user can select a channel.

@router.get("/youtube/oauth/connect", summary="Initiate YouTube-specific OAuth authorization")
async def youtube_oauth_connect(
    request: Request,
    current_user: dict = Depends(get_current_user),
):
    """
    Starts the YouTube channel connect flow for an already logged-in Sonikoma user.
    Does NOT create a new Sonikoma session — it only authorizes YouTube API access.
    Encodes and signs state token tying request cryptographically to user_id.

    If the request Accept header includes 'application/json', returns the auth URL
    as JSON so the frontend can navigate there after the cookie is set.
    Otherwise performs a standard 302 browser redirect.
    """
    try:
        client_id, _ = _load_google_secrets()
    except HTTPException as exc:
        raise exc

    user_id = _get_user_id(current_user)
    if not user_id:
        raise HTTPException(status_code=401, detail="User session required")

    redirect_uri = _get_youtube_redirect_uri(request)
    state = _generate_signed_state(user_id)

    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": " ".join(YOUTUBE_SCOPES),
        "access_type": "offline",
        "prompt": "select_account consent",  # Show Google account & Brand Account picker
        "state": state,
    }

    auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urllib.parse.urlencode(params)}"
    logger.info(f"[YouTube OAuth] Initiating signed YouTube OAuth for user {user_id} with redirect_uri: {redirect_uri}")

    secure = request.url.scheme == "https"
    accept_header = request.headers.get("accept", "")

    if "application/json" in accept_header:
        # Frontend called this via fetch() with Authorization header.
        # Return JSON with the auth URL — the frontend will navigate to it.
        response = JSONResponse(content={"auth_url": auth_url})
        response.set_cookie(YT_OAUTH_STATE_COOKIE, state, max_age=300, httponly=True, secure=secure, samesite="lax", path="/")
        return response

    # Standard browser redirect (fallback or direct navigation)
    response = RedirectResponse(auth_url)
    response.set_cookie(YT_OAUTH_STATE_COOKIE, state, max_age=300, httponly=True, secure=secure, samesite="lax", path="/")
    return response


@router.get("/youtube/oauth/callback", summary="YouTube OAuth callback — saves tokens, redirects to channel selector")
async def youtube_oauth_callback(request: Request):
    """
    Handles the Google OAuth callback specifically for YouTube channel authorization.
    Verifies the HMAC signature of state to extract and validate the authenticated user_id.
    Does NOT create a Sonikoma login session or JWT.
    Redirects back to /creative-suite/youtube?select_channel=true.
    """
    state = request.query_params.get("state")
    code = request.query_params.get("code")
    error = request.query_params.get("error")

    # Determine frontend URL dynamically (never hardcode localhost)
    if APP_URL:
        frontend_url = APP_URL.rstrip("/")
    else:
        host = request.headers.get("host", "localhost:5173")
        scheme = "https" if request.url.scheme == "https" else "http"
        frontend_url = f"{scheme}://{host}"

    yt_page_url = f"{frontend_url}/creative-suite/youtube"

    if error:
        logger.warning(f"[YouTube OAuth] OAuth error returned: {error}")
        return RedirectResponse(f"{yt_page_url}?yt_error={urllib.parse.quote(error)}")

    # Verify cryptographic HMAC signature of state token to get user_id securely
    user_id = _verify_signed_state(state)
    if not user_id:
        logger.error("[YouTube OAuth] State token verification failed or expired")
        return RedirectResponse(f"{yt_page_url}?yt_error=invalid_state")

    # Verify cookie matches query state for double-submit protection
    cookie_state = request.cookies.get(YT_OAUTH_STATE_COOKIE)
    if cookie_state and not hmac.compare_digest(state, cookie_state):
        logger.error("[YouTube OAuth] Cookie state mismatch")
        return RedirectResponse(f"{yt_page_url}?yt_error=state_mismatch")

    if not code:
        return RedirectResponse(f"{yt_page_url}?yt_error=no_code")

    try:
        client_id, client_secret = _load_google_secrets()
    except HTTPException:
        return RedirectResponse(f"{yt_page_url}?yt_error=no_credentials")

    redirect_uri = _get_youtube_redirect_uri(request)

    # Exchange auth code for tokens
    try:
        token_resp = requests.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": client_id,
                "client_secret": client_secret,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            },
            timeout=15,
        )
        token_data = token_resp.json()
    except Exception as e:
        logger.error(f"[YouTube OAuth] Token exchange request failed: {e}")
        return RedirectResponse(f"{yt_page_url}?yt_error=token_exchange_failed")

    access_token = token_data.get("access_token")
    refresh_token = token_data.get("refresh_token")

    if not access_token:
        logger.error(f"[YouTube OAuth] Token exchange: no access_token returned in response")
        return RedirectResponse(f"{yt_page_url}?yt_error=no_access_token")

    # Save YouTube-specific tokens (attached to verified user_id)
    try:
        save_youtube_oauth_tokens(
            user_id=user_id,
            access_token=access_token,
            refresh_token=refresh_token,
            client_id=client_id,
            client_secret=client_secret,
            scopes=" ".join(YOUTUBE_SCOPES),
        )
        logger.info(f"[YouTube OAuth] YouTube OAuth tokens saved securely for user {user_id}")
    except Exception as e:
        logger.error(f"[YouTube OAuth] Failed to save YouTube OAuth tokens for user {user_id}: {e}")
        return RedirectResponse(f"{yt_page_url}?yt_error=save_failed")

    # Immediately discover and persist the authorized YouTube channel
    try:
        discovered_channels = await fetch_user_youtube_channels(user_id=user_id)
        if discovered_channels:
            first_ch = discovered_channels[0]
            cid = first_ch.get("id")
            title = first_ch.get("title")
            # If no channel is currently selected, select this newly connected channel
            current_selected = get_selected_youtube_channel(user_id)
            if not current_selected or not current_selected.get("id"):
                save_selected_youtube_channel(
                    user_id=user_id,
                    channel_id=cid,
                    title=title,
                    thumbnail=first_ch.get("thumbnail"),
                    handle=first_ch.get("custom_url"),
                )
                logger.info(f"[YouTube OAuth] Auto-selected newly authorized channel '{title}' ({cid})")
    except Exception as disc_err:
        logger.warning(f"[YouTube OAuth] Post-auth channel discovery warning: {disc_err}")

    response = RedirectResponse(f"{yt_page_url}?select_channel=true")
    response.delete_cookie(YT_OAUTH_STATE_COOKIE, path="/")
    return response


@router.post("/youtube/disconnect", summary="Disconnect YouTube integration for the user")
async def disconnect_youtube(
    current_user: dict = Depends(get_current_user),
):
    """
    Clears all stored YouTube OAuth tokens and selected channel metadata for this user.
    Does NOT affect the user's Sonikoma account or login session.
    """
    user_id = _get_user_id(current_user)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    try:
        conn = get_db_connection()
        try:
            conn.execute("DELETE FROM youtube_oauth_tokens WHERE user_id = ?", (user_id,))
            conn.commit()
        finally:
            conn.close()
        logger.info(f"Disconnected YouTube for user {user_id}")
        return {"success": True, "message": "YouTube disconnected successfully"}
    except Exception as e:
        logger.error(f"Failed to disconnect YouTube for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to disconnect YouTube")



@router.get("/youtube/active-channel", summary="Get the currently selected YouTube channel")
async def get_active_youtube_channel(
    current_user: dict = Depends(get_current_user),
):
    """Returns the currently selected YouTube channel for this user, if any."""
    user_id = current_user.get("id") or current_user.get("user_id")
    channel = get_selected_youtube_channel(user_id)
    tokens = get_youtube_oauth_tokens(user_id)
    return {
        "connected": tokens is not None,
        "channel": channel,
    }


@router.post("/youtube/select-channel", summary="Save the user's selected YouTube channel")
async def select_youtube_channel(
    payload: dict,
    current_user: dict = Depends(get_current_user),
):
    """
    Saves the user's selected YouTube channel after they pick one from the channel-selection modal.
    Associates the channel ID/title/thumbnail with their Sonikoma account.
    """
    user_id = current_user.get("id") or current_user.get("user_id")
    channel_id = payload.get("channel_id")
    title = payload.get("title", "")
    thumbnail = payload.get("thumbnail")
    handle = payload.get("custom_url") or payload.get("handle")

    if not channel_id:
        raise HTTPException(status_code=400, detail="channel_id is required")

    # Verify the user has YouTube connected
    tokens = get_youtube_oauth_tokens(user_id)
    if not tokens:
        raise HTTPException(status_code=403, detail="YouTube is not connected. Please connect YouTube first.")

    try:
        save_selected_youtube_channel(
            user_id=user_id,
            channel_id=channel_id,
            title=title,
            thumbnail=thumbnail,
            handle=handle,
        )
    except Exception as e:
        logger.error(f"Failed to save selected channel for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save channel selection: {e}")

    return {
        "success": True,
        "selected_channel": {
            "id": channel_id,
            "title": title,
            "thumbnail": thumbnail,
            "custom_url": handle,
        },
    }
