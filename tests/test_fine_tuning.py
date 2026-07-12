import os
import sys
import unittest
import shutil
from fastapi import FastAPI
from fastapi.testclient import TestClient

# Add backend/python to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend', 'python')))

from routes.image_routes import router as image_router
from media.image.train_yolo import status

class TestFineTuning(unittest.TestCase):
    def setUp(self):
        self.app = FastAPI()
        self.app.include_router(image_router)
        self.client = TestClient(self.app)
        
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.training_dir = os.path.join(self.base_dir, "training_data")
        self.backup_dir = os.path.join(self.base_dir, "training_data_backup_test")

        # Temporarily backup training_data to verify empty check
        if os.path.exists(self.training_dir):
            shutil.copytree(self.training_dir, self.backup_dir, dirs_exist_ok=True)
            # empty out training_dir
            for f in os.listdir(self.training_dir):
                fp = os.path.join(self.training_dir, f)
                if os.path.isfile(fp):
                    os.remove(fp)

    def tearDown(self):
        # Restore training_data
        if os.path.exists(self.backup_dir):
            shutil.copytree(self.backup_dir, self.training_dir, dirs_exist_ok=True)
            shutil.rmtree(self.backup_dir)

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
