"""
backend/app/api/dependencies/auth.py
─────────────────────────────────────────────────────────────────────────────
Authentication dependencies for FastAPI endpoints (current user, admin user).
─────────────────────────────────────────────────────────────────────────────
"""

import jwt
from typing import Optional
from fastapi import Request, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from core.security import SECRET_KEY, ALGORITHM
from repositories.user_repository import get_user_by_api_key, get_user_by_id

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token", auto_error=False)

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
            token = request.query_params.get("token")

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not token or not isinstance(token, str):
        raise credentials_exception

    # Authenticate via Developer API key if token starts with av_live_
    if token.startswith("av_live_"):
        user = get_user_by_api_key(token)
        if user is None:
            raise credentials_exception
        return user

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception

    user = get_user_by_id(user_id)
    if user is None:
        raise credentials_exception
    return user

async def get_admin_user(current_user: dict = Depends(get_current_user)):
    if current_user.get('creator_role') != 'admin':
        raise HTTPException(status_code=403, detail="Administrative privileges required.")
    return current_user
