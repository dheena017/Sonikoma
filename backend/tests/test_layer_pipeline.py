import sys
import os
import unittest
import asyncio
import wave
import shutil
import cv2
import numpy as np
from unittest.mock import patch, MagicMock, AsyncMock

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'app')))

try:
    from services.image.layer_segmentation import process_layers
    from services.audio.dialogue_aligner_impl import align_dialogue_and_extract_peaks
    from services.video.video_service import _render_panel_segment_ffmpeg
except ImportError:
    from app.services.image.layer_segmentation import process_layers
    from app.services.audio.dialogue_aligner_impl import align_dialogue_and_extract_peaks
    from app.services.video.video_service import _render_panel_segment_ffmpeg


class TestLayerPipelineIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Store all test data inside project data/temp directory
        cls.data_temp_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'temp'))
        cls.temp_dir = os.path.join(cls.data_temp_dir, 'test_layer_assets')
        os.makedirs(cls.temp_dir, exist_ok=True)

        # Generate dummy original panel image
        cls.dummy_img_path = os.path.join(cls.temp_dir, 'dummy_panel.png')
        img = np.zeros((300, 300, 3), dtype=np.uint8)
        img[:, :] = [0, 0, 255] # Red Background
        cv2.circle(img, (150, 150), 50, (255, 0, 0), -1) # Blue Character Circle
        cv2.rectangle(img, (50, 30), (250, 80), (255, 255, 255), -1) # White Dialogue Box
        cv2.imwrite(cls.dummy_img_path, img)

        # Generate dummy WAV audio
        cls.dummy_wav_path = os.path.join(cls.temp_dir, 'dummy_audio.wav')
        with wave.open(cls.dummy_wav_path, 'wb') as wav_file:
            wav_file.setnchannels(1) # Mono
            wav_file.setsampwidth(2) # 16-bit
            wav_file.setframerate(22050)
            audio_data = (np.sin(2 * np.pi * 440 * np.linspace(0, 3, 22050 * 3)) * 32767).astype(np.int16)
            wav_file.writeframes(audio_data.tobytes())

        cls.output_mp4_path = os.path.join(cls.temp_dir, 'output_panel.mp4')

    @classmethod
    def tearDownClass(cls):
        # Clean up temporary test data in data/temp
        if os.path.exists(cls.temp_dir):
            shutil.rmtree(cls.temp_dir, ignore_errors=True)

    @patch.dict(os.environ, {"ENVIRONMENT": "production"})
    @patch('services.image.layer_segmentation.upload_to_supabase_bucket')
    @patch('services.audio.transcription_impl.extract_words_with_timestamps')
    @patch('services.audio.dialogue_aligner_impl.get_whisper_engine')
    @patch('subprocess.run')
    def test_complete_backend_pipeline(self, mock_subprocess_run, mock_get_whisper, mock_extract_words, mock_upload_to_supabase):
        mock_whisper_engine = MagicMock()
        mock_whisper_engine.extract_words_with_timestamps = AsyncMock(return_value=[
            {"id": 0, "text": "hello", "start_time": 0.2, "end_time": 0.6, "confidence": 0.9, "segment_id": 0},
            {"id": 1, "text": "world", "start_time": 0.6, "end_time": 1.2, "confidence": 0.9, "segment_id": 0}
        ])
        mock_get_whisper.return_value = mock_whisper_engine
        layer_paths = {}

        def mock_upload(file_bytes, bucket, path_in_bucket, content_type):
            layer_name = path_in_bucket.split('/')[-1]
            local_path = os.path.join(self.temp_dir, f"mocked_{layer_name}")
            with open(local_path, 'wb') as f:
                f.write(file_bytes)
            layer_paths[layer_name] = local_path
            return f"file://{local_path}"

        mock_upload_to_supabase.side_effect = mock_upload

        mock_extract_words.return_value = [
            {"id": 0, "text": "hello", "start_time": 0.2, "end_time": 0.6, "confidence": 0.9, "segment_id": 0},
            {"id": 1, "text": "world", "start_time": 0.6, "end_time": 1.2, "confidence": 0.9, "segment_id": 0}
        ]

        def mock_run(cmd, *args, **kwargs):
            with open(self.output_mp4_path, 'wb') as f:
                f.write(b"mock_video_bytes")
            result_mock = MagicMock()
            result_mock.returncode = 0
            result_mock.stdout = "ffmpeg simulation completed successfully"
            result_mock.stderr = ""
            return result_mock

        mock_subprocess_run.side_effect = mock_run

        loop = asyncio.get_event_loop()
        seg_result = loop.run_until_complete(process_layers(self.dummy_img_path, "test_panel_123"))

        self.assertIn("background_url", seg_result)
        self.assertIn("character_url", seg_result)
        self.assertIn("text_url", seg_result)
        self.assertTrue(os.path.exists(layer_paths["bg.png"]))

        ocr_texts = ["hello world"]
        align_result = loop.run_until_complete(
            align_dialogue_and_extract_peaks(self.dummy_wav_path, ocr_texts)
        )

        self.assertIn("dialogue_map", align_result)
        self.assertIn("audio_peaks", align_result)

        dialogue_map = align_result["dialogue_map"]
        audio_peaks = align_result["audio_peaks"]

        layers_dict = {
            "background": layer_paths["bg.png"],
            "character": layer_paths["char.png"],
            "text": layer_paths["text.png"],
            "char_x": 0.0,
            "char_y": 0.0,
            "char_scale_x": 1.0,
            "char_scale_y": 1.0,
            "text_x": 0.0,
            "text_y": 0.0,
            "text_scale_x": 1.0,
            "text_scale_y": 1.0,
            "parallax_intensity": 30.0
        }

        loop.run_until_complete(
            _render_panel_segment_ffmpeg(
                img_path=layer_paths["bg.png"],
                audio_path=self.dummy_wav_path,
                duration=3.0,
                out_path=self.output_mp4_path,
                w=640,
                h=360,
                motion_type="zoom_in",
                fps=24,
                layers=layers_dict,
                sync_map=dialogue_map,
                audio_peaks=audio_peaks,
                audio_reactive_shake=True
            )
        )

        self.assertTrue(mock_subprocess_run.called)
        self.assertTrue(os.path.exists(self.output_mp4_path))
        self.assertTrue(os.path.getsize(self.output_mp4_path) > 0)


if __name__ == "__main__":
    unittest.main()
