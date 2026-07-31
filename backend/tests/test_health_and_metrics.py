"""
backend/tests/test_health_and_metrics.py
─────────────────────────────────────────────────────────────────────────────
Integration test suite for Health, System Status, and Diagnostic Metrics API.
Tests:
- GET /api/health (Capability probes, uptime, python/platform info)
- GET /api/health/ffmpeg (FFmpeg binary status verification)
- POST /api/metrics/purge-cache (LRU memory cache clearing)
─────────────────────────────────────────────────────────────────────────────
"""

import os
import sys
import unittest
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'app')))

from fastapi import FastAPI
from fastapi.testclient import TestClient
from api.v1.health import router as health_router


class TestHealthAndMetricsAPI(unittest.TestCase):
    def setUp(self):
        self.app = FastAPI()
        self.app.include_router(health_router, prefix="/api")
        self.client = TestClient(self.app)

    def test_health_check_endpoint(self):
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["status"], "ok")
        self.assertIn("capabilities", data)
        self.assertIn("cv2", data["capabilities"])
        self.assertIn("PIL", data["capabilities"])
        self.assertIn("numpy", data["capabilities"])
        self.assertIn("uptimeSeconds", data)

    @patch("subprocess.run")
    def test_health_ffmpeg_success(self, mock_run):
        mock_result = MagicMock()
        mock_result.returncode = 0
        mock_result.stdout = "ffmpeg version 6.0-full_build Copyright (c) 2000-2023"
        mock_run.return_value = mock_result

        response = self.client.get("/api/health/ffmpeg")
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["status"], "ok")
        self.assertIn("ffmpeg version 6.0", data["version"])

    @patch("subprocess.run")
    def test_health_ffmpeg_missing(self, mock_run):
        mock_run.side_effect = FileNotFoundError()

        response = self.client.get("/api/health/ffmpeg")
        self.assertEqual(response.status_code, 503)

        data = response.json()
        self.assertIn("FFmpeg is not accessible", data["detail"])

    def test_purge_cache_endpoint(self):
        response = self.client.post("/api/metrics/purge-cache")
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("cleared successfully", data["message"])


if __name__ == "__main__":
    unittest.main()
