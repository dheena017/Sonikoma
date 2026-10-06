"""
backend/tests/conftest.py
─────────────────────────────────────────────────────────────────────────────
Shared pytest fixtures and test setup for Sonikoma API Test Suite.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import sys
import pytest

# Ensure testing environment flags are active before app modules load
os.environ["TESTING"] = "1"
os.environ["SKIP_MODEL_PREWARM"] = "1"
os.environ["LOG_LEVEL"] = "WARNING"

# Add backend and backend/app to path if not already present
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
APP_DIR = os.path.join(BACKEND_DIR, "app")
PROJECT_ROOT = os.path.abspath(os.path.join(BACKEND_DIR, ".."))

for path in [BACKEND_DIR, APP_DIR, PROJECT_ROOT]:
    if path not in sys.path:
        sys.path.insert(0, path)

from fastapi.testclient import TestClient
from main import app
from app.core.security import create_access_token
from database.bootstrap import init_db
from features.auth.service import auth_service


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """Ensure database schema is bootstrapped before running tests."""
    init_db()


@pytest.fixture(scope="session")
def client():
    """Session-scoped TestClient instance."""
    with TestClient(app, base_url="http://testserver") as test_client:
        yield test_client


@pytest.fixture(scope="session")
def admin_token():
    """Generates a valid JWT token with admin privileges."""
    return create_access_token({"sub": "admin", "creator_role": "admin"})


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    """Authorization headers for admin requests."""
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="session")
def user_token():
    """Generates a valid JWT token for a standard creator user (dev fallback)."""
    return create_access_token({"sub": "usr_dev_creator", "creator_role": "creator"})


@pytest.fixture(scope="session")
def user_headers(user_token):
    """Authorization headers for standard user requests."""
    return {"Authorization": f"Bearer {user_token}"}


@pytest.fixture(scope="session")
def non_admin_headers():
    """Authorization headers for a user guaranteed to have creator role (not admin)."""
    email = "standard_creator_test@sonikoma.ai"
    try:
        reg_res = auth_service.register_user(
            email=email,
            password="TestPassword123!",
            full_name="Standard Creator",
        )
        token = reg_res.get("token") or reg_res.get("access_token")
    except Exception:
        from features.auth.repositories import get_user_by_email
        existing = get_user_by_email(email)
        user_id = existing["user_id"] if existing else "usr_test_regular"
        token = create_access_token({"sub": user_id, "creator_role": "creator"})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="session")
def sample_image_base64():
    """A minimal 1x1 transparent PNG base64 string for image endpoint tests."""
    return (
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8"
        "AAAAASUVORK5CYII="
    )
