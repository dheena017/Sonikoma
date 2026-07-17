"""
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
from typing import Optional

from core.exceptions import ServiceException
from database.db import get_youtube_credentials

try:
    import google_auth_oauthlib.flow
    import googleapiclient.discovery
    import googleapiclient.errors
except ImportError:
    pass

logger = logging.getLogger("sonikoma.services.export.youtube.oauth")

async def get_authenticated_service(user_id: Optional[str] = None):
    """Authenticates using the client_secrets and returns a YouTube service object."""
    tmp_secrets_path = None
    try:
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

        PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))

        # Canonical location after restructure: backend/client_secrets.json
        client_secrets_file = os.path.join(PROJECT_ROOT, "backend", "client_secrets.json")
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
                logger.warning(f"client_secrets.json not found; falling back to {repo_default} (dev secrets).")
                client_secrets_file = repo_default
            elif os.path.exists(legacy_default):
                logger.warning(f"client_secrets.json not found; falling back to {legacy_default} (legacy dev secrets).")
                client_secrets_file = legacy_default
            else:
                logger.warning("client_secrets.json not found (locally or via env).")
                raise ServiceException(
                    status_code=400,
                    message=(
                        "YouTube export is not configured. Provide 'client_secrets.json' in backend/ "
                        "or set env var 'YOUTUBE_CLIENT_SECRETS_JSON' (contents of the JSON file) to enable real uploads."
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

        youtube = googleapiclient.discovery.build("youtube", "v3", credentials=credentials)
        return youtube
    finally:
        try:
            if tmp_secrets_path and os.path.exists(tmp_secrets_path):
                os.remove(tmp_secrets_path)
        except OSError:
            pass
