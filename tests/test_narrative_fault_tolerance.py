"""
tests/test_narrative_fault_tolerance.py
─────────────────────────────────────────────────────────────────────────────
Integration test for the TTS voiceover generation fault tolerance in Phase 2.
Mocks Gemini and simulates a transient TTS network error for a middle panel,
verifying that the backend does not crash and returns the narrative texts successfully.
"""

import os
import sys
import json
import unittest
from unittest.mock import MagicMock, AsyncMock, patch
from fastapi import FastAPI
from fastapi.testclient import TestClient

# Add backend/app to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend', 'app')))

from routes.ai_routes import router as ai_router
from routes.auth_routes import get_current_user

class TestNarrativeFaultTolerance(unittest.TestCase):
    def setUp(self):
        self.app = FastAPI()
        self.app.include_router(ai_router)

        # FastAPI dependency override to bypass OAuth/Auth middleware for unit testing
        self.app.dependency_overrides[get_current_user] = lambda: {
            "user_id": "test_user_123",
            "email": "test@test.local",
            "full_name": "Test User",
            "creator_role": "creator"
        }
        self.client = TestClient(self.app)

    @patch("routes.ai_routes.get_available_credits")
    @patch("routes.ai_routes.record_credit_transaction")
    @patch("routes.ai_routes.call_gemini_with_retry")
    @patch("routes.ai_routes.generate_panel_audio")
    @patch("google.genai.Client")
    def test_tts_fault_tolerance_during_sequence_analysis(
        self,
        mock_client_class,
        mock_generate_audio,
        mock_gemini_retry,
        mock_record_credits,
        mock_get_credits
    ):
        # 1. Mock credits check
        mock_get_credits.return_value = 100

        # 2. Mock Gemini to return narrative JSON array of strings
        mock_response = MagicMock()
        mock_response.text = json.dumps([
            "Scene 1 narrative description text.",
            "Scene 2 narrative description text.",
            "Scene 3 narrative description text (failed TTS audio).",
            "Scene 4 narrative description text.",
            "Scene 5 narrative description text."
        ])
        mock_gemini_retry.return_value = mock_response

        # 3. Mock generate_panel_audio to throw exception specifically for panel index 2 (middle panel)
        async def side_effect_generate_audio(dialogue_list, target_duration, output_path, voice, force_duration):
            text = dialogue_list[0] if dialogue_list else ""
            if "failed TTS audio" in text:
                raise RuntimeError("Simulated transient Edge-TTS network/timeout exception!")
            # Actually write dummy bytes to output_path so the file exists and is non-empty!
            with open(output_path, "wb") as f:
                f.write(b"dummy MP3 audio bytes")
            return output_path, 3.5

        mock_generate_audio.side_effect = side_effect_generate_audio

        # 4. Trigger the /api/narratives/analyze-sequence request
        headers = {
            "X-User-Gemini-Key": "mock-gemini-key"
        }
        payload = {
            "visual_descriptions": [
                "A warrior looking over a dark hill.",
                "A bright star falling from the sky.",
                "An explosion of magical light.",
                "The warrior shielding his face.",
                "Smoke clearing and revealing a crater."
            ],
            "model": "gemini-2.5-flash",
            "voice": "en-US-GuyNeural"
        }

        response = self.client.post("/narratives/analyze-sequence", json=payload, headers=headers)

        # 5. Assertions
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(len(data["results"]), 5)

        # Assert texts were returned correctly
        self.assertEqual(data["results"][0]["narrative"], "Scene 1 narrative description text.")
        self.assertEqual(data["results"][2]["narrative"], "Scene 3 narrative description text (failed TTS audio).")

        # Assert successful panels have narrative audio cached URLs
        self.assertIsNotNone(data["results"][0]["narrative_audio_url"])
        self.assertTrue(data["results"][0]["narrative_audio_url"].startswith("/api/image/cached/"))

        # Assert failed panel leaves audio URL as null and does not crash the entire request
        null_count = sum(1 for r in data["results"] if r["narrative_audio_url"] is None)
        self.assertEqual(null_count, 1)
        self.assertIsNone(data["results"][2]["narrative_audio_url"])

if __name__ == "__main__":
    unittest.main()
