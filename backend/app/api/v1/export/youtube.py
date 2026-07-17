"""
api/v1/export/youtube.py
─────────────────────────────────────────────────────────────────────────────
Core YouTube upload workflow and associated API endpoints.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import json
import logging
import asyncio
import tempfile
import aiohttp
from typing import Optional, List

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends

from api.dependencies.auth import get_current_user
from schemas.export import YouTubeExportRequest
from database.db import get_youtube_credentials, log_youtube_publication

try:
    import google_auth_oauthlib.flow
    import googleapiclient.discovery
    import googleapiclient.errors
    from googleapiclient.http import MediaFileUpload
    HAS_YOUTUBE_API = True
except ImportError:
    HAS_YOUTUBE_API = False

logger = logging.getLogger("sonikoma.api.export.youtube")
router = APIRouter()


async def _execute_youtube_upload_workflow(
    video_path: str,
    title: str,
    description: str,
    tags: Optional[List[str]] = None,
    category_id: Optional[str] = "1",
    privacy_status: Optional[str] = "unlisted",
    is_short: Optional[bool] = False,
    thumbnail_path: Optional[str] = None,
    user_id: Optional[str] = None,
) -> dict:
    """Core workflow for authenticating and uploading a video file to YouTube."""
    if not os.path.exists(video_path):
        raise HTTPException(status_code=404, detail="Video file not found.")

    tmp_secrets_path = None
    try:
        # Resolve custom credentials if user_id is provided
        custom_secrets = None
        if user_id:
            db_creds = get_youtube_credentials(user_id)
            if db_creds:
                custom_secrets = json.dumps(
                    {
                        "installed": {
                            "client_id": db_creds["client_id"],
                            "client_secret": db_creds["client_secret"],
                            "project_id": db_creds["project_id"],
                            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                            "token_uri": "https://oauth2.googleapis.com/token",
                            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                            "redirect_uris": ["http://localhost", "urn:ietf:wg:oauth:2.0:oob"],
                        }
                    }
                )
                logger.info(f"Using user custom credentials from database for user_id: {user_id}")

        # Resolve project root (3 levels up from routes/export.py)
        PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))

        # Load Client Secrets from Env or Local File
        client_secrets_file = os.path.join(PROJECT_ROOT, "client_secrets.json")
        if not os.path.exists(client_secrets_file):
            cwd_secrets = os.path.join(os.getcwd(), "client_secrets.json")
            if os.path.exists(cwd_secrets):
                client_secrets_file = cwd_secrets

        env_secrets_raw = os.environ.get("YOUTUBE_CLIENT_SECRETS_JSON")
        env_secrets_raw = env_secrets_raw.strip() if isinstance(env_secrets_raw, str) else env_secrets_raw

        def _try_coerce_env_json(raw: str):
            if not raw or not isinstance(raw, str):
                return raw
            s = raw.strip()
            if (s.startswith('"') and s.endswith('"')) or (s.startswith("'") and s.endswith("'")):
                try:
                    unwrapped = json.loads(s)
                    if isinstance(unwrapped, str):
                        return unwrapped
                except Exception:
                    pass
            try:
                decoded = json.loads(s)
                if isinstance(decoded, (dict, list)):
                    return json.dumps(decoded)
            except Exception:
                pass
            return s

        env_secrets = None
        if custom_secrets:
            env_secrets = custom_secrets
        elif env_secrets_raw:
            possible_paths = [
                env_secrets_raw,
                os.path.join(PROJECT_ROOT, env_secrets_raw),
                os.path.join(os.getcwd(), env_secrets_raw),
            ]
            file_content = None
            for p in possible_paths:
                try:
                    cleaned_p = p.strip().strip('"').strip("'")
                    if cleaned_p and os.path.isfile(cleaned_p):
                        with open(cleaned_p, "r", encoding="utf-8") as f:
                            file_content = f.read()
                        logger.info(f"Loaded YouTube client secrets from path: {cleaned_p}")
                        break
                except Exception:
                    pass

            env_secrets = file_content if file_content is not None else _try_coerce_env_json(env_secrets_raw)

        if env_secrets:
            fd, tmp_secrets_path = tempfile.mkstemp(suffix=".json")
            os.close(fd)
            with open(tmp_secrets_path, "w", encoding="utf-8") as f:
                f.write(env_secrets)
            client_secrets_file = tmp_secrets_path

        if not os.path.exists(client_secrets_file):
            # Prefer repo's shared secrets filename used by this project.
            repo_default = os.path.join(PROJECT_ROOT, "backend", "app", "client_secrets.json")
            if os.path.exists(repo_default):
                logger.warning(
                    f"client_secrets.json not found; falling back to {repo_default} (dev secrets)."
                )
                client_secrets_file = repo_default
            else:
                # Backward-compat fallback for older setups.
                legacy_default = os.path.join(PROJECT_ROOT, "backend", "app", "client_secrets.json")
                if os.path.exists(legacy_default):
                    logger.warning(
                        f"client_secrets.json not found; falling back to {legacy_default} (legacy dev secrets)."
                    )
                    client_secrets_file = legacy_default
                else:
                    logger.warning("client_secrets.json not found (locally or via env).")
                    raise HTTPException(
                        status_code=400,
                        detail=(
                            "YouTube export is not configured. Provide 'client_secrets.json' in the project root "
                            "or set env var 'YOUTUBE_CLIENT_SECRETS_JSON' (contents of the JSON file) to enable real uploads."
                        ),
                    )

        secrets_source = (
            "env(YOUTUBE_CLIENT_SECRETS_JSON)"
            if client_secrets_file == tmp_secrets_path
            else f"file({client_secrets_file})"
        )

        try:
            with open(client_secrets_file, "r", encoding="utf-8") as f:
                secrets_text = f.read()
            if not secrets_text or not secrets_text.strip():
                raise ValueError("secrets file is empty")

            secrets_obj = json.loads(secrets_text)
            if not isinstance(secrets_obj, dict) or (
                "installed" not in secrets_obj and "web" not in secrets_obj
            ):
                raise ValueError("JSON does not look like an OAuth client secrets file (missing 'installed' or 'web')")

        except json.JSONDecodeError as je:
            if client_secrets_file == tmp_secrets_path:
                repo_default = os.path.join(PROJECT_ROOT, "backend", "app", "client_secrets.json")
                if os.path.exists(repo_default):
                    logger.warning(
                        f"Failed to parse YOUTUBE_CLIENT_SECRETS_JSON; retrying with {repo_default}."
                    )
                    client_secrets_file = repo_default
                    with open(client_secrets_file, "r", encoding="utf-8") as f:
                        secrets_text = f.read()
                    secrets_obj = json.loads(secrets_text)
                else:
                    clean_text = (secrets_text or "").strip()
                    looks_like_path = clean_text.startswith((".", "/", "\\")) or clean_text.endswith(".json")
                    if looks_like_path:
                        friendly_error = (
                            f"Configuration Error: The YouTube client secrets variable appears to be a file path ('{clean_text[:40]}...'), "
                            "but the server could not find a valid file at that location. "
                            "Please provide the raw JSON content directly in your .env file, or ensure the file path is absolute and correct."
                        )
                    else:
                        friendly_error = (
                            "Configuration Error: The provided YouTube client secrets are not formatted as valid JSON. "
                            "Please check your .env file and ensure YOUTUBE_CLIENT_SECRETS_JSON contains a properly formatted JSON object."
                        )
                    raise HTTPException(status_code=400, detail=friendly_error)
            else:
                clean_text = (secrets_text or "").strip()
                looks_like_path = clean_text.startswith((".", "/", "\\")) or clean_text.endswith(".json")
                if looks_like_path:
                    friendly_error = (
                        f"Configuration Error: The YouTube client secrets variable appears to be a file path ('{clean_text[:40]}...'), "
                        "but the server could not find a valid file at that location. "
                        "Please provide the raw JSON content directly in your .env file, or ensure the file path is absolute and correct."
                    )
                else:
                    friendly_error = (
                        "Configuration Error: The provided YouTube client secrets are not formatted as valid JSON. "
                        "Please check your .env file and ensure YOUTUBE_CLIENT_SECRETS_JSON contains a properly formatted JSON object."
                    )
                raise HTTPException(status_code=400, detail=friendly_error)

        except Exception as ve:
            if client_secrets_file == tmp_secrets_path:
                repo_default = os.path.join(PROJECT_ROOT, "backend", "app", "client_secrets.json")
                if os.path.exists(repo_default):
                    logger.warning(
                        f"YouTube OAuth client secrets problem detected in YOUTUBE_CLIENT_SECRETS_JSON; retrying with {repo_default}."
                    )
                    client_secrets_file = repo_default
                    with open(client_secrets_file, "r", encoding="utf-8") as f:
                        secrets_text = f.read()
                    secrets_obj = json.loads(secrets_text)
                else:
                    raise HTTPException(status_code=400, detail=str(ve))
            else:
                raise HTTPException(status_code=400, detail=str(ve))

        scopes = ["https://www.googleapis.com/auth/youtube.upload"]
        flow = google_auth_oauthlib.flow.InstalledAppFlow.from_client_secrets_file(client_secrets_file, scopes)

        redirect_port = 0
        env_port = os.environ.get("YOUTUBE_REDIRECT_PORT")
        if env_port:
            try:
                redirect_port = int(env_port)
                logger.info(f"Using YouTube redirect port from YOUTUBE_REDIRECT_PORT env var: {redirect_port}")
            except ValueError:
                logger.warning(f"Invalid YOUTUBE_REDIRECT_PORT environment variable value: {env_port}")

        if redirect_port == 0 and "secrets_obj" in locals() and isinstance(secrets_obj, dict):
            client_type = "web" if "web" in secrets_obj else "installed"
            redirect_uris = secrets_obj.get(client_type, {}).get("redirect_uris", [])
            for uri in redirect_uris:
                if "localhost:" in uri or "127.0.0.1:" in uri:
                    import urllib.parse
                    try:
                        parsed_uri = urllib.parse.urlparse(uri)
                        if parsed_uri.port:
                            redirect_port = parsed_uri.port
                            logger.info(
                                f"Auto-detected YouTube redirect port {redirect_port} from client secrets redirect_uris."
                            )
                            break
                    except Exception:
                        pass

        logger.info(f"Starting local server for OAuth flow on port {redirect_port}...")
        try:
            credentials = await asyncio.to_thread(
                flow.run_local_server,
                port=redirect_port,
                timeout_seconds=120
            )
        except Exception as flow_err:
            logger.error(f"OAuth flow failed to start or timed out: {flow_err}")
            is_timeout = (
                isinstance(flow_err, AttributeError) and 
                "NoneType" in str(flow_err) and 
                "replace" in str(flow_err)
            )
            if is_timeout:
                raise HTTPException(
                    status_code=408,
                    detail="YouTube authorization timed out (no response received within 120 seconds). Please try again and complete the authorization in your browser tab."
                )
            
            is_web_client = "secrets_obj" in locals() and isinstance(secrets_obj, dict) and "web" in secrets_obj
            hint_msg = (
                "Hint: You are using a 'Web Application' client ID. For local development, it is highly recommended to "
                "use a 'Desktop Application' client ID in the Google Cloud Console instead, which supports dynamic loopback ports out-of-the-box.\n"
                "If you must use a 'Web Application' client ID, register a redirect URI like 'http://localhost:8080/' in the "
                "Google Developer Console and set env var YOUTUBE_REDIRECT_PORT=8080."
            ) if is_web_client else (
                "Hint: Ensure that 'http://localhost:<port>/' is configured as an authorized redirect URI for your client ID "
                "in the Google Cloud Console."
            )
            raise HTTPException(status_code=400, detail=f"OAuth authorization flow failed: {flow_err}. {hint_msg}")

        youtube = googleapiclient.discovery.build("youtube", "v3", credentials=credentials)

        default_tags = ["sonikoma", "webtoon", "manga", "comic"]
        user_tags = tags if tags else []
        final_tags = list(set(default_tags + [t.strip() for t in user_tags if t.strip()]))

        final_title = title
        final_description = description

        if is_short:
            if "#Shorts" not in final_title and "#shorts" not in final_title:
                if len(final_title) + 8 > 100:
                    final_title = final_title[:90].strip() + " #Shorts"
                else:
                    final_title = final_title + " #Shorts"
            if "#Shorts" not in final_description and "#shorts" not in final_description:
                final_description = final_description + "\n\n#Shorts #webtoon #video"

        request_body = {
            "snippet": {
                "categoryId": category_id or "1",
                "title": final_title,
                "description": final_description,
                "tags": final_tags,
            },
            "status": {"privacyStatus": privacy_status or "unlisted"},
        }

        media_file = MediaFileUpload(video_path, chunksize=-1, resumable=True)

        logger.info("Starting YouTube upload...")
        insert_request = youtube.videos().insert(part="snippet,status", body=request_body, media_body=media_file)
        response = insert_request.execute()

        video_id = response.get("id")
        logger.info(f"Upload complete! Video ID: {video_id}")

        if thumbnail_path and os.path.exists(thumbnail_path):
            try:
                logger.info(f"Uploading custom thumbnail for video {video_id}...")
                media_thumb = MediaFileUpload(thumbnail_path, mimetype="image/jpeg")
                youtube.thumbnails().set(videoId=video_id, media_body=media_thumb).execute()
                logger.info("Custom thumbnail successfully applied.")
            except Exception as thumb_err:
                logger.warning(f"Failed to apply custom thumbnail: {thumb_err}")

        return {
            "success": True,
            "youtube_url": f"https://youtube.com/watch?v={video_id}",
            "message": "Successfully uploaded to YouTube!",
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"YouTube export failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        try:
            if tmp_secrets_path and os.path.exists(tmp_secrets_path):
                os.remove(tmp_secrets_path)
        except OSError:
            pass


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
        res = await _execute_youtube_upload_workflow(
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

        res = await _execute_youtube_upload_workflow(
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
