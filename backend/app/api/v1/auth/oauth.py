"""
backend/app/api/v1/auth/oauth.py
─────────────────────────────────────────────────────────────────────────────
Google OAuth2 authentication routes.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import uuid
import json
import logging
import urllib.parse
import requests
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse

from config.ports import APP_URL
from core.security import get_password_hash, create_access_token
from repositories.user_repository import (
    get_user_by_email,
    create_user_relational,
    update_user,
)

logger = logging.getLogger("sonikoma.auth.oauth")
router = APIRouter()


def _load_google_secrets() -> tuple[str, str | None]:
    """
    Locate and parse client_secrets.json. Returns (client_id, client_secret).
    client_secret may be None when only client_id is needed (login initiation).
    Raises HTTPException(400) if the file is missing or unparseable.
    """
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
        raise HTTPException(
            status_code=400,
            detail="Google login is not configured on the server. Please add 'client_secrets.json' to the project root.",
        )

    try:
        with open(client_secrets_file, "r", encoding="utf-8") as f:
            secrets_data = json.load(f)
        key = "web" if "web" in secrets_data else "installed"
        client_id = secrets_data[key]["client_id"]
        client_secret = secrets_data[key].get("client_secret")
        return client_id, client_secret
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse client_secrets.json: {e}")


@router.get("/login", summary="Initiate Google OAuth2 authentication flow")
async def google_login(request: Request):
    client_id, _ = _load_google_secrets()

    host = request.headers.get("host", "localhost:8000")
    scheme = "https" if request.url.scheme == "https" else "http"
    redirect_uri = f"{scheme}://{host}/api/auth/google/callback"

    scopes = [
        "openid",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/youtube.upload",
    ]

    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": " ".join(scopes),
        "access_type": "offline",
        "prompt": "consent",
    }

    auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urllib.parse.urlencode(params)}"
    return RedirectResponse(auth_url)


@router.get("/callback", summary="Google OAuth2 authentication callback")
async def google_callback(request: Request):
    code = request.query_params.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")

    client_id, client_secret = _load_google_secrets()

    host = request.headers.get("host", "localhost:8000")
    scheme = "https" if request.url.scheme == "https" else "http"
    redirect_uri = f"{scheme}://{host}/api/auth/google/callback"

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

        token_data = token_resp.json()
        google_access_token = token_data.get("access_token")
        if not google_access_token:
            raise HTTPException(status_code=400, detail="Google response did not return an access token")

        resp = requests.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {google_access_token}"},
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch userinfo from Google")

        info = resp.json()
        email = info.get("email")
        google_id = info.get("sub")
        name = info.get("name") or email.split("@")[0]
        picture = info.get("picture") or f"https://api.dicebear.com/7.x/avataaars/svg?seed={google_id}"

        if not email:
            raise HTTPException(status_code=400, detail="Google account did not return a valid email address")

        user = get_user_by_email(email)
        if not user:
            user_uuid = f"user_{uuid.uuid4().hex[:8]}"
            password_hash = get_password_hash(f"google_oauth_{uuid.uuid4().hex}")
            create_user_relational(
                user_id=user_uuid,
                username=name,
                email=email,
                password_hash=password_hash,
                preferences="{}",
            )
            update_user(user_uuid, {"google_id": google_id, "full_name": name, "avatar_url": picture})
            user = get_user_by_email(email)
        elif not user.get("google_id"):
            update_user(user["user_id"], {"google_id": google_id})
            user["google_id"] = google_id

        access_token = create_access_token(data={"sub": user["user_id"]})
        return RedirectResponse(f"{APP_URL}/?token={access_token}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Google Auth] Callback processing error: {e}")
        raise HTTPException(status_code=500, detail=f"Google Callback processing failed: {e}")
