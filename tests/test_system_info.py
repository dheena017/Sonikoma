import unittest
from unittest.mock import patch, MagicMock
import sys
import os

# Add backend directory to sys.path so it can find app.utils
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.utils.system_info import get_engine_snapshot

class TestSystemInfo(unittest.TestCase):

    @patch('app.utils.system_info.psutil')
    @patch('app.utils.system_info.platform')
    @patch('app.utils.system_info.time')
    @patch('app.utils.system_info.os')
    def test_get_engine_snapshot_success(self, mock_os, mock_time, mock_platform, mock_psutil):
        # Setup mocks
        mock_os.getpid.return_value = 1234

        mock_process = MagicMock()
        mock_process.memory_info.return_value.rss = 104857600  # 100 MB
        mock_process.num_threads.return_value = 4
        mock_process.create_time.return_value = 1000.0
        mock_psutil.Process.return_value = mock_process

        mock_time.time.return_value = 1050.0  # Uptime: 50.0 sec

        mock_platform.system.return_value = 'Linux'
        mock_platform.release.return_value = '5.4.0'
        mock_platform.version.return_value = '#1 SMP'
        mock_platform.machine.return_value = 'x86_64'

        mock_psutil.cpu_percent.return_value = 15.5
        mock_psutil.virtual_memory.return_value.percent = 45.0
        mock_psutil.disk_usage.return_value.percent = 60.0

        # Call the function
        result = get_engine_snapshot()

        # Assertions
        expected = {
            "platform": {
                "system": 'Linux',
                "release": '5.4.0',
                "version": '#1 SMP',
                "machine": 'x86_64'
            },
            "system": {
                "cpu_percent": 15.5,
                "memory_percent": 45.0,
                "disk_usage": 60.0
            },
            "process": {
                "memory_rss_mb": 100.0,
                "threads": 4,
                "uptime_sec": 50.0
            }
        }
        self.assertEqual(result, expected)
        mock_psutil.Process.assert_called_once_with(1234)

    @patch('app.utils.system_info.psutil')
    def test_get_engine_snapshot_exception(self, mock_psutil):
        # Setup mock to raise an exception
        mock_psutil.Process.side_effect = Exception("Some internal error")

        # Call the function
        result = get_engine_snapshot()

        # Assertions
        expected = {"error": "Failed to capture system snapshot"}
        self.assertEqual(result, expected)

if __name__ == '__main__':
    unittest.main()
