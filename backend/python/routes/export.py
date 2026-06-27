import os
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import tempfile
import json
import aiohttp
from typing import Optional
try:
    import google_auth_oauthlib.flow
    import googleapiclient.discovery
    import googleapiclient.errors
    from googleapiclient.http import MediaFileUpload
    HAS_YOUTUBE_API = True
except ImportError:
    HAS_YOUTUBE_API = False

router = APIRouter()
logger = logging.getLogger("sonikoma.api.export")


class YouTubeExportRequest(BaseModel):
    video_url: str
    title: str
    synopsis: str


@router.post("/youtube")
async def export_to_youtube(request: YouTubeExportRequest):
    if not HAS_YOUTUBE_API:
        raise HTTPException(
            status_code=500,
            detail="Google API client libraries not installed. Run 'pip install google-api-python-client google-auth-oauthlib google-auth-httplib2'",
        )

    logger.info(f"Received YouTube export request for: {request.video_url}")

    is_remote = request.video_url.startswith("http://") or request.video_url.startswith("https://")

    # We will use a temporary file if it's remote, otherwise fallback to local public path
    tmp_video_path = None
    video_path = os.path.join(os.getcwd(), "public", "videos", request.video_url.split("/")[-1])

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

    if not os.path.exists(video_path):
        if tmp_video_path and os.path.exists(tmp_video_path):
            os.remove(tmp_video_path)
        raise HTTPException(status_code=404, detail="Video file not found or failed to download.")

    try:
        # Resolve project root (3 levels up from routes/export.py)
        PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))

        # Load Client Secrets from Env or Local File
        client_secrets_file = os.path.join(PROJECT_ROOT, "client_secrets.json")
        if not os.path.exists(client_secrets_file):
            cwd_secrets = os.path.join(os.getcwd(), "client_secrets.json")
            if os.path.exists(cwd_secrets):
                client_secrets_file = cwd_secrets

        env_secrets_raw = os.environ.get("YOUTUBE_CLIENT_SECRETS_JSON")
        env_secrets_raw = env_secrets_raw.strip() if isinstance(env_secrets_raw, str) else env_secrets_raw

        tmp_secrets_path = None

        def _try_coerce_env_json(raw: str):
            """Normalize common misformatted env-var JSON.

            - If the env value is a JSON-encoded string, unwrap it.
            - If it contains escaped newlines/quotes, try to decode again.
            """
            if not raw or not isinstance(raw, str):
                return raw

            s = raw.strip()

            # Case: env var is wrapped in quotes, e.g. "{...}" or '\n{...}\n'
            if (s.startswith('"') and s.endswith('"')) or (s.startswith("'") and s.endswith("'")):
                try:
                    unwrapped = json.loads(s)
                    if isinstance(unwrapped, str):
                        return unwrapped
                except Exception:
                    pass

            # Case: string contains escaped sequences and may be JSON-encoded string again
            try:
                decoded = json.loads(s)
                # If decoded is already a dict/list, re-dump to raw json
                if isinstance(decoded, (dict, list)):
                    return json.dumps(decoded)
            except Exception:
                pass

            return s

        # Keep env-secrets as a string only after coercion.
        env_secrets = None
        if env_secrets_raw:
            # Check if env_secrets_raw is a path to an existing file
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

            if file_content is not None:
                env_secrets = file_content
            else:
                env_secrets = _try_coerce_env_json(env_secrets_raw)

        if env_secrets:
            fd, tmp_secrets_path = tempfile.mkstemp(suffix=".json")
            os.close(fd)
            with open(tmp_secrets_path, "w", encoding="utf-8") as f:
                f.write(env_secrets)
            client_secrets_file = tmp_secrets_path

        if not os.path.exists(client_secrets_file):
            # Fallback to repo-provided default secrets file (dev convenience)
            repo_default = os.path.join(PROJECT_ROOT, "backend", "python", "youtube_client_secrets.json")
            if os.path.exists(repo_default):
                logger.warning(
                    f"client_secrets.json not found; falling back to {repo_default} (dev secrets)."
                )
                client_secrets_file = repo_default
            else:
                logger.warning("client_secrets.json not found (locally or via env).")
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "YouTube export is not configured. Provide 'client_secrets.json' in the project root "
                        "or set env var 'YOUTUBE_CLIENT_SECRETS_JSON' (contents of the JSON file) to enable real uploads."
                    ),
                )

        # Validate JSON before handing it to google auth library (prevents 500 JSONDecodeError stack traces)
        secrets_source = "env(YOUTUBE_CLIENT_SECRETS_JSON)" if client_secrets_file == tmp_secrets_path else f"file({client_secrets_file})"

        try:
            with open(client_secrets_file, "r", encoding="utf-8") as f:
                secrets_text = f.read()
            if not secrets_text or not secrets_text.strip():
                raise ValueError("secrets file is empty")

            secrets_obj = json.loads(secrets_text)
            if not isinstance(secrets_obj, dict) or ("installed" not in secrets_obj and "web" not in secrets_obj):
                raise ValueError("JSON does not look like an OAuth client secrets file (missing 'installed' or 'web')")

        except json.JSONDecodeError as je:
            # If env var was bad, attempt dev fallback once (if available)
            if client_secrets_file == tmp_secrets_path:
                repo_default = os.path.join(PROJECT_ROOT, "backend", "python", "youtube_client_secrets.json")
                if os.path.exists(repo_default):
                    logger.warning(
                        f"Failed to parse YOUTUBE_CLIENT_SECRETS_JSON; retrying with {repo_default}."
                    )
                    client_secrets_file = repo_default
                    with open(client_secrets_file, "r", encoding="utf-8") as f:
                        secrets_text = f.read()
                    secrets_obj = json.loads(secrets_text)
                else:
                    safe_snippet = (secrets_text or "").strip()[:40].replace("\n", "\\n")
                    safe_starts = "" if not secrets_text else secrets_text.strip()[:1]
                    raise HTTPException(
                        status_code=400,
                        detail=(
                            f"YouTube OAuth client secrets JSON is invalid ({secrets_source}). "
                            f"JSON parse error: {je}. "
                            f"Env diagnostic: startsWith={safe_starts!r}, first40={safe_snippet!r}. "
                            "Hint: set env var 'YOUTUBE_CLIENT_SECRETS_JSON' to RAW JSON (object starting with '{' or '['). "
                            "Do not paste templates or wrap the whole JSON in quotes."
                        ),
                    )
            else:
                safe_snippet = (secrets_text or "").strip()[:40].replace("\n", "\\n")
                safe_starts = "" if not secrets_text else secrets_text.strip()[:1]
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"YouTube OAuth client secrets JSON is invalid ({secrets_source}). "
                        f"JSON parse error: {je}. "
                        f"Env diagnostic: startsWith={safe_starts!r}, first40={safe_snippet!r}. "
                        "Hint: ensure the secrets file contains raw JSON, not a template or quoted string."
                    ),
                )

        except Exception as ve:
            # If env was bad, attempt dev fallback once
            if client_secrets_file == tmp_secrets_path:
                repo_default = os.path.join(PROJECT_ROOT, "backend", "python", "youtube_client_secrets.json")
                if os.path.exists(repo_default):
                    logger.warning(
                        f"YouTube OAuth client secrets problem detected in YOUTUBE_CLIENT_SECRETS_JSON; retrying with {repo_default}."
                    )
                    client_secrets_file = repo_default
                    with open(client_secrets_file, "r", encoding="utf-8") as f:
                        secrets_text = f.read()
                    secrets_obj = json.loads(secrets_text)
                else:
                    safe_snippet = "" if "secrets_text" not in locals() else (secrets_text or "").strip()[:40].replace("\n", "\\n")
                    raise HTTPException(
                        status_code=400,
                        detail=(
                            f"YouTube OAuth client secrets problem ({secrets_source}): {ve}. "
                            f"Content diagnostic: first40={safe_snippet!r}. "
                            "Hint: verify 'client_secrets.json' contents or set YOUTUBE_CLIENT_SECRETS_JSON with the raw OAuth client secrets JSON."
                        ),
                    )
            else:
                safe_snippet = "" if "secrets_text" not in locals() else (secrets_text or "").strip()[:40].replace("\n", "\\n")
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"YouTube OAuth client secrets problem ({secrets_source}): {ve}. "
                        f"Content diagnostic: first40={safe_snippet!r}. "
                        "Hint: verify 'client_secrets.json' contents or set YOUTUBE_CLIENT_SECRETS_JSON with the raw OAuth client secrets JSON."
                    ),
                )

        scopes = ["https://www.googleapis.com/auth/youtube.upload"]

        flow = google_auth_oauthlib.flow.InstalledAppFlow.from_client_secrets_file(client_secrets_file, scopes)

        # Determine a port to bind to for the local redirect server
        redirect_port = 0

        # Check environment variable YOUTUBE_REDIRECT_PORT first
        env_port = os.environ.get("YOUTUBE_REDIRECT_PORT")
        if env_port:
            try:
                redirect_port = int(env_port)
                logger.info(f"Using YouTube redirect port from YOUTUBE_REDIRECT_PORT env var: {redirect_port}")
            except ValueError:
                logger.warning(f"Invalid YOUTUBE_REDIRECT_PORT environment variable value: {env_port}")

        # Auto-detect loopback port from client secrets redirect_uris if port is not yet set
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
                            logger.info(f"Auto-detected YouTube redirect port {redirect_port} from client secrets redirect_uris.")
                            break
                    except Exception:
                        pass

        logger.info(f"Starting local server for OAuth flow on port {redirect_port}...")
        try:
            credentials = flow.run_local_server(port=redirect_port)
        except Exception as flow_err:
            logger.error(f"OAuth flow failed to start: {flow_err}")
            # Help the user debug redirect_uri_mismatch or other flow errors
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
            raise HTTPException(
                status_code=400,
                detail=f"OAuth authorization flow failed: {flow_err}. {hint_msg}"
            )

        youtube = googleapiclient.discovery.build("youtube", "v3", credentials=credentials)

        request_body = {
            "snippet": {
                "categoryId": "1",  # Film & Animation
                "title": request.title,
                "description": request.synopsis,
                "tags": ["sonikoma", "webtoon", "manga", "comic"],
            },
            "status": {
                "privacyStatus": "unlisted",
            },
        }

        media_file = MediaFileUpload(video_path, chunksize=-1, resumable=True)

        logger.info("Starting YouTube upload...")
        insert_request = youtube.videos().insert(part="snippet,status", body=request_body, media_body=media_file)

        response = insert_request.execute()

        video_id = response.get("id")
        logger.info(f"Upload complete! Video ID: {video_id}")

        return {
            "success": True,
            "youtube_url": f"https://youtube.com/watch?v={video_id}",
            "message": "Successfully uploaded to YouTube!",
        }

    except Exception as e:
        logger.error(f"YouTube export failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Cleanup temp files
        try:
            if "tmp_video_path" in locals() and tmp_video_path and os.path.exists(tmp_video_path):
                os.remove(tmp_video_path)
            if "tmp_secrets_path" in locals() and tmp_secrets_path and os.path.exists(tmp_secrets_path):
                os.remove(tmp_secrets_path)
        except OSError:
            pass

