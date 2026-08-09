"""
backend/tests/test_oauth_state.py
─────────────────────────────────────────────────────────────────────────────
Regression tests for Google OAuth state handling.
"""

import os
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'app')))

from fastapi import FastAPI
from fastapi.testclient import TestClient
from api.v1.auth.oauth import router as oauth_router


class TestGoogleOAuthState(unittest.TestCase):
    def setUp(self):
        self.app = FastAPI()
        self.app.include_router(oauth_router, prefix="/api/auth/google")
        self.client = TestClient(self.app)

    @patch("api.v1.auth.oauth._load_google_secrets")
    def test_login_sets_state_cookie(self, mock_load_secrets):
        mock_load_secrets.return_value = ("test-client-id", "test-client-secret")

        response = self.client.get("/api/auth/google/login", allow_redirects=False)
        self.assertEqual(response.status_code, 307)
        self.assertIn("google_oauth_state", response.cookies)
        self.assertIsNotNone(response.cookies.get("google_oauth_state"))

    @patch("api.v1.auth.oauth._load_google_secrets")
    def test_callback_missing_state(self, mock_load_secrets):
        mock_load_secrets.return_value = ("test-client-id", "test-client-secret")

        response = self.client.get("/api/auth/google/callback?code=test-code")
        self.assertEqual(response.status_code, 400)
        self.assertIn("Missing OAuth state parameter", response.text)

    @patch("api.v1.auth.oauth._load_google_secrets")
    def test_callback_invalid_state(self, mock_load_secrets):
        mock_load_secrets.return_value = ("test-client-id", "test-client-secret")

        login_response = self.client.get("/api/auth/google/login", allow_redirects=False)
        self.assertEqual(login_response.status_code, 307)
        auth_state = login_response.cookies.get("google_oauth_state")
        self.assertIsNotNone(auth_state)

        invalid_state = auth_state + "x"
        callback_response = self.client.get(
            f"/api/auth/google/callback?code=test-code&state={invalid_state}",
            cookies={"google_oauth_state": auth_state},
        )
        self.assertEqual(callback_response.status_code, 400)
        self.assertIn("Invalid OAuth state parameter", callback_response.text)


if __name__ == "__main__":
    unittest.main()
