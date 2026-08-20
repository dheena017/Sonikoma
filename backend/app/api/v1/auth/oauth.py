"""
backend/app/api/v1/auth/oauth.py
─────────────────────────────────────────────────────────────────────────────
Google OAuth2 authentication routes.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import re
import uuid
import json
import hmac
import logging
import urllib.parse
import requests
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse

from app.core.config import APP_URL
from app.core.security import get_password_hash, create_access_token
from repositories.user import (
    get_user_by_email,
    get_user_by_username,
    create_user_relational,
    update_user,
)

logger = logging.getLogger("sonikoma.auth.oauth")
router = APIRouter()

OAUTH_STATE_COOKIE_NAME = "google_oauth_state"
OAUTH_STATE_MAX_AGE = 300  # 5 minutes


def _generate_oauth_state() -> str:
    return uuid.uuid4().hex


def _set_oauth_state_cookie(response: RedirectResponse, state: str, secure: bool) -> None:
    response.set_cookie(
        OAUTH_STATE_COOKIE_NAME,
        state,
        max_age=OAUTH_STATE_MAX_AGE,
        httponly=True,
        secure=secure,
        samesite="lax",
        path="/",
    )


def _get_oauth_state(request: Request) -> str | None:
    return request.cookies.get(OAUTH_STATE_COOKIE_NAME)


def _delete_oauth_state_cookie(response: RedirectResponse) -> None:
    response.delete_cookie(
        OAUTH_STATE_COOKIE_NAME,
        path="/",
    )


def _load_google_secrets() -> tuple[str, str | None]:
    """
    Locate Google OAuth credentials from env vars (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
    or client_secrets.json. Returns (client_id, client_secret).
    Raises HTTPException(400) if credentials are not configured.
    """
    env_client_id = os.getenv("GOOGLE_CLIENT_ID")
    env_client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    if env_client_id:
        return env_client_id, env_client_secret

    base_dir = os.path.dirname(__file__)
    project_root = os.path.abspath(os.path.join(base_dir, "..", "..", "..", "..", ".."))

    candidates = [
        os.path.join(project_root, "backend", "client_secrets.json"),  # canonical location
        os.path.join(project_root, "client_secrets.json"),              # legacy root fallback
        os.path.join(os.getcwd(), "client_secrets.json"),
        os.path.join(project_root, "backend", "app", "client_secrets.json"),
    ]

    client_secrets_file = next((p for p in candidates if os.path.exists(p)), None)

    if not client_secrets_file:
        logger.warning("Google OAuth attempt failed: Neither GOOGLE_CLIENT_ID env var nor client_secrets.json found.")
        raise HTTPException(
            status_code=400,
            detail="Google OAuth is not configured on the server. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env or add 'client_secrets.json' to the backend directory.",
        )

    try:
        with open(client_secrets_file, "r", encoding="utf-8") as f:
            secrets_data = json.load(f)
        key = "web" if "web" in secrets_data else "installed"
        client_id = secrets_data[key]["client_id"]
        client_secret = secrets_data[key].get("client_secret")
        return client_id, client_secret
    except Exception as e:
        logger.error(f"Failed to parse client_secrets.json: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to parse client_secrets.json: {e}")


def _get_redirect_uri(request: Request) -> str:
    """
    Determine the OAuth redirect URI.
    Checks GOOGLE_REDIRECT_URI env var first, then APP_URL, then request headers.
    """
    env_uri = os.getenv("GOOGLE_REDIRECT_URI")
    if env_uri:
        return env_uri

    if APP_URL:
        base = APP_URL.rstrip("/")
        return f"{base}/api/auth/google/callback"

    host = request.headers.get("host")
    scheme = "https" if request.url.scheme == "https" else "http"
    if host:
        return f"{scheme}://{host}/api/auth/google/callback"

    return f"{scheme}://localhost:5173/api/auth/google/callback"


@router.get("/login", summary="Initiate Google OAuth2 authentication flow")
async def google_login(request: Request):
    try:
        client_id, _ = _load_google_secrets()
    except HTTPException as exc:
        error_msg = urllib.parse.quote(str(exc.detail))
        return RedirectResponse(f"{APP_URL}/login?error={error_msg}")

    redirect_uri = _get_redirect_uri(request)
    logger.info(f"Initiating Google OAuth flow with redirect_uri: {redirect_uri}")

    scopes = [
        "openid",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
    ]

    state = _generate_oauth_state()
    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": " ".join(scopes),
        "access_type": "offline",
        "prompt": "select_account consent",
        "state": state,
    }

    auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urllib.parse.urlencode(params)}"
    response = RedirectResponse(auth_url)
    secure_cookie = request.url.scheme == "https"
    _set_oauth_state_cookie(response, state, secure_cookie)
    return response


@router.get("/callback", summary="Google OAuth2 authentication callback")
async def google_callback(request: Request):
    state = request.query_params.get("state")
    if not state:
        raise HTTPException(status_code=400, detail="Missing OAuth state parameter")

    cookie_state = _get_oauth_state(request)
    if not cookie_state:
        raise HTTPException(status_code=400, detail="Missing OAuth state cookie. Please retry login.")

    if not hmac.compare_digest(state, cookie_state):
        raise HTTPException(status_code=400, detail="Invalid OAuth state parameter")

    code = request.query_params.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")

    client_id, client_secret = _load_google_secrets()
    redirect_uri = _get_redirect_uri(request)

    token_payload = {
        "code": code,
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code",
    }

    try:
        token_resp = requests.post("https://oauth2.googleapis.com/token", data=token_payload)
        if token_resp.status_code != 200:
            raise HTTPException(status_code=400, detail=f"Google token exchange failed: {token_resp.text}")

        try:
            token_data = token_resp.json()
        except ValueError:
            logger.error("Google token response is not valid JSON: %s", token_resp.text)
            raise HTTPException(status_code=400, detail="Google token response invalid")

        if not isinstance(token_data, dict):
            logger.error("Google token response unexpected type: %r", token_data)
            raise HTTPException(status_code=400, detail="Google token response invalid")

        google_access_token = token_data.get("access_token")
        if not google_access_token:
            raise HTTPException(status_code=400, detail="Google response did not return an access token")

        resp = requests.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {google_access_token}"},
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch userinfo from Google")

        try:
            info = resp.json()
        except ValueError:
            logger.error("Google userinfo response is not valid JSON: %s", resp.text)
            raise HTTPException(status_code=400, detail="Google userinfo response invalid")

        if not isinstance(info, dict):
            logger.error("Google userinfo unexpected type: %r", info)
            raise HTTPException(status_code=400, detail="Google userinfo response invalid")

        email = info.get("email")
        google_id = info.get("sub")
        # Ensure `name` is always a non-empty string so it can be passed to
        # repository functions that expect `username: str`.
        raw_name = info.get("name")
        if isinstance(raw_name, str) and raw_name.strip():
            name = raw_name.strip()
        elif isinstance(email, str) and email:
            name = email.split("@")[0]
        else:
            name = f"user_{uuid.uuid4().hex[:8]}"
        # Use Google profile picture
        picture = info.get("picture") or ""

        # Final fallback if no picture
        if not picture:
            picture = "https://lh3.googleusercontent.com/a/default-user"

        if not email:
            raise HTTPException(status_code=400, detail="Google account did not return a valid email address")

        user = get_user_by_email(email)
        if not user:
            # Generate a clean unique username based on the Google display name / email prefix
            raw_base = name.strip() if (isinstance(name, str) and name.strip()) else email.split("@")[0]
            base_username = re.sub(r"[^\w.-]", "_", raw_base).strip("_") or "user"
            candidate_username = base_username

            # Check for existing username collisions in SQLite
            attempt = 0
            while get_user_by_username(candidate_username) is not None:
                attempt += 1
                candidate_username = f"{base_username}_{uuid.uuid4().hex[:4]}"
                if attempt > 10:
                    candidate_username = f"user_{uuid.uuid4().hex[:8]}"
                    break

            user_uuid = f"user_{uuid.uuid4().hex[:8]}"
            password_hash = get_password_hash(f"google_oauth_{uuid.uuid4().hex}")
            try:
                create_user_relational(
                    user_id=user_uuid,
                    username=candidate_username,
                    email=email,
                    password_hash=password_hash,
                    preferences="{}",
                )
            except Exception as insert_err:
                logger.warning("Username conflict for '%s' (%s), using random uuid username fallback", candidate_username, insert_err)
                fallback_username = f"user_{uuid.uuid4().hex[:8]}"
                create_user_relational(
                    user_id=user_uuid,
                    username=fallback_username,
                    email=email,
                    password_hash=password_hash,
                    preferences="{}",
                )

            # ensure the newly created user exists and is fetchable
            user = get_user_by_email(email)
            if not user:
                logger.error("Failed to create or fetch user after Google OAuth: %s", email)
                raise HTTPException(status_code=500, detail="Failed to create user account")
            # attach google/youtube fields
            try:
                update_user(user_uuid, {"google_id": google_id, "full_name": name, "avatar_url": picture, "google_access_token": google_access_token})
                user["avatar_url"] = picture
                user["full_name"] = name
            except Exception:
                logger.exception("Failed to update user with Google/YouTube profile info: %s", user_uuid)
        else:
            # make sure user is a mapping and has user_id
            if not isinstance(user, dict) or "user_id" not in user:
                logger.error("Unexpected user object returned for %s: %r", email, user)
                raise HTTPException(status_code=500, detail="Invalid user record returned from repository")

            updates = {"google_id": google_id, "full_name": name, "avatar_url": picture, "google_access_token": google_access_token}
            try:
                update_user(user["user_id"], updates)
                user["google_id"] = google_id
                user["full_name"] = name
                user["avatar_url"] = picture
            except Exception:
                logger.exception("Failed to update existing user with google/youtube info: %s", user.get("user_id"))

        access_token = create_access_token(data={"sub": user["user_id"]})

        # Set token in a secure HttpOnly cookie instead of exposing it in the URL.
        redirect_target = APP_URL or "/"
        resp = RedirectResponse(redirect_target)

        cookie_kwargs = {
            "key": "access_token",
            "value": access_token,
            "httponly": True,
            "max_age": 3600,
            "path": "/",
        }

        if APP_URL:
            parsed = urllib.parse.urlparse(APP_URL)
            host = parsed.hostname
            scheme = parsed.scheme
            if host and host not in ("localhost", "127.0.0.1"):
                cookie_kwargs["domain"] = host
                cookie_kwargs["secure"] = scheme == "https"
                cookie_kwargs["samesite"] = "none" if scheme == "https" else "lax"
            else:
                cookie_kwargs["secure"] = False
                cookie_kwargs["samesite"] = "lax"
        else:
            cookie_kwargs["secure"] = False
            cookie_kwargs["samesite"] = "lax"

        resp.set_cookie(**cookie_kwargs)
        _delete_oauth_state_cookie(resp)
        return resp
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Google Auth] Callback processing error: {e}")
        raise HTTPException(status_code=500, detail=f"Google Callback processing failed: {e}")


@router.get("/session", summary="Exchange the OAuth HttpOnly cookie for a JSON access token")
async def google_session(request: Request):
    """
    Called by the frontend immediately after the Google OAuth redirect lands.
    The browser automatically sends the HttpOnly 'access_token' cookie that
    the /callback endpoint set.  This endpoint validates it and returns the
    token + basic user profile in JSON so the frontend can store the token in
    localStorage and proceed as a normal authenticated session.
    """
    from services.auth.auth_service import AuthService
    from fastapi.responses import JSONResponse

    cookie_token = request.cookies.get("access_token")
    if not cookie_token:
        raise HTTPException(status_code=401, detail="No OAuth session cookie found. Please log in again.")

    auth_service = AuthService()
    user = auth_service.authenticate_token(cookie_token)
    if user is None:
        raise HTTPException(status_code=401, detail="OAuth session cookie is invalid or expired.")

    return JSONResponse({
        "success": True,
        "access_token": cookie_token,
        "token_type": "bearer",
        "user": {
            "user_id": user.get("user_id"),
            "email": user.get("email"),
            "full_name": user.get("full_name") or user.get("username"),
            "avatar_url": user.get("avatar_url"),
            "creator_role": user.get("creator_role", "creator"),
        },
    })

