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

from .formatters import ColoredFormatter
from .filters import EndpointFilter
from .handlers import (
    UIStreamLogHandler,
    log_buffer,
    listeners
)


def _should_use_colors() -> bool:
    return True


# Custom logging level integers
TRACE: int = 5
NOTICE: int = 22
SUCCESS: int = 25

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

logger = logging.getLogger("sonikoma.api")


def setup_logging():
    """Initializes the global logging configuration."""
    try:
        from app.core.config import IS_PRODUCTION
    except ImportError:
        from core.config import IS_PRODUCTION
    log_level_name = os.getenv("LOG_LEVEL", "INFO" if IS_PRODUCTION else "DEBUG").upper()
    log_level = getattr(logging, log_level_name, logging.DEBUG if not IS_PRODUCTION else logging.INFO)

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(ColoredFormatter(use_colors=_should_use_colors()))
    console_handler.addFilter(EndpointFilter())

    root_logger = logging.getLogger()
    
    ui_handler_exists = False
    for handler in root_logger.handlers[:]:
        if isinstance(handler, UIStreamLogHandler):
            ui_handler_exists = True
        else:
            root_logger.removeHandler(handler)

    if not ui_handler_exists:
        ui_handler = UIStreamLogHandler()
        root_logger.addHandler(ui_handler)

    root_logger.addHandler(console_handler)
    root_logger.setLevel(log_level)
    
    endpoint_filter = EndpointFilter()
    for uvicorn_log_name in ("uvicorn", "uvicorn.access", "uvicorn.error", "uvicorn.asgi"):
        u_log = logging.getLogger(uvicorn_log_name)
        u_log.addFilter(endpoint_filter)
        for h in u_log.handlers:
            h.addFilter(endpoint_filter)


def get_logs(since: int = 0) -> List[Dict[str, Any]]:
    """Get all logs generated since a given sequence number."""
    return [entry for entry in log_buffer if entry["id"] > since]


def add_log_listener(listener: Callable[[Dict[str, Any]], None]) -> None:
    """Register listener for live SSE stream notifications."""
    listeners.add(listener)


def remove_log_listener(listener: Callable[[Dict[str, Any]], None]) -> None:
    """Deregister active listener."""
    listeners.discard(listener)
