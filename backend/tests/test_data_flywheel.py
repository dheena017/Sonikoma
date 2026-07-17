import os
import sys
import tempfile
import unittest
from fastapi import FastAPI
from fastapi.testclient import TestClient

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'app')))

from routes.image_routes import router as image_router

class TestDataFlywheel(unittest.TestCase):
    def setUp(self):
        self.app = FastAPI()
        self.app.include_router(image_router)
        self.client = TestClient(self.app)

    def test_training_data_count_and_save(self):
        # 1. Verify get count endpoint
        response = self.client.get("/training-data-count")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("count", data)
        initial_count = data["count"]

        # 2. Verify save training data endpoint
        orig_data = b"fake original panel data"
        mask_data = b"fake mask data"

        files = {
            "original_panel": ("orig.png", orig_data, "image/png"),
            "corrected_text_mask": ("mask.png", mask_data, "image/png")
        }

        save_response = self.client.post("/save-training-data", files=files)
        self.assertEqual(save_response.status_code, 200)
        save_data = save_response.json()
        self.assertTrue(save_data["success"])
        self.assertIn("pair_id", save_data)
        self.assertIn("original_panel_url", save_data)
        self.assertIn("corrected_text_mask_url", save_data)

        # 3. Verify count incremented
        response_after = self.client.get("/training-data-count")
        self.assertEqual(response_after.status_code, 200)
        data_after = response_after.json()
        self.assertEqual(data_after["count"], initial_count + 1)

        # Cleanup
        pair_id = save_data["pair_id"]
        training_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "training_data"))
        orig_path = os.path.join(training_dir, f"original_{pair_id}.png")
        mask_path = os.path.join(training_dir, f"mask_{pair_id}.png")

        for p in (orig_path, mask_path):
            if os.path.exists(p):
                try:
                    os.remove(p)
                except OSError:
                    pass

if __name__ == "__main__":
    unittest.main()
