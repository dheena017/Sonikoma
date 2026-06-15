"""
backend/python/routes/auth_routes.py
─────────────────────────────────────────────────────────────────────────────
Authentication routes for User Registration, Login, and Google Auth.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import uuid
import logging
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
import bcrypt
import jwt
from database.db import create_user, get_user_by_email, get_user_by_id, update_user

logger = logging.getLogger("anivox.auth")

router = APIRouter()

# ─── Configuration ────────────────────────────────────────────────────────────

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "anivox_super_secret_key_change_me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 1 week

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# ─── Models ───────────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str



class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

# ─── Helpers ──────────────────────────────────────────────────────────────────

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        password_bytes = plain_password.encode('utf-8')[:72]
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception as e:
        logger.error(f"[Auth] Password verification failed: {e}")
        return False

def get_password_hash(password: str) -> str:
    password_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
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

# ─── Routes ───────────────────────────────────────────────────────────────────

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister):
    existing_user = get_user_by_email(user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    user_id = f"user_{uuid.uuid4().hex[:8]}"
    hashed_password = get_password_hash(user_data.password)

    new_user = {
        "user_id": user_id,
        "email": user_data.email,
        "hashed_password": hashed_password,
        "full_name": user_data.full_name,
        "avatar_url": f"https://api.dicebear.com/7.x/avataaars/svg?seed={user_id}"
    }

    try:
        create_user(new_user)
        logger.info(f"[Auth] Registered new user: {user_data.email}")

        # Return token immediately after registration
        access_token = create_access_token(data={"sub": user_id})
        user_info = {
            "user_id": user_id,
            "email": user_data.email,
            "full_name": user_data.full_name,
            "avatar_url": new_user["avatar_url"]
        }
        return {"access_token": access_token, "token_type": "bearer", "user": user_info}
    except Exception as e:
        logger.error(f"[Auth] Error creating user: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/login")
async def login(user_data: UserLogin):
    user = get_user_by_email(user_data.email)
    if not user or not user["hashed_password"] or not verify_password(user_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user["user_id"]})
    user_info = {
        "user_id": user["user_id"],
        "email": user["email"],
        "full_name": user["full_name"],
        "avatar_url": user["avatar_url"]
    }
    return {"access_token": access_token, "token_type": "bearer", "user": user_info}



@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    user = get_user_by_email(request.email)
    if not user:
        # Don't reveal if user exists or not for security
        return {"message": "If an account exists for this email, you will receive a reset link shortly."}

    # In a real app, generate a reset token and send an email
    logger.info(f"[Auth] Forgot password request for {request.email}. Reset link would be sent.")

    return {"message": "If an account exists for this email, you will receive a reset link shortly."}

@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "user_id": current_user["user_id"],
        "email": current_user["email"],
        "full_name": current_user["full_name"],
        "avatar_url": current_user["avatar_url"]
    }
