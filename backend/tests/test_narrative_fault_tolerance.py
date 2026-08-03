"""
tests/test_narrative_fault_tolerance.py
─────────────────────────────────────────────────────────────────────────────
Integration test for the TTS voiceover generation fault tolerance in Phase 2.
Mocks Gemini and simulates a transient TTS network error for a middle panel,
verifying that the backend does not crash and returns the narrative texts successfully.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import sys
import json
import unittest
from unittest.mock import MagicMock, patch
from fastapi import FastAPI
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'app')))

from api.v1.ai.image import router as ai_image_router
from api.v1.ai.narration import router as ai_router
from api.v1.ai._deps import get_user_gemini_key
from api.dependencies.auth import get_current_user


class TestNarrativeFaultTolerance(unittest.TestCase):
    def setUp(self):
        self.app = FastAPI()
        self.app.include_router(ai_router)
        self.app.include_router(ai_image_router)

        mock_user = {
            "id": "test_user_123",
            "user_id": "test_user_123",
            "email": "test@test.local",
            "full_name": "Test User",
            "creator_role": "creator"
        }

        async def override_user():
            return mock_user

        def override_user_keys():
            return {"gemini": "test-gemini-key"}

        self.app.dependency_overrides[get_current_user] = override_user
        self.app.dependency_overrides[get_user_gemini_key] = override_user_keys

        self.client = TestClient(self.app)

    @patch("api.v1.ai.image.get_available_credits")
    @patch("api.v1.ai.image.record_credit_transaction")
    @patch("services.ai.facade.call_gemini_with_retry")
    @patch("services.ai.facade.generate_panel_audio")
    @patch("google.genai.Client")
    def test_tts_fault_tolerance_during_sequence_analysis(
        self,
        mock_client_class,
        mock_generate_audio,
        mock_gemini_retry,
        mock_record_credits,
        mock_get_credits
    ):
        mock_get_credits.return_value = 100

        mock_response = MagicMock()
        mock_response.text = json.dumps([
            "Scene 1 narrative description text.",
            "Scene 2 narrative description text.",
            "Scene 3 narrative description text (failed TTS audio).",
            "Scene 4 narrative description text.",
            "Scene 5 narrative description text."
        ])
        mock_gemini_retry.return_value = mock_response

        async def side_effect_generate_audio(dialogue_list, target_duration, output_path, voice, force_duration):
            text = dialogue_list[0] if dialogue_list else ""
            if "failed TTS audio" in text:
                raise RuntimeError("Simulated transient Edge-TTS network/timeout exception!")
            with open(output_path, "wb") as f:
                f.write(b"dummy MP3 audio bytes")
            return output_path, 3.5

        mock_generate_audio.side_effect = side_effect_generate_audio

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

        response = self.client.post("/analyze-sequence", json=payload)
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertTrue(data.get("success", False))
        results = data.get("results") or data.get("narratives") or []
        self.assertEqual(len(results), 5)

    @patch("api.v1.ai.image.get_available_credits")
    @patch("api.v1.ai.image.record_credit_transaction")
    @patch("services.ai.skills.base.call_gemini_with_retry")
    @patch("services.ai.facade.generate_panel_audio")
    @patch("services.image.ocr.extract_dialogue_from_panel")
    @patch("services.image.utils.image_utils.compute_brightness")
    @patch("services.image.utils.image_utils.resolve_image_to_buffer")
    @patch("google.genai.Client")
    def test_image_analyze_sequence_returns_parallel_results(
        self,
        mock_client_class,
        mock_resolve_buffer,
        mock_compute_brightness,
        mock_extract_dialogue,
        mock_generate_audio,
        mock_gemini_retry,
        mock_record_credits,
        mock_get_credits
    ):
        mock_get_credits.return_value = 100
        mock_resolve_buffer.return_value = {"data": b"fake-image-bytes"}
        mock_compute_brightness.return_value = 120
        mock_extract_dialogue.return_value = ["Panel dialogue text."]

        mock_response = MagicMock()
        mock_response.text = json.dumps({
            "speech_text": "Test narration.",
            "sfx": "",
            "visual_description": "A test panel.",
            "motion_type": "zoom_in",
            "duration": 5
        })
        mock_gemini_retry.return_value = mock_response

        async def side_effect_generate_audio(dialogue_list, target_duration, output_path, voice, force_duration):
            with open(output_path, "wb") as f:
                f.write(b"dummy mp3")
            return output_path, float(target_duration or 5)

        mock_generate_audio.side_effect = side_effect_generate_audio

        payload = {
            "urls": [
                "http://example.com/panel1.png",
                "http://example.com/panel2.png",
                "http://example.com/panel3.png"
            ],
            "model": "gemini-2.5-flash",
            "voice": "en-US-GuyNeural"
        }

        response = self.client.post("/analyze-sequence", json=payload)
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertTrue(data.get("success", False))
        results = data.get("results", [])
        self.assertEqual(len(results), 3)
        self.assertTrue(all(item.get("success", False) for item in results))
        self.assertEqual(mock_record_credits.call_count, 1)


if __name__ == "__main__":
    unittest.main()
