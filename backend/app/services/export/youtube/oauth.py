"""c
backend/app/services/export/youtube/oauth.py
─────────────────────────────────────────────────────────────────────────────
Handles OAuth flow, credentials resolution, and YouTube client instantiation.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import json
import logging
import asyncio
import tempfile
from typing import Optional, Any

from app.core.exceptions import ServiceException
from repositories.youtube import get_youtube_credentials

try:
    import google_auth_oauthlib.flow
    import googleapiclient.discovery
    import googleapiclient.errors
    _GOOGLE_API_AVAILABLE = True
except ImportError:
    _GOOGLE_API_AVAILABLE = False

logger = logging.getLogger("sonikoma.services.export.youtube.oauth")


def _build_youtube_client(credentials: Any) -> Any:
    """Build YouTube service client with a 10s request timeout to prevent socket hangs."""
    try:
        import httplib2
        import google_auth_httplib2
        http_client = google_auth_httplib2.AuthorizedHttp(
            credentials,
            http=httplib2.Http(timeout=10)
        )
        return googleapiclient.discovery.build(
            "youtube", "v3",
            http=http_client,
            cache_discovery=False
        )
    except Exception:
        return googleapiclient.discovery.build(
            "youtube", "v3",
            credentials=credentials,
            cache_discovery=False
        )


async def get_authenticated_service(user_id: Optional[str] = None, allow_interactive: bool = False) -> Any:
    """Authenticates using stored YouTube OAuth tokens or client_secrets and returns a YouTube service object."""
    if not _GOOGLE_API_AVAILABLE:
        raise ServiceException(
            status_code=500,
            message=(
                "YouTube integration requires 'google-api-python-client' and 'google-auth-oauthlib'. "
                "Run: pip install google-api-python-client google-auth-oauthlib google-auth-httplib2"
            ),
        )
    tmp_secrets_path = None
    try:
        if user_id:
            # 1st priority: dedicated YouTube OAuth tokens (from YouTube connect flow)
            try:
                from repositories.youtube import get_youtube_oauth_tokens
                yt_tokens = get_youtube_oauth_tokens(user_id)
                if yt_tokens and yt_tokens.get("access_token"):
                    from google.oauth2.credentials import Credentials
                    creds = Credentials(
                        token=yt_tokens["access_token"],
                        refresh_token=yt_tokens.get("refresh_token"),
                        token_uri=yt_tokens.get("token_uri", "https://oauth2.googleapis.com/token"),
                        client_id=yt_tokens.get("client_id"),
                        client_secret=yt_tokens.get("client_secret"),
                    )
                    youtube = _build_youtube_client(creds)
                    logger.info(f"Authenticated YouTube via dedicated YouTube OAuth tokens for user {user_id}")
                    return youtube
            except Exception as yt_err:
                logger.info(f"YouTube OAuth token auth note: {yt_err}")

            # 2nd priority: Google session token only if dedicated YouTube tokens not found
            # (Note: Google login tokens often lack YouTube upload/readonly scopes)
            try:
                from repositories.user import get_user_by_id
                user = get_user_by_id(user_id)
                if user and user.get("google_access_token"):
                    from google.oauth2.credentials import Credentials
                    creds = Credentials(token=user.get("google_access_token"))
                    youtube = _build_youtube_client(creds)
                    return youtube
            except Exception as token_err:
                pass

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

        if not allow_interactive and not custom_secrets:
            raise ServiceException(
                status_code=401,
                message="No active YouTube credentials stored for this user."
            )

        PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))

        tmp_secrets_path = None
        secrets_text = ""
        secrets_obj = None

        # Canonical location after restructure: backend/client_secrets.json
        client_secrets_file = os.path.join(PROJECT_ROOT, "backend", "data", "client_secrets.json")
        if not os.path.exists(client_secrets_file):
            # Legacy root fallback
            root_secrets = os.path.join(PROJECT_ROOT, "client_secrets.json")
            if os.path.exists(root_secrets):
                client_secrets_file = root_secrets
            else:
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
            # Try canonical backend/ location, then legacy backend/app/ location
            repo_default = os.path.join(PROJECT_ROOT, "backend", "client_secrets.json")
            legacy_default = os.path.join(PROJECT_ROOT, "backend", "app", "client_secrets.json")
            if os.path.exists(repo_default):
                logger.info(f"Using client secrets from: {repo_default}")
                client_secrets_file = repo_default
            elif os.path.exists(legacy_default):
                logger.info(f"Using client secrets from: {legacy_default}")
                client_secrets_file = legacy_default
            else:
                # Check environment variables GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
                google_client_id = os.getenv("GOOGLE_CLIENT_ID")
                google_client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
                if google_client_id:
                    synthetic_secrets = json.dumps({
                        "web": {
                            "client_id": google_client_id.strip().strip('"').strip("'"),
                            "client_secret": (google_client_secret or "").strip().strip('"').strip("'"),
                            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                            "token_uri": "https://oauth2.googleapis.com/token",
                        }
                    })
                    fd, tmp_secrets_path = tempfile.mkstemp(suffix=".json")
                    os.close(fd)
                    with open(tmp_secrets_path, "w", encoding="utf-8") as f:
                        f.write(synthetic_secrets)
                    client_secrets_file = tmp_secrets_path
                else:
                    logger.warning("client_secrets.json not found (locally or via env).")
                    raise ServiceException(
                        status_code=400,
                        message=(
                            "YouTube export is not configured. Provide 'client_secrets.json' in backend/ "
                            "or set env var 'GOOGLE_CLIENT_ID' and 'GOOGLE_CLIENT_SECRET' in .env to enable real uploads."
                        ),
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
                repo_default = os.path.join(PROJECT_ROOT, "backend", "client_secrets.json")
                if not os.path.exists(repo_default):
                    repo_default = os.path.join(PROJECT_ROOT, "backend", "app", "client_secrets.json")
                if os.path.exists(repo_default):
                    logger.warning(f"Failed to parse YOUTUBE_CLIENT_SECRETS_JSON; retrying with {repo_default}.")
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
                    raise ServiceException(status_code=400, message=friendly_error)
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
                raise ServiceException(status_code=400, message=friendly_error)

        except Exception as ve:
            if client_secrets_file == tmp_secrets_path:
                repo_default = os.path.join(PROJECT_ROOT, "backend", "client_secrets.json")
                if not os.path.exists(repo_default):
                    repo_default = os.path.join(PROJECT_ROOT, "backend", "app", "client_secrets.json")
                if os.path.exists(repo_default):
                    logger.warning(f"YouTube OAuth client secrets problem detected in YOUTUBE_CLIENT_SECRETS_JSON; retrying with {repo_default}.")
                    client_secrets_file = repo_default
                    with open(client_secrets_file, "r", encoding="utf-8") as f:
                        secrets_text = f.read()
                    secrets_obj = json.loads(secrets_text)
                else:
                    raise ServiceException(status_code=400, message=str(ve))
            else:
                raise ServiceException(status_code=400, message=str(ve))

        scopes = [
            "https://www.googleapis.com/auth/youtube",
            "https://www.googleapis.com/auth/youtube.readonly",
            "https://www.googleapis.com/auth/youtube.upload",
            "https://www.googleapis.com/auth/youtube.force-ssl",
        ]
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
                            logger.info(f"Auto-detected YouTube redirect port {redirect_port} from client secrets redirect_uris.")
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
                raise ServiceException(
                    status_code=408,
                    message="YouTube authorization timed out (no response received within 120 seconds). Please try again and complete the authorization in your browser tab."
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
            raise ServiceException(status_code=400, message=f"OAuth authorization flow failed: {flow_err}. {hint_msg}")

        youtube = _build_youtube_client(credentials)
        return youtube
    finally:
        try:
            if tmp_secrets_path and os.path.exists(tmp_secrets_path):
                os.remove(tmp_secrets_path)
        except OSError:
            pass


async def fetch_user_youtube_channels(user_id: Optional[str] = None) -> list[dict]:
    """
    Fetches ALL YouTube channels (personal + brand accounts) associated with the user's
    Google account. Consolidates live YouTube API responses with previously connected
    and stored channels from the local database.
    """
    channel_map: dict[str, dict] = {}

    # ── Step 0: Pre-populate from database stored channels for this user ──────
    unlinked_ids: set[str] = set()
    if user_id:
        try:
            from repositories.youtube import get_user_youtube_channels, get_selected_youtube_channel, get_user_unlinked_channel_ids
            unlinked_ids = get_user_unlinked_channel_ids(user_id)
            saved_channels = get_user_youtube_channels(user_id)
            for ch in saved_channels:
                cid = ch.get("id") or ch.get("channel_id")
                if cid and cid not in unlinked_ids:
                    channel_map[cid] = ch
            logger.info(f"[YouTube Channels] Pre-loaded {len(channel_map)} saved channel(s) from DB for user {user_id}")

            selected_ch = get_selected_youtube_channel(user_id)
            if selected_ch and selected_ch.get("id"):
                sel_id = selected_ch["id"]
                if sel_id not in unlinked_ids and sel_id not in channel_map:
                    channel_map[sel_id] = {
                        "id": sel_id,
                        "title": selected_ch.get("title") or "YouTube Channel",
                        "custom_url": selected_ch.get("custom_url") or "",
                        "thumbnail": selected_ch.get("thumbnail") or "",
                        "subscriber_count": "--",
                        "view_count": "--",
                        "video_count": "0",
                        "type": "personal",
                        "is_selected": 1,
                    }
        except Exception as db_err:
            pass

    # ── Step 1: Query live YouTube API for the currently authorized account ───
    try:
        youtube = await get_authenticated_service(user_id=user_id)

        try:
            req_mine = youtube.channels().list(
                part="snippet,contentDetails,statistics,brandingSettings",
                mine=True,
            )
            res_mine = await asyncio.to_thread(req_mine.execute)
            items = res_mine.get("items", [])
            logger.info(f"[YouTube Channels] mine=true response: {len(items)} channel(s) found")

            for item in items:
                cid = item.get("id")
                if cid:
                    # If this channel was previously marked unlinked, user is now explicitly authorized/using it
                    unlinked_ids.discard(cid)
                    
                    snippet = item.get("snippet", {})
                    stats = item.get("statistics", {})
                    branding = item.get("brandingSettings", {}).get("image", {})
                    
                    sub_count = stats.get("subscriberCount")
                    view_count = stats.get("viewCount")
                    vid_count = stats.get("videoCount", "0")

                    norm_ch = {
                        "id": cid,
                        "title": snippet.get("title") or "YouTube Channel",
                        "description": snippet.get("description", ""),
                        "custom_url": snippet.get("customUrl") or "",
                        "thumbnail": (
                            snippet.get("thumbnails", {}).get("high", {}).get("url")
                            or snippet.get("thumbnails", {}).get("medium", {}).get("url")
                            or snippet.get("thumbnails", {}).get("default", {}).get("url")
                            or ""
                        ),
                        "banner_url": branding.get("bannerExternalUrl") or "",
                        "subscriber_count": f"{int(sub_count):,}" if sub_count else "--",
                        "view_count": f"{int(view_count):,}" if view_count else "--",
                        "video_count": str(vid_count),
                        "type": "brand" if (snippet.get("customUrl") or branding.get("bannerExternalUrl")) else "personal",
                        "is_selected": 1 if (user_id and cid in channel_map and channel_map[cid].get("is_selected")) else 0,
                    }
                    channel_map[cid] = norm_ch

                    # Persist newly retrieved channel details to database (also clears unlinked table)
                    if user_id:
                        try:
                            from repositories.youtube import save_user_youtube_channel
                            save_user_youtube_channel(user_id, norm_ch)
                        except Exception as save_err:
                            pass
        except Exception as e_mine:
            logger.warning(f"[YouTube Channels] Warning querying mine=true channels: {e_mine}")

        # ── Step 2: Refresh stats for other known channels if present ────────
        other_ids = [cid for cid in channel_map.keys() if cid]
        if other_ids:
            try:
                # Query in batches of up to 50
                chunk = other_ids[:50]
                req_batch = youtube.channels().list(
                    part="snippet,statistics",
                    id=",".join(chunk),
                )
                res_batch = await asyncio.to_thread(req_batch.execute)
                for item in res_batch.get("items", []):
                    cid = item.get("id")
                    if cid and cid in channel_map:
                        snippet = item.get("snippet", {})
                        stats = item.get("statistics", {})
                        sub_count = stats.get("subscriberCount")
                        view_count = stats.get("viewCount")
                        
                        channel_map[cid]["title"] = snippet.get("title") or channel_map[cid]["title"]
                        if snippet.get("customUrl"):
                            channel_map[cid]["custom_url"] = snippet.get("customUrl")
                        thumb = (
                            snippet.get("thumbnails", {}).get("high", {}).get("url")
                            or snippet.get("thumbnails", {}).get("default", {}).get("url")
                        )
                        if thumb:
                            channel_map[cid]["thumbnail"] = thumb
                        if sub_count:
                            channel_map[cid]["subscriber_count"] = f"{int(sub_count):,}"
                        if view_count:
                            channel_map[cid]["view_count"] = f"{int(view_count):,}"
                        channel_map[cid]["video_count"] = str(stats.get("videoCount", channel_map[cid].get("video_count", "0")))
            except Exception as batch_err:
                pass

    except Exception as e:
        logger.warning(f"[YouTube Channels] Could not connect to YouTube service: {e}")

    result = list(channel_map.values())
    safe_channel_summary = [
        {"id": c.get("id"), "title": c.get("title"), "handle": c.get("custom_url")}
        for c in result
    ]
    logger.info(f"[YouTube Channels] Normalized channels count={len(result)}: {safe_channel_summary}")
    return result


async def lookup_youtube_channel_by_handle(user_id: Optional[str], query: str) -> Optional[dict]:
    """
    Search or look up a YouTube channel by handle (e.g. '@motivatenow-t1e'),
    channel ID ('UC...'), or custom URL using the authorized YouTube service.
    """
    clean_q = query.strip()
    if not clean_q:
        return None

    # Strip full YouTube URLs if pasted
    if "youtube.com/" in clean_q:
        if "/@" in clean_q:
            clean_q = "@" + clean_q.split("/@")[-1].split("/")[0].split("?")[0]
        elif "/channel/" in clean_q:
            clean_q = clean_q.split("/channel/")[-1].split("/")[0].split("?")[0]

    async def _try_api_lookup():
        youtube = await get_authenticated_service(user_id=user_id, allow_interactive=False)

        # 1. Try by channel ID if it starts with 'UC'
        if clean_q.startswith("UC") and len(clean_q) >= 20:
            req = youtube.channels().list(part="snippet,statistics", id=clean_q)
            res = await asyncio.to_thread(req.execute)
            items = res.get("items", [])
            if items:
                item = items[0]
                snippet = item.get("snippet", {})
                stats = item.get("statistics", {})
                sub_count = stats.get("subscriberCount")
                norm_ch = {
                    "id": item.get("id"),
                    "title": snippet.get("title") or clean_q,
                    "description": snippet.get("description", ""),
                    "custom_url": snippet.get("customUrl") or "",
                    "thumbnail": (
                        snippet.get("thumbnails", {}).get("high", {}).get("url")
                        or snippet.get("thumbnails", {}).get("default", {}).get("url")
                        or ""
                    ),
                    "subscriber_count": f"{int(sub_count):,}" if sub_count else "--",
                    "view_count": f"{int(stats.get('viewCount', 0)):,}" if stats.get("viewCount") else "--",
                    "video_count": str(stats.get("videoCount", "0")),
                    "type": "personal",
                }
                if user_id:
                    from repositories.youtube import save_user_youtube_channel
                    save_user_youtube_channel(user_id, norm_ch)
                return norm_ch

        # 2. Try by handle
        handle_str = clean_q if clean_q.startswith("@") else f"@{clean_q}"
        try:
            req = youtube.channels().list(part="snippet,statistics", forHandle=handle_str)
            res = await asyncio.to_thread(req.execute)
            items = res.get("items", [])
            if items:
                item = items[0]
                snippet = item.get("snippet", {})
                stats = item.get("statistics", {})
                sub_count = stats.get("subscriberCount")
                norm_ch = {
                    "id": item.get("id"),
                    "title": snippet.get("title") or handle_str,
                    "description": snippet.get("description", ""),
                    "custom_url": snippet.get("customUrl") or handle_str,
                    "thumbnail": (
                        snippet.get("thumbnails", {}).get("high", {}).get("url")
                        or snippet.get("thumbnails", {}).get("default", {}).get("url")
                        or ""
                    ),
                    "subscriber_count": f"{int(sub_count):,}" if sub_count else "--",
                    "view_count": f"{int(stats.get('viewCount', 0)):,}" if stats.get("viewCount") else "--",
                    "video_count": str(stats.get("videoCount", "0")),
                    "type": "brand",
                }
                if user_id:
                    from repositories.youtube import save_user_youtube_channel
                    save_user_youtube_channel(user_id, norm_ch)
                return norm_ch
        except Exception as handle_err:
            pass

        # 3. Try by username
        username_str = clean_q.lstrip("@")
        try:
            req = youtube.channels().list(part="snippet,statistics", forUsername=username_str)
            res = await asyncio.to_thread(req.execute)
            items = res.get("items", [])
            if items:
                item = items[0]
                snippet = item.get("snippet", {})
                stats = item.get("statistics", {})
                sub_count = stats.get("subscriberCount")
                norm_ch = {
                    "id": item.get("id"),
                    "title": snippet.get("title") or username_str,
                    "description": snippet.get("description", ""),
                    "custom_url": snippet.get("customUrl") or f"@{username_str}",
                    "thumbnail": (
                        snippet.get("thumbnails", {}).get("high", {}).get("url")
                        or snippet.get("thumbnails", {}).get("default", {}).get("url")
                        or ""
                    ),
                    "subscriber_count": f"{int(sub_count):,}" if sub_count else "--",
                    "view_count": f"{int(stats.get('viewCount', 0)):,}" if stats.get("viewCount") else "--",
                    "video_count": str(stats.get("videoCount", "0")),
                    "type": "brand",
                }
                if user_id:
                    from repositories.youtube import save_user_youtube_channel
                    save_user_youtube_channel(user_id, norm_ch)
                return norm_ch
        except Exception as un_err:
            pass

        # 4. Try API Search by Channel Name/Topic
        try:
            req_search = youtube.search().list(part="snippet", q=clean_q, type="channel", maxResults=1)
            res_search = await asyncio.to_thread(req_search.execute)
            items_search = res_search.get("items", [])
            if items_search:
                cid = items_search[0].get("id", {}).get("channelId")
                if cid:
                    req_detail = youtube.channels().list(part="snippet,statistics", id=cid)
                    res_detail = await asyncio.to_thread(req_detail.execute)
                    items_detail = res_detail.get("items", [])
                    if items_detail:
                        item = items_detail[0]
                        snippet = item.get("snippet", {})
                        stats = item.get("statistics", {})
                        sub_count = stats.get("subscriberCount")
                        norm_ch = {
                            "id": cid,
                            "title": snippet.get("title") or clean_q,
                            "description": snippet.get("description", ""),
                            "custom_url": snippet.get("customUrl") or f"@{clean_q.replace(' ', '')}",
                            "thumbnail": (
                                snippet.get("thumbnails", {}).get("high", {}).get("url")
                                or snippet.get("thumbnails", {}).get("default", {}).get("url")
                                or ""
                            ),
                            "subscriber_count": f"{int(sub_count):,}" if sub_count else "--",
                            "view_count": f"{int(stats.get('viewCount', 0)):,}" if stats.get("viewCount") else "--",
                            "video_count": str(stats.get("videoCount", "0")),
                            "type": "brand",
                        }
                        if user_id:
                            from repositories.youtube import save_user_youtube_channel
                            save_user_youtube_channel(user_id, norm_ch)
                        return norm_ch
        except Exception as search_err:
            pass

        return None

    try:
        api_result = await asyncio.wait_for(_try_api_lookup(), timeout=3.0)
        if api_result:
            return api_result
    except Exception as e:
        pass

    # 5. Fallback: Parse public YouTube channel page
    try:
        import urllib.request
        import urllib.parse
        import re
        import json

        clean_handle = clean_q if clean_q.startswith("@") else f"@{clean_q}"
        if clean_q.startswith("UC") and len(clean_q) >= 20:
            target_url = f"https://www.youtube.com/channel/{clean_q}"
        else:
            target_url = f"https://www.youtube.com/{clean_handle}"

        def _fetch_public():
            req_pub = urllib.request.Request(
                target_url,
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
            )
            return urllib.request.urlopen(req_pub, timeout=8).read().decode("utf-8")

        html = await asyncio.to_thread(_fetch_public)
        title_m = re.search(r'<meta property="og:title" content="(.*?)">', html)
        img_m = re.search(r'<meta property="og:image" content="(.*?)">', html)
        cid_m = re.search(r'"channelId":"(UC[a-zA-Z0-9_-]{22})"', html) or re.search(r'<meta itemprop="channelId" content="(.*?)">', html)
        sub_m = re.search(r'"subscriberCountText":\{"accessibility":\{"accessibilityData":\{"label":"(.*?)"\}\},"simpleText":"(.*?)"\}', html)
        vid_m = re.search(r'([0-9,]+)\s+videos', html, re.IGNORECASE)

        if title_m or cid_m:
            resolved_title = title_m.group(1) if title_m else clean_q
            resolved_id = cid_m.group(1) if cid_m else (clean_q if clean_q.startswith("UC") else f"UC_{clean_q.replace('@', '')}")
            resolved_subs = sub_m.group(2) if sub_m else "--"
            resolved_vids = vid_m.group(1) if vid_m else "0"

            norm_ch = {
                "id": resolved_id,
                "title": resolved_title,
                "description": "",
                "custom_url": clean_handle,
                "thumbnail": img_m.group(1) if img_m else "",
                "subscriber_count": resolved_subs,
                "view_count": "--",
                "video_count": str(resolved_vids),
                "type": "brand",
            }
            if user_id:
                from repositories.youtube import save_user_youtube_channel
                save_user_youtube_channel(user_id, norm_ch)
            logger.info(f"[YouTube Channels] Successfully resolved public channel '{resolved_title}' ({resolved_id})")
            return norm_ch
    except Exception as fallback_err:
        pass

    # 6. Fallback: Search YouTube public search results for channel name
    try:
        import urllib.request
        import urllib.parse
        import re
        import json

        encoded_q = urllib.parse.quote(clean_q)
        search_url = f"https://www.youtube.com/results?search_query={encoded_q}&sp=EgIQAg%253D%253D"

        def _fetch_search():
            req_s = urllib.request.Request(
                search_url,
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
            )
            return urllib.request.urlopen(req_s, timeout=8).read().decode("utf-8")

        html_s = await asyncio.to_thread(_fetch_search)
        m = re.search(r'var ytInitialData = ({.*?});</script>', html_s)
        if m:
            data = json.loads(m.group(1))
            contents = data.get("contents", {}).get("twoColumnSearchResultsRenderer", {}).get("primaryContents", {}).get("sectionListRenderer", {}).get("contents", [])
            for section in contents:
                item_section = section.get("itemSectionRenderer", {}).get("contents", [])
                for item in item_section:
                    if "channelRenderer" in item:
                        cr = item["channelRenderer"]
                        cid = cr.get("channelId")
                        title = cr.get("title", {}).get("simpleText") or cr.get("title", {}).get("runs", [{}])[0].get("text")
                        canonical = cr.get("navigationEndpoint", {}).get("browseEndpoint", {}).get("canonicalBaseUrl", "")
                        thumb = cr.get("thumbnail", {}).get("thumbnails", [{}])[-1].get("url")
                        video_count = cr.get("videoCountText", {}).get("runs", [{}])[0].get("text", "0") if "videoCountText" in cr else "0"
                        subscribers = cr.get("subscriberCountText", {}).get("simpleText", "--")
                        if cid and title:
                            norm_ch = {
                                "id": cid,
                                "title": title,
                                "description": "",
                                "custom_url": canonical or f"@{clean_q.replace(' ', '')}",
                                "thumbnail": thumb if (thumb and thumb.startswith("http")) else (f"https:{thumb}" if thumb else ""),
                                "subscriber_count": subscribers,
                                "view_count": "--",
                                "video_count": str(video_count),
                                "type": "brand",
                            }
                            if user_id:
                                from repositories.youtube import save_user_youtube_channel
                                save_user_youtube_channel(user_id, norm_ch)
                            logger.info(f"[YouTube Channels] Resolved channel via search for '{clean_q}': {title} ({cid})")
                            return norm_ch
    except Exception as search_scrape_err:
        logger.warning(f"[YouTube Channels] Search scrape fallback failed for '{clean_q}': {search_scrape_err}")

    return None



