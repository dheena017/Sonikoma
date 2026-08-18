"""
backend/app/api/dependencies/auth.py
─────────────────────────────────────────────────────────────────────────────
Authentication dependencies for FastAPI endpoints (current user, admin user).
─────────────────────────────────────────────────────────────────────────────
"""

import os
import re
from typing import Optional
from fastapi import Request, Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer

from services.auth.auth_service import AuthService

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token", auto_error=False)
auth_service = AuthService()

async def get_current_user(request: Request, token: Optional[str] = Depends(oauth2_scheme)):
    # If called manually in middleware, token will be the Depends object.
    # We must extract the actual token string.
    if not token or not isinstance(token, str):
        auth_header = request.headers.get("Authorization")
        if auth_header:
            scheme, _, param = auth_header.partition(" ")
            if scheme.lower() == "bearer":
                token = param
            else:
                token = auth_header
        else:
            token = request.cookies.get("access_token") or request.query_params.get("token")

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not token or not isinstance(token, str):
        raise credentials_exception

    user = auth_service.authenticate_token(token)
    if user is None:
        raise credentials_exception
    return user

async def get_optional_current_user(request: Request, token: Optional[str] = Depends(oauth2_scheme)) -> Optional[dict]:
    """Extract user if valid token is present, otherwise return None without throwing 401."""
    try:
        if not token or not isinstance(token, str):
            auth_header = request.headers.get("Authorization")
            if auth_header:
                scheme, _, param = auth_header.partition(" ")
                if scheme.lower() == "bearer":
                    token = param.strip()
                else:
                    token = auth_header.strip()
            else:
                token = request.cookies.get("access_token") or request.query_params.get("token")

        if not token or not isinstance(token, str) or token.strip() in ("", "null", "undefined"):
            return None

        return auth_service.authenticate_token(token)
    except Exception:
        return None

async def get_admin_user(current_user: dict = Depends(get_current_user)):
    if current_user.get('creator_role') != 'admin':
        raise HTTPException(status_code=403, detail="Administrative privileges required.")
    return current_user


def clean_api_key(key: Optional[str]) -> Optional[str]:
    """Sanitize an API key string, returning None for empty/invalid values."""
    if not key:
        return None
    val = key.strip()
    val = re.sub(r'^[\s\'"()\[\]{}]+|[\s\'"()\[\]{}]+$', '', val)
    if val in ("", "null", "undefined", "None"):
        return None
    return val


def get_all_user_keys(
    request: Request,
    x_user_gemini_key: str = Header(None, alias="X-User-Gemini-Key"),
    x_user_openai_key: str = Header(None, alias="X-User-OpenAI-Key"),
    x_user_anthropic_key: str = Header(None, alias="X-User-Anthropic-Key"),
    x_user_huggingface_key: str = Header(None, alias="X-User-HuggingFace-Key"),
    x_user_elevenlabs_key: str = Header(None, alias="X-User-Elevenlabs-Key"),
    x_user_deepl_key: str = Header(None, alias="X-User-Deepl-Key"),
    x_user_deepseek_key: str = Header(None, alias="X-User-Deepseek-Key"),
):
    """Extract and sanitize all user-provided API keys from headers (website page), user DB preferences, or server .env vars."""
    import json
    user_db_keys = {}
    try:
        auth_header = request.headers.get("Authorization")
        if auth_header:
            token = auth_header.partition(" ")[2] if auth_header.lower().startswith("bearer ") else auth_header
            user = auth_service.authenticate_token(token)
            if user and user.get("preferences"):
                prefs = json.loads(user["preferences"])
                user_db_keys = prefs.get("api_keys", {})
    except Exception:
        pass

    return {
        "gemini": clean_api_key(x_user_gemini_key) or clean_api_key(user_db_keys.get("gemini")) or clean_api_key(os.getenv("GEMINI_API_KEY")),
        "openai": clean_api_key(x_user_openai_key) or clean_api_key(user_db_keys.get("openai")) or clean_api_key(os.getenv("OPENAI_API_KEY")),
        "anthropic": clean_api_key(x_user_anthropic_key) or clean_api_key(user_db_keys.get("anthropic")) or clean_api_key(os.getenv("ANTHROPIC_API_KEY")),
        "huggingface": clean_api_key(x_user_huggingface_key) or clean_api_key(user_db_keys.get("huggingface")) or clean_api_key(os.getenv("HUGGINGFACE_API_KEY")),
        "elevenlabs": clean_api_key(x_user_elevenlabs_key) or clean_api_key(user_db_keys.get("elevenlabs")) or clean_api_key(os.getenv("ELEVENLABS_API_KEY")),
        "deepl": clean_api_key(x_user_deepl_key) or clean_api_key(user_db_keys.get("deepl")) or clean_api_key(os.getenv("DEEPL_API_KEY")),
        "deepseek": clean_api_key(x_user_deepseek_key) or clean_api_key(user_db_keys.get("deepseek")) or clean_api_key(os.getenv("DEEPSEEK_API_KEY")),
        "replicate": clean_api_key(user_db_keys.get("replicate")) or clean_api_key(os.getenv("REPLICATE_API_TOKEN")),
    }

