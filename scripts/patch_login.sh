#!/bin/bash
patch backend/app/api/v1/auth/login.py << 'PATCH_EOF'
--- backend/app/api/v1/auth/login.py
+++ backend/app/api/v1/auth/login.py
@@ -10,9 +10,10 @@
 from fastapi import APIRouter, Depends, HTTPException, status, Request
 from fastapi.security import OAuth2PasswordRequestForm

-from core.security import verify_password, create_access_token
-from repositories.user import get_user_by_email, create_user_session, write_audit_log
+from core.security import verify_password, create_access_token, get_password_hash
+from repositories.user import get_user_by_email, create_user_session, write_audit_log, create_user
 from schemas.auth import UserLogin
+from backend.startup import IS_PRODUCTION

 logger = logging.getLogger("sonikoma.auth.login")
 router = APIRouter()
@@ -40,11 +41,27 @@

 @router.post("/login")
 async def login(user_data: UserLogin, request: Request):
-    user = get_user_by_email(user_data.email)
     ip_addr = request.client.host if request.client else "127.0.0.1"

-    if not user or not user["hashed_password"] or not verify_password(user_data.password, user["hashed_password"]):
-        if user:
+    if not IS_PRODUCTION and user_data.email == "creator@sonikoma.com":
+        existing_dev = get_user_by_email(user_data.email)
+        if not existing_dev:
+            try:
+                dev_user = {
+                    "id": f"user_dev_{uuid.uuid4().hex[:8]}",
+                    "username": "creator",
+                    "email": "creator@sonikoma.com",
+                    "password_hash": get_password_hash("password123"),
+                    "full_name": "Dev Creator",
+                    "creator_role": "creator"
+                }
+                create_user(dev_user)
+                logger.info("Automatically created development user creator@sonikoma.com")
+            except Exception as e:
+                logger.warning(f"Failed to auto-create dev user: {e}")
+
+    user = get_user_by_email(user_data.email)
+    if not user or not user.get("hashed_password") or not verify_password(user_data.password, user["hashed_password"]):
+        if user:
             write_audit_log(user["user_id"], "Failed login attempt", ip_addr, "Failed")
         raise HTTPException(
PATCH_EOF
