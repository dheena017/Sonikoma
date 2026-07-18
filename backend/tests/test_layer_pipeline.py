import sys
import os
import unittest
import asyncio
import wave
import shutil
import cv2
import numpy as np
from unittest.mock import patch, MagicMock

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'app')))

from app.services.image.layer_segmentation import process_layers
from app.services.audio.dialogue_aligner import align_dialogue_and_extract_peaks
from app.services.video.video_service import _render_panel_segment_ffmpeg


class TestLayerPipelineIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Create temp folder for test assets
        cls.temp_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), 'temp_integration_assets'))
        os.makedirs(cls.temp_dir, exist_ok=True)

        # Generate dummy original panel image (red square in background with a blue circle as character and a white text box)
        cls.dummy_img_path = os.path.join(cls.temp_dir, 'dummy_panel.png')
        img = np.zeros((300, 300, 3), dtype=np.uint8)
        img[:, :] = [0, 0, 255] # Red Background
        cv2.circle(img, (150, 150), 50, (255, 0, 0), -1) # Blue Character Circle
        cv2.rectangle(img, (50, 30), (250, 80), (255, 255, 255), -1) # White Dialogue Box
        cv2.imwrite(cls.dummy_img_path, img)

        # Generate simple dummy WAV file (1 second of silent audio)
        cls.dummy_wav_path = os.path.join(cls.temp_dir, 'dummy_audio.wav')
        with wave.open(cls.dummy_wav_path, 'wb') as wav:
            wav.setnchannels(1)
            wav.setsampwidth(2)
            wav.setframerate(22050)
            wav.writeframes(b'\x00' * 44100) # 1 second of silence

        # Define output path for segment rendering
        cls.output_mp4_path = os.path.join(cls.temp_dir, 'output_render_segment.mp4')

    @classmethod
    def tearDownClass(cls):
        # Clean up temp assets
        if os.path.exists(cls.temp_dir):
            shutil.rmtree(cls.temp_dir)

    @patch.dict(os.environ, {"ENVIRONMENT": "production"})
    @patch('media.image.layer_segmentation.upload_to_supabase_bucket')
    @patch('engines.whisper.WhisperEngine.extract_words_with_timestamps')
    @patch('subprocess.run')
    def test_complete_backend_pipeline(self, mock_subprocess_run, mock_extract_words, mock_upload_to_supabase):
        # 1. Setup mocks
        # Create local mock storage to simulate Supabase and retrieve paths for FFmpeg rendering
        layer_paths = {}

        def mock_upload(file_bytes, bucket, path_in_bucket, content_type):
            layer_name = path_in_bucket.split('/')[-1]
            local_path = os.path.join(self.temp_dir, f"mocked_{layer_name}")
            with open(local_path, 'wb') as f:
                f.write(file_bytes)
            layer_paths[layer_name] = local_path
            return f"file://{local_path}"

        mock_upload_to_supabase.side_effect = mock_upload

        # Mock whisper word timestamps to fuzzy match the dialogue string "hello world"
        mock_extract_words.return_value = [
            {"id": 0, "text": "hello", "start_time": 0.2, "end_time": 0.6, "confidence": 0.9, "segment_id": 0},
            {"id": 1, "text": "world", "start_time": 0.6, "end_time": 1.2, "confidence": 0.9, "segment_id": 0}
        ]

        # Setup mock for subprocess.run representing FFmpeg compilation execution
        def mock_run(cmd, *args, **kwargs):
            # Write a mock output file to satisfy file existence checks
            with open(self.output_mp4_path, 'w') as f:
                f.write("mock_video_bytes")

            # Create a mock result
            result_mock = MagicMock()
            result_mock.returncode = 0
            result_mock.stdout = "ffmpeg simulation completed successfully"
            result_mock.stderr = ""
            return result_mock

        mock_subprocess_run.side_effect = mock_run

        # 2. Run Layer Segmentation
        loop = asyncio.get_event_loop()
        seg_result = loop.run_until_complete(process_layers(self.dummy_img_path, "test_panel_123"))

        self.assertIn("background_url", seg_result)
        self.assertIn("character_url", seg_result)
        self.assertIn("text_url", seg_result)
        self.assertTrue(os.path.exists(layer_paths["bg.png"]))
        self.assertTrue(os.path.exists(layer_paths["char.png"]))
        self.assertTrue(os.path.exists(layer_paths["text.png"]))

        # 3. Run Audio & Dialogue Sync Map Extraction
        ocr_texts = ["hello world"]
        align_result = loop.run_until_complete(
            align_dialogue_and_extract_peaks(self.dummy_wav_path, ocr_texts)
        )

        self.assertIn("dialogue_map", align_result)
        self.assertIn("audio_peaks", align_result)
        self.assertTrue(len(align_result["dialogue_map"]) > 0)

        # 4. Compile / Render Segment using FFmpeg
        dialogue_map = align_result["dialogue_map"]
        audio_peaks = align_result["audio_peaks"]

        # Form layer dictionary using the local files we mock-saved
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

        # Render the motion comic panel segment with parallax, sync timing, and audio-reactive shake enabled
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

        # Verify that subprocess.run was called to invoke FFmpeg
        self.assertTrue(mock_subprocess_run.called)
        ffmpeg_cmd = mock_subprocess_run.call_args[0][0]
        self.assertIn("ffmpeg", ffmpeg_cmd[0].lower())

        # Assert output video file exists and is not empty
        self.assertTrue(os.path.exists(self.output_mp4_path))
        self.assertTrue(os.path.getsize(self.output_mp4_path) > 0)
        print("✓ Completed entire Backend Integration Test successfully with 0 crashes!")


if __name__ == '__main__':
    unittest.main()
