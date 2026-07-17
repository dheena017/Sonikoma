"""
backend/app/core/logging/logger.py
─────────────────────────────────────────────────────────────────────────────
Logging setup, custom levels configuration, and helper functions.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import sys
import logging
from typing import List, Dict, Any, Callable

from core.logging.formatters import ColoredFormatter
from core.logging.filters import EndpointFilter
from core.logging.handlers import (
    UIStreamLogHandler,
    log_buffer,
    log_seq,
    listeners
)

# Custom logging levels configuration
logging.TRACE = 5
logging.addLevelName(logging.TRACE, "TRACE")
def trace(self, message, *args, **kws):
    if self.isEnabledFor(logging.TRACE):
        self._log(logging.TRACE, message, args, **kws)
logging.Logger.trace = trace

logging.NOTICE = 22
logging.addLevelName(logging.NOTICE, "NOTICE")
def notice(self, message, *args, **kws):
    if self.isEnabledFor(logging.NOTICE):
        self._log(logging.NOTICE, message, args, **kws)
logging.Logger.notice = notice

logging.SUCCESS = 25
logging.addLevelName(logging.SUCCESS, "SUCCESS")
def success(self, message, *args, **kws):
    if self.isEnabledFor(logging.SUCCESS):
        self._log(logging.SUCCESS, message, args, **kws)
logging.Logger.success = success


def setup_logging():
    """Initializes the global logging configuration."""
    IS_PRODUCTION = os.getenv("NODE_ENV") == "production"
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(ColoredFormatter(use_colors=not IS_PRODUCTION))
    console_handler.addFilter(EndpointFilter())

    root_logger = logging.getLogger()
    
    # Preserve UIStreamLogHandler if already registered, otherwise add a new one
    ui_handler_exists = False
    for handler in root_logger.handlers[:]:
        if isinstance(handler, UIStreamLogHandler):
            ui_handler_exists = True
        elif not isinstance(handler, UIStreamLogHandler):
            root_logger.removeHandler(handler)

    if not ui_handler_exists:
        ui_handler = UIStreamLogHandler()
        root_logger.addHandler(ui_handler)

    root_logger.addHandler(console_handler)
    root_logger.setLevel(logging.INFO)
    
    # Set logger levels for noisy libraries
    logging.getLogger("uvicorn.access").addFilter(EndpointFilter())
    
    logger = logging.getLogger("sonikoma.api")
    logger.info("Logging subsystem successfully initialized.")


def get_logs(since: int = 0) -> List[Dict[str, Any]]:
    """Get all logs generated since a given sequence number."""
    return [entry for entry in log_buffer if entry["id"] > since]


def add_log_listener(listener: Callable[[Dict[str, Any]], None]) -> None:
    """Register listener for live SSE stream notifications."""
    listeners.add(listener)


def remove_log_listener(listener: Callable[[Dict[str, Any]], None]) -> None:
    """Deregister active listener."""
    listeners.discard(listener)
