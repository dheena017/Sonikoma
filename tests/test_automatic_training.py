import os
import sys
import json
import shutil
import unittest
import tempfile
from unittest.mock import patch, MagicMock

# Add backend/python to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend', 'python')))

import services.training_monitor as monitor
from media.image.train_yolo import status, trigger_fine_tuning, _train_worker

class TestAutomaticTraining(unittest.TestCase):
    def setUp(self):
        # We will use a temp folder for training data to avoid polluting the actual one
        self.test_dir = tempfile.mkdtemp()
        self.patcher_dir = patch("services.training_monitor.TRAINING_DATA_DIR", self.test_dir)
        self.patcher_meta = patch("services.training_monitor.METADATA_FILE", os.path.join(self.test_dir, "training_metadata.json"))

        self.patcher_dir.start()
        self.patcher_meta.start()

        status.reset()

    def tearDown(self):
        self.patcher_dir.stop()
        self.patcher_meta.stop()
        shutil.rmtree(self.test_dir, ignore_errors=True)
        status.reset()

    def create_mock_sample_pairs(self, count: int):
        """Creates dummy files representing original panel and mask pairs."""
        for i in range(count):
            pair_id = f"test_{i:03d}"
            orig_path = os.path.join(self.test_dir, f"original_{pair_id}.png")
            mask_path = os.path.join(self.test_dir, f"mask_{pair_id}.png")
            with open(orig_path, "w") as f:
                f.write("orig")
            with open(mask_path, "w") as f:
                f.write("mask")

    def test_get_current_original_count(self):
        # Empty
        self.assertEqual(monitor.get_current_original_count(), 0)

        # 5 samples
        self.create_mock_sample_pairs(5)
        self.assertEqual(monitor.get_current_original_count(), 5)

    def test_load_and_save_metadata(self):
        # Default metadata when file doesn't exist
        meta = monitor.load_metadata()
        self.assertEqual(meta["last_trained_count"], 0)
        self.assertEqual(meta["total_runs"], 0)

        # Modify and save
        meta["last_trained_count"] = 15
        meta["total_runs"] = 2
        monitor.save_metadata(meta)

        # Load again to verify persistence
        loaded = monitor.load_metadata()
        self.assertEqual(loaded["last_trained_count"], 15)
        self.assertEqual(loaded["total_runs"], 2)

    @patch("services.training_monitor.trigger_fine_tuning")
    def test_check_and_trigger_training_below_threshold(self, mock_trigger):
        mock_trigger.return_value = True

        # Create 19 samples (threshold is 20)
        self.create_mock_sample_pairs(19)

        triggered = monitor.check_and_trigger_training()
        self.assertFalse(triggered)
        mock_trigger.assert_not_called()

        # Metadata should remain 0
        meta = monitor.load_metadata()
        self.assertEqual(meta["last_trained_count"], 0)

    @patch("services.training_monitor.trigger_fine_tuning")
    def test_check_and_trigger_training_at_threshold(self, mock_trigger):
        mock_trigger.return_value = True

        # Create 20 samples
        self.create_mock_sample_pairs(20)

        triggered = monitor.check_and_trigger_training()
        self.assertTrue(triggered)
        mock_trigger.assert_called_once_with(epochs=20, batch_size=4)

        # Metadata last_trained_count should now be updated to 20
        meta = monitor.load_metadata()
        self.assertEqual(meta["last_trained_count"], 20)
        self.assertEqual(meta["total_runs"], 1)

    @patch("services.training_monitor.trigger_fine_tuning")
    def test_lock_file_and_active_status_blocks_trigger(self, mock_trigger):
        # 1. Set status to is_training=True
        status.update(is_training=True)
        self.create_mock_sample_pairs(20)

        triggered = monitor.check_and_trigger_training()
        self.assertFalse(triggered)
        mock_trigger.assert_not_called()

        # Reset training status
        status.update(is_training=False)

        # 2. Create lock file manually to simulate active run
        lock_file = os.path.join(self.test_dir, "training.lock")
        with open(lock_file, "w") as f:
            f.write(f"PID: {os.getpid()}")

        triggered = monitor.check_and_trigger_training()
        self.assertFalse(triggered)
        mock_trigger.assert_not_called()

    @patch("media.image.train_yolo._train_worker")
    def test_trigger_fine_tuning_lock_and_spawn_behavior(self, mock_worker):
        # Patch the join function to force path resolution to use the temp test_dir
        orig_join = os.path.join
        def mock_join(*args):
            if any("training_data" in str(arg) for arg in args):
                return self.test_dir
            return orig_join(*args)

        with patch("media.image.train_yolo.os.path.join", side_effect=mock_join):
            # Start first run
            triggered_first = trigger_fine_tuning()
            self.assertTrue(triggered_first)

            # Create mock lock file manually (simulating a run in progress)
            lock_file = os.path.join(self.test_dir, "training.lock")
            with open(lock_file, "w") as f:
                f.write(f"PID: {os.getpid()}")

            # Attempt to trigger second run while locked
            triggered_second = trigger_fine_tuning()
            self.assertFalse(triggered_second)

if __name__ == "__main__":
    unittest.main()
