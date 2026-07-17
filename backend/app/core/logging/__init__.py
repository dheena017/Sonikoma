"""
backend/app/core/logging/__init__.py
─────────────────────────────────────────────────────────────────────────────
Unified logging subsystem public API surface.
─────────────────────────────────────────────────────────────────────────────
"""

from core.logging.logger import (
    trace,
    notice,
    success,
    setup_logging,
    get_logs,
    add_log_listener,
    remove_log_listener,
)
from core.logging.formatters import ColoredFormatter
from core.logging.handlers import UIStreamLogHandler, log_buffer, log_seq, listeners, ANSI_ESCAPE
from core.logging.filters import EndpointFilter

__all__ = [
    "trace",
    "notice",
    "success",
    "setup_logging",
    "get_logs",
    "add_log_listener",
    "remove_log_listener",
    "ColoredFormatter",
    "UIStreamLogHandler",
    "log_buffer",
    "log_seq",
    "listeners",
    "ANSI_ESCAPE",
    "EndpointFilter",
]
