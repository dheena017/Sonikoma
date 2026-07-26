import os
import sys
import unittest
import tempfile
import shutil
from unittest.mock import patch
from fastapi import FastAPI
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'app')))

from api.v1.images.upload import router as upload_router


class TestFineTuning(unittest.TestCase):
    def setUp(self):
        self.test_dir = tempfile.mkdtemp()
        self.patcher = patch("api.v1.images.upload._TRAINING_DIR", self.test_dir)
        self.patcher.start()

        self.app = FastAPI()
        self.app.include_router(upload_router)
        self.client = TestClient(self.app)

    def tearDown(self):
        self.patcher.stop()
        shutil.rmtree(self.test_dir, ignore_errors=True)

    def test_start_training_with_empty_data_returns_400(self):
        # Trigger training without samples
        response = self.client.post("/start-training")
        self.assertEqual(response.status_code, 400)
        
        detail = response.json().get("detail", "")
        self.assertIn("No human-corrected samples have been saved", detail)

    def test_training_status_default_schema(self):
        # Verify status endpoint returns expected fields
        response = self.client.get("/training-status")
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertIn("is_training", data)
        self.assertIn("epoch", data)
        self.assertIn("total_epochs", data)
        self.assertIn("elapsed_seconds", data)
        self.assertIn("training_pairs", data)
        self.assertIn("metrics", data)
        self.assertIn("error", data)
        self.assertFalse(data["is_training"])


if __name__ == "__main__":
    unittest.main()
