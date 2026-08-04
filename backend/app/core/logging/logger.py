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
    listeners
)

# Custom logging level integers (defined here to avoid monkey-patching the
# logging module, which static analysers like Pylance/mypy don't support).
TRACE: int = 5
NOTICE: int = 22
SUCCESS: int = 25

# Register names so they appear correctly in formatted output.
logging.addLevelName(TRACE, "TRACE")
logging.addLevelName(NOTICE, "NOTICE")
logging.addLevelName(SUCCESS, "SUCCESS")


def trace(self: logging.Logger, message: str, *args: object, **kws: object) -> None:
    if self.isEnabledFor(TRACE):
        self._log(TRACE, message, args, **kws)  # type: ignore[arg-type]


def notice(self: logging.Logger, message: str, *args: object, **kws: object) -> None:
    if self.isEnabledFor(NOTICE):
        self._log(NOTICE, message, args, **kws)  # type: ignore[arg-type]


def success(self: logging.Logger, message: str, *args: object, **kws: object) -> None:
    if self.isEnabledFor(SUCCESS):
        self._log(SUCCESS, message, args, **kws)  # type: ignore[arg-type]


logging.Logger.trace = trace   # type: ignore[attr-defined]
logging.Logger.notice = notice  # type: ignore[attr-defined]
logging.Logger.success = success  # type: ignore[attr-defined]


def setup_logging():
    """Initializes the global logging configuration."""
    from startup.bootstrap import IS_PRODUCTION, LOG_LEVEL
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
    root_logger.setLevel(LOG_LEVEL)
    
    # Set logger levels for noisy libraries
    logging.getLogger("uvicorn.access").addFilter(EndpointFilter())
    
    logger = logging.getLogger("sonikoma.api")


def get_logs(since: int = 0) -> List[Dict[str, Any]]:
    """Get all logs generated since a given sequence number."""
    return [entry for entry in log_buffer if entry["id"] > since]


def add_log_listener(listener: Callable[[Dict[str, Any]], None]) -> None:
    """Register listener for live SSE stream notifications."""
    listeners.add(listener)


def remove_log_listener(listener: Callable[[Dict[str, Any]], None]) -> None:
    """Deregister active listener."""
    listeners.discard(listener)
