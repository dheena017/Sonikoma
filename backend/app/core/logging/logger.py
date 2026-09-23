"""
backend/app/core/logging/logger.py
─────────────────────────────────────────────────────────────────────────────
High-performance centralized logging infrastructure for Sonikoma.
Features:
  - Custom log levels (TRACE=5, NOTICE=22, SUCCESS=25)
  - Colorized ANSI console output with HTTP & route highlighting
  - Multi-stream UI live buffer with SSE listener dispatch
  - Optional rotating file handler (data/logs/sonikoma.log)
  - Comprehensive third-party noise suppression (HTTP/2, Numba, SciPy, Matplotlib)
  - Subsystem logger factory (get_logger)
  - Execution duration measurement context manager (timed_stage)
  - Runtime dynamic log level switching (set_global_log_level)
  - Buffer telemetry and querying (get_log_stats, query_logs, clear_log_buffer)
─────────────────────────────────────────────────────────────────────────────
"""

import os
import sys
import time
import logging
import threading
from contextlib import contextmanager
from logging.handlers import RotatingFileHandler
from typing import List, Dict, Any, Callable, Optional, Generator

from .formatters import ColoredFormatter
from .filters import (
    EndpointFilter,
    create_standard_filter_pipeline,
    get_global_endpoint_filter,
    get_filter_stats,
)
from .handlers import (
    UIStreamLogHandler,
    log_buffer,
    listeners
)


def _should_use_colors() -> bool:
    """Detect whether colors should be enabled based on TTY or environment."""
    if os.getenv("NO_COLOR"):
        return False
    if os.getenv("FORCE_COLOR") or os.getenv("TERM") == "xterm-256color":
        return True
    return True


# ── Custom Logging Levels ───────────────────────────────────────────────────
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


logging.Logger.trace = trace      # type: ignore[attr-defined]
logging.Logger.notice = notice    # type: ignore[attr-defined]
logging.Logger.success = success  # type: ignore[attr-defined]

# Canonical core logger instance
logger = logging.getLogger("sonikoma.api")

# Thread safety lock for buffer & handler management
_logging_lock = threading.Lock()
_start_time = time.time()


# ── Third-Party Loggers to Mute / Silence ───────────────────────────────────
NOISY_THIRD_PARTY_LOGGERS = (
    # Audio & Subprocess
    "pydub",
    "pydub.logging_utils",
    "moviepy",
    # Imaging & Vision
    "PIL",
    "PIL.PngImagePlugin",
    "PIL.Image",
    "pymatting",
    "pymatting.util",
    "ultralytics",
    "onnxruntime",
    # HTTP & Networking
    "httpcore",
    "httpcore.http11",
    "httpcore.http2",
    "httpcore._synchronization",
    "httpx",
    "httpx._client",
    "hpack",
    "hpack.hpack",
    "hpack.table",
    "h2",
    "h2.connection",
    "h2.streams",
    "h2.events",
    "h11",
    "urllib3",
    "urllib3.connectionpool",
    "urllib3.util.retry",
    "charset_normalizer",
    "multipart",
    "multipart.multipart",
    # Async & File Watchers
    "asyncio",
    "watchfiles",
    "watchfiles.main",
    "filelock",
    # Google AI / GenAI / Cloud
    "google",
    "google.genai",
    "google.auth",
    "google.auth.transport.requests",
    "absl",
    # Deep Learning & Scientific Math Compilers
    "torch",
    "transformers",
    "numba",
    "numba.core",
    "numba.core.ssa",
    "numba.core.byteflow",
    "numba.core.interpreter",
    "numba.core.transforms",
    "numba.core.typeinfer",
    "librosa",
    "matplotlib",
    "matplotlib.font_manager",
    "scipy",
    "scipy.spatial",
)


def get_logger(name: str) -> logging.Logger:
    """
    Subsystem logger factory. Automatically prefixes names with 'sonikoma.'
    if not already scoped, ensuring unified hierarchy and configuration.
    """
    clean_name = name.strip()
    if not clean_name.startswith("sonikoma.") and clean_name != "sonikoma":
        full_name = f"sonikoma.{clean_name}"
    else:
        full_name = clean_name
    return logging.getLogger(full_name)


def setup_logging():
    """Initializes the global logging configuration with console, UI, and optional file output."""
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass
    if hasattr(sys.stderr, "reconfigure"):
        try:
            sys.stderr.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass

    try:
        from app.core.config import IS_PRODUCTION
    except ImportError:
        from core.config import IS_PRODUCTION

    log_level_name = os.getenv("LOG_LEVEL", "INFO" if IS_PRODUCTION else "DEBUG").upper()
    log_level = getattr(logging, log_level_name, logging.DEBUG if not IS_PRODUCTION else logging.INFO)

    root_logger = logging.getLogger()
    filter_pipeline = create_standard_filter_pipeline()
    endpoint_filter = get_global_endpoint_filter()

    # 1. Console Handler (ANSI colorized output + credentials scrub + deduplication)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(ColoredFormatter(use_colors=_should_use_colors()))
    console_handler.addFilter(filter_pipeline)

    # 2. UI Log Stream Handler
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

    # 3. Rotating File Handler (Persistent logs under data/logs/sonikoma.log)
    try:
        base_dir = os.path.dirname(__file__)
        project_root = os.path.abspath(os.path.join(base_dir, "..", "..", "..", ".."))
        log_dir = os.path.join(project_root, "data", "logs")
        os.makedirs(log_dir, exist_ok=True)
        log_file_path = os.path.join(log_dir, "sonikoma.log")

        file_handler = RotatingFileHandler(
            log_file_path,
            maxBytes=10 * 1024 * 1024,  # 10 MB
            backupCount=5,
            encoding="utf-8",
        )
        file_formatter = logging.Formatter(
            "%(asctime)s [%(levelname)-7s] [%(name)s] %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        file_handler.setFormatter(file_formatter)
        file_handler.setLevel(logging.DEBUG)
        file_handler.addFilter(filter_pipeline)
        root_logger.addHandler(file_handler)
    except Exception as e:
        # Fallback gracefully if file logging cannot be initialized (e.g. read-only volume)
        sys.stderr.write(f"[LoggingSetup] Warning: Could not initialize rotating file handler: {e}\n")

    root_logger.setLevel(log_level)

    # Attach filter to all Uvicorn loggers to suppress high-frequency polling
    for uvicorn_log_name in ("uvicorn", "uvicorn.access", "uvicorn.error", "uvicorn.asgi"):
        u_log = logging.getLogger(uvicorn_log_name)
        u_log.addFilter(endpoint_filter)
        for h in u_log.handlers:
            h.addFilter(endpoint_filter)

    # Silence noisy third-party debug logs
    for noisy in NOISY_THIRD_PARTY_LOGGERS:
        n_log = logging.getLogger(noisy)
        n_log.setLevel(logging.WARNING)
        n_log.addFilter(endpoint_filter)


def set_global_log_level(level: str | int) -> str:
    """
    Dynamically adjust the global root log level at runtime without restarting.
    Accepts string ('DEBUG', 'INFO', 'WARNING', 'ERROR') or level integer.
    """
    if isinstance(level, str):
        level_int = getattr(logging, level.upper(), logging.INFO)
        level_str = level.upper()
    else:
        level_int = level
        level_str = logging.getLevelName(level)

    with _logging_lock:
        logging.getLogger().setLevel(level_int)
        logger.setLevel(level_int)
        logger.notice(f"Global log level switched to: {level_str}")
    return level_str


def get_current_log_level() -> str:
    """Returns the current string name of the root logger level."""
    return logging.getLevelName(logging.getLogger().level)


# ── Execution Timing Context Manager ────────────────────────────────────────
@contextmanager
def timed_stage(stage_name: str, custom_logger: Optional[logging.Logger] = None, level: int = logging.INFO) -> Generator[Dict[str, Any], None, None]:
    """
    Context manager that measures and logs the duration of a workflow stage.
    Usage:
        with timed_stage("AI Storyboard Generation"):
            do_generation()
    """
    log_target = custom_logger or logger
    start = time.perf_counter()
    state = {"stage": stage_name, "start_time": start, "duration_ms": 0.0, "success": True}
    log_target.log(level, f"[STAGE START] {stage_name}...")
    try:
        yield state
    except Exception as exc:
        duration_ms = (time.perf_counter() - start) * 1000.0
        state["duration_ms"] = duration_ms
        state["success"] = False
        state["error"] = str(exc)
        log_target.error(f"[STAGE FAILED] {stage_name} after {duration_ms:.1f}ms: {exc}")
        raise
    else:
        duration_ms = (time.perf_counter() - start) * 1000.0
        state["duration_ms"] = duration_ms
        if hasattr(log_target, "success") and level <= SUCCESS:
            log_target.success(f"[STAGE DONE] {stage_name} in {duration_ms:.1f}ms")  # type: ignore[attr-defined]
        else:
            log_target.log(level, f"[STAGE DONE] {stage_name} in {duration_ms:.1f}ms")


def log_event(event_name: str, details: Optional[Dict[str, Any]] = None, level: int = logging.INFO) -> None:
    """Structured audit/telemetry event logging helper."""
    details_str = f" | {details}" if details else ""
    logger.log(level, f"[EVENT] {event_name}{details_str}")


def log_exception(message: str, exc: Optional[Exception] = None, custom_logger: Optional[logging.Logger] = None) -> None:
    """Safely logs an exception with traceback without raising unhandled errors."""
    log_target = custom_logger or logger
    if exc:
        log_target.error(f"{message}: {exc}", exc_info=True)
    else:
        log_target.error(message, exc_info=True)


# ── UI Buffer Queries & Telemetry ───────────────────────────────────────────
def get_logs(since: int = 0) -> List[Dict[str, Any]]:
    """Get all logs generated since a given sequence number."""
    with _logging_lock:
        return [entry for entry in log_buffer if entry["id"] > since]


def query_logs(
    level: Optional[str] = None,
    module: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 100
) -> List[Dict[str, Any]]:
    """
    Search and filter stored in-memory logs with high performance.
    """
    with _logging_lock:
        items = list(log_buffer)

    results = []
    level_filter = level.upper() if level else None
    module_filter = module.lower() if module else None
    search_filter = search.lower() if search else None

    for item in reversed(items):
        if level_filter and item.get("level") != level_filter:
            continue
        if module_filter and module_filter not in item.get("module", "").lower():
            continue
        if search_filter and search_filter not in item.get("message", "").lower():
            continue
        results.append(item)
        if len(results) >= limit:
            break

    return list(reversed(results))


def get_log_stats() -> Dict[str, Any]:
    """Retrieve telemetry metrics on current log activity, buffer usage, and active listeners."""
    with _logging_lock:
        total = len(log_buffer)
        counts: Dict[str, int] = {}
        for entry in log_buffer:
            lvl = entry.get("level", "INFO")
            counts[lvl] = counts.get(lvl, 0) + 1

    return {
        "total_in_buffer": total,
        "max_capacity": log_buffer.maxlen if hasattr(log_buffer, "maxlen") else 500,
        "counts_by_level": counts,
        "active_stream_listeners": len(listeners),
        "current_level": get_current_log_level(),
        "filter_metrics": get_filter_stats(),
        "uptime_seconds": round(time.time() - _start_time, 1),
    }


def clear_log_buffer() -> None:
    """Clear all stored entries from the in-memory log buffer."""
    with _logging_lock:
        log_buffer.clear()
        logger.notice("In-memory UI log buffer cleared")


def add_log_listener(listener: Callable[[Dict[str, Any]], None]) -> None:
    """Register listener for live SSE stream notifications."""
    with _logging_lock:
        listeners.add(listener)


def remove_log_listener(listener: Callable[[Dict[str, Any]], None]) -> None:
    """Deregister active listener."""
    with _logging_lock:
        listeners.discard(listener)

