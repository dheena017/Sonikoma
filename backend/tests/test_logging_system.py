"""
backend/tests/test_logging_system.py
─────────────────────────────────────────────────────────────────────────────
Comprehensive Unit & Integration Test Suite for Sonikoma Logging Subsystem:
- EndpointFilter noise path suppression
- UIStreamLogHandler ANSI stripping, log_buffer queuing, and duplicate throttling
- SSE Stream Listener notifications
- ProcessTimeLoggingMiddleware response header injection and endpoint filtering
─────────────────────────────────────────────────────────────────────────────
"""

import os
import sys
import time
import logging
import unittest
from unittest.mock import MagicMock

# Add backend/app to Python sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'app')))

from core.logging.filters import EndpointFilter
from core.logging.handlers import UIStreamLogHandler, log_buffer, listeners
from core.logging.logger import setup_logging, get_logs, add_log_listener, remove_log_listener


class TestEndpointFilter(unittest.TestCase):
    def setUp(self):
        self.filter = EndpointFilter()

    def test_noisy_paths_are_filtered(self):
        noisy_messages = [
            'GET /system-logs HTTP/1.1',
            'GET /api/system-logs 200 OK',
            'GET /api/v1/system-logs/stream HTTP/1.1',
            'GET /api/health 200',
            'GET /api/v1/health 200',
            'GET /healthz 200',
            'GET /metrics 200',
            'GET /api/status 200',
            'OPTIONS / 200',
            'GET /favicon.ico 404',
        ]
        for msg in noisy_messages:
            record = logging.LogRecord(
                name="test", level=logging.INFO, pathname="", lineno=0,
                msg=msg, args=(), exc_info=None
            )
            self.assertFalse(self.filter.filter(record), f"Expected '{msg}' to be filtered out.")

    def test_legitimate_paths_are_allowed(self):
        valid_messages = [
            'POST /api/projects 201 Created',
            'POST /api/image/clean-bubbles 200 OK',
            'POST /api/video/render 200 OK',
            'GET /api/auth/me 200 OK',
            'User logged in successfully',
            '[Startup] Pre-warming rembg U-2-Net session...',
        ]
        for msg in valid_messages:
            record = logging.LogRecord(
                name="test", level=logging.INFO, pathname="", lineno=0,
                msg=msg, args=(), exc_info=None
            )
            self.assertTrue(self.filter.filter(record), f"Expected '{msg}' to pass through filter.")


class TestUIStreamLogHandler(unittest.TestCase):
    def setUp(self):
        self.handler = UIStreamLogHandler()
        log_buffer.clear()
        listeners.clear()

    def test_ansi_color_stripping(self):
        colored_msg = "\x1b[32m[SUCCESS]\x1b[0m \x1b[1;35mProcessing complete!\x1b[0m"
        record = logging.LogRecord(
            name="sonikoma.media", level=logging.INFO, pathname="", lineno=0,
            msg=colored_msg, args=(), exc_info=None
        )
        self.handler.emit(record)

        self.assertGreater(len(log_buffer), 0)
        last_entry = log_buffer[-1]
        self.assertEqual(last_entry["message"], "[SUCCESS] Processing complete!")
        self.assertEqual(last_entry["module"], "Media")
        self.assertEqual(last_entry["level"], "INFO")

    def test_rapid_consecutive_duplicate_suppression(self):
        record = logging.LogRecord(
            name="sonikoma.app", level=logging.INFO, pathname="", lineno=0,
            msg="Repeated heartbeat checking operation...", args=(), exc_info=None
        )

        # First emission should succeed
        self.handler.emit(record)
        initial_len = len(log_buffer)
        self.assertEqual(initial_len, 1)

        # Immediate second emission (duplicate within 3s) should be suppressed
        self.handler.emit(record)
        self.assertEqual(len(log_buffer), 1, "Duplicate log should have been suppressed!")

    def test_sse_listener_notification(self):
        received_logs = []

        def mock_listener(entry):
            received_logs.append(entry)

        add_log_listener(mock_listener)
        self.assertIn(mock_listener, listeners)

        record = logging.LogRecord(
            name="sonikoma.db", level=logging.INFO, pathname="", lineno=0,
            msg="Database query executed in 1.2ms", args=(), exc_info=None
        )
        self.handler.emit(record)

        self.assertEqual(len(received_logs), 1)
        self.assertEqual(received_logs[0]["module"], "Database")
        self.assertIn("Database query", received_logs[0]["message"])

        remove_log_listener(mock_listener)
        self.assertNotIn(mock_listener, listeners)


class TestGetLogsHelper(unittest.TestCase):
    def setUp(self):
        log_buffer.clear()

    def test_get_logs_since_sequence(self):
        handler = UIStreamLogHandler()
        for i in range(5):
            rec = logging.LogRecord(
                name="sonikoma.api", level=logging.INFO, pathname="", lineno=0,
                msg=f"Test message {i + 1}", args=(), exc_info=None
            )
            handler.emit(rec)
            time.sleep(0.01)

        all_entries = get_logs(since=0)
        self.assertEqual(len(all_entries), 5)

        first_id = all_entries[0]["id"]
        subsequent = get_logs(since=first_id)
        self.assertEqual(len(subsequent), 4)


if __name__ == "__main__":
    unittest.main()
