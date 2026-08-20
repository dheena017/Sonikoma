"""
backend/tests/test_google_oauth_session.py
─────────────────────────────────────────────────────────────────────────────
Integration test suite for /api/v1/auth/google/session OAuth cookie exchange.
Validates:
1. Valid OAuth HttpOnly cookie -> 200, returns access_token + user profile
2. Missing cookie -> 401
3. Invalid / expired cookie -> 401
4. Standard Bearer authentication on /api/v1/auth/me still works
5. AI task-to-model routing endpoint /api/v1/ai/models/routing works with Bearer token
6. Full app middleware dispatch ensures no spurious Bearer intercept on /session
─────────────────────────────────────────────────────────────────────────────
"""

import os
import sys
import uuid
import unittest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'app')))

from app.main import app
from app.core.security import create_access_token
from repositories.user import create_user_relational, delete_user


class TestGoogleOAuthSessionFlow(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.uid_hex = uuid.uuid4().hex[:8]
        cls.user_id = f"test_oauth_user_{cls.uid_hex}"
        cls.email = f"oauth_user_{cls.uid_hex}@example.com"
        cls.username = f"oauth_user_{cls.uid_hex}"
        cls.password_hash = "fake_hash_123"

        # Create user in relational db
        create_user_relational(
            user_id=cls.user_id,
            username=cls.username,
            email=cls.email,
            password_hash=cls.password_hash,
            preferences="{}",
        )
        cls.valid_token = create_access_token(data={"sub": cls.user_id})

    @classmethod
    def tearDownClass(cls):
        try:
            delete_user(cls.user_id)
        except Exception:
            pass

    def test_session_with_valid_oauth_cookie_returns_200(self):
        """
        Cookie exchange:
        Browser sends HttpOnly access_token cookie -> returns 200 with JSON token and user profile.
        """
        response = self.client.get(
            "/api/v1/auth/google/session",
            cookies={"access_token": self.valid_token},
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get("success"))
        self.assertEqual(data.get("access_token"), self.valid_token)
        self.assertEqual(data.get("token_type"), "bearer")
        self.assertIn("user", data)
        self.assertEqual(data["user"]["user_id"], self.user_id)
        self.assertEqual(data["user"]["email"], self.email)

    def test_session_missing_cookie_returns_401(self):
        """
        Missing cookie -> returns 401 with descriptive error message.
        """
        response = self.client.get("/api/v1/auth/google/session")
        self.assertEqual(response.status_code, 401)
        data = response.json()
        self.assertIn("detail", data)

    def test_session_invalid_cookie_returns_401(self):
        """
        Invalid or corrupt cookie -> returns 401.
        """
        response = self.client.get(
            "/api/v1/auth/google/session",
            cookies={"access_token": "invalid.jwt.token"},
        )
        self.assertEqual(response.status_code, 401)
        data = response.json()
        self.assertIn("detail", data)

    def test_auth_me_bearer_authentication_still_works(self):
        """
        Verify standard Bearer auth on /api/v1/auth/me works.
        """
        # With valid Bearer header -> 200
        response = self.client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {self.valid_token}"},
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["user_id"], self.user_id)
        self.assertEqual(data["email"], self.email)

        # Without Bearer header -> 401
        unauth_response = self.client.get("/api/v1/auth/me")
        self.assertEqual(unauth_response.status_code, 401)

    def test_ai_models_routing_works_with_bearer_token(self):
        """
        Verify /api/v1/ai/models/routing works when called with Bearer authentication.
        """
        response = self.client.get(
            "/api/v1/ai/models/routing",
            headers={"Authorization": f"Bearer {self.valid_token}"},
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get("success"))
        self.assertIn("routing", data)


if __name__ == "__main__":
    unittest.main()
