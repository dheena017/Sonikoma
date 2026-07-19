import re

with open("backend/app/api/v1/auth/login.py", "r") as f:
    content = f.read()

merge_diff = """
<<<<<<< SEARCH
from core.security import verify_password, create_access_token
from repositories.user import get_user_by_email, create_user_session, write_audit_log
from schemas.auth import UserLogin
=======
from core.security import verify_password, create_access_token, get_password_hash
from repositories.user import get_user_by_email, create_user_session, write_audit_log, create_user
from schemas.auth import UserLogin
from backend.startup import IS_PRODUCTION
>>>>>>> REPLACE
<<<<<<< SEARCH
@router.post("/login")
async def login(user_data: UserLogin, request: Request):
    user = get_user_by_email(user_data.email)
    ip_addr = request.client.host if request.client else "127.0.0.1"

    if not user or not user["hashed_password"] or not verify_password(user_data.password, user["hashed_password"]):
=======
@router.post("/login")
async def login(user_data: UserLogin, request: Request):
    ip_addr = request.client.host if request.client else "127.0.0.1"

    # Development convenience: Auto-create dev user if it doesn't exist
    if not IS_PRODUCTION and user_data.email == "creator@sonikoma.com":
        existing_dev = get_user_by_email(user_data.email)
        if not existing_dev:
            # Create dev account
            from schemas.user import UserCreate
            try:
                # We might need to mock a proper user creation
                dev_user = UserCreate(
                    username="creator",
                    email="creator@sonikoma.com",
                    password="password123",
                    full_name="Dev Creator"
                )
                create_user(dev_user)
                logger.info("Automatically created development user creator@sonikoma.com")
            except Exception as e:
                logger.warning(f"Failed to auto-create dev user: {e}")

    user = get_user_by_email(user_data.email)

    if not user or not user.get("hashed_password") or not verify_password(user_data.password, user["hashed_password"]):
>>>>>>> REPLACE
"""

print(merge_diff)
