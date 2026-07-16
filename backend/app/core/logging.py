"""
backend/app/core/logging.py
─────────────────────────────────────────────────────────────────────────────
Unified logging subsystem: colors, custom levels, UI handlers, buffer, and DB sink.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import sys
import time
import re
import json
import logging
import random
from collections import deque
from typing import List, Dict, Any, Callable, Optional

logger_name = "sonikoma"

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


class ColoredFormatter(logging.Formatter):
    COLORS = {
        'TRACE': '\x1b[90m',     # Dark Grey
        'DEBUG': '\x1b[37m',     # White
        'INFO': '\x1b[36m',      # Cyan
        'NOTICE': '\x1b[35m',    # Magenta
        'SUCCESS': '\x1b[32m',   # Green
        'WARNING': '\x1b[33m',   # Yellow
        'ERROR': '\x1b[31m',     # Red
        'CRITICAL': '\x1b[1;31m' # Bold Red
    }
    RESET = '\x1b[0m'

    def __init__(self, *args, **kwargs):
        self.use_colors = kwargs.pop('use_colors', True)
        super().__init__(*args, **kwargs)

    def colorize_message(self, message: str) -> str:
        # 1. Colorize AFC log line
        if "AFC is enabled" in message:
            afc_match = re.match(r'^(.*?\b)?(AFC)(\s+is\s+)(\w+)(\s+with\s+max\s+remote\s+calls:\s*)(\d+)(.*)$', message)
            if afc_match:
                pre, afc, is_str, status, post_str, num, rest = afc_match.groups()
                return (
                    f"{pre or ''}"
                    f"\x1b[1;35m{afc}\x1b[0m"
                    f"{is_str}"
                    f"\x1b[32m{status}\x1b[0m"
                    f"{post_str}"
                    f"\x1b[1;33m{num}\x1b[0m"
                    f"{rest}"
                )

        # 2. Colorize HTTP Request logs with URLs
        general_http_regex = re.compile(
            r'^(.*?)(https?://[^\s"\'()]+)(?:\s+(["\']HTTP/\d\.\d \d{3} .*?["\']|\d{3}\b))?(.*)$',
            re.IGNORECASE
        )
        match = general_http_regex.match(message)
        if match:
            prefix, url, status, suffix = match.groups()

            # Colorize prefix
            colorized_prefix = ""
            if prefix:
                method_match = re.match(r'^(.*?\b)(POST|GET|PUT|DELETE)(\s*)$', prefix, re.IGNORECASE)
                if method_match:
                    pre, method, post = method_match.groups()
                    pre_colorized = ""
                    parts = re.split(r'(\s+|:|\[|\])', pre)
                    for part in parts:
                        if not part:
                            continue
                        if part.isspace():
                            pre_colorized += part
                        elif part == "INFO":
                            pre_colorized += f"\x1b[90m{part}\x1b[0m"
                        elif part == "httpx":
                            pre_colorized += f"\x1b[95m{part}\x1b[0m"
                        elif part == "HTTP":
                            pre_colorized += f"\x1b[35m{part}\x1b[0m"
                        elif part == "Request":
                            pre_colorized += f"\x1b[35m{part}\x1b[0m"
                        elif part in (":", "[", "]"):
                            pre_colorized += f"\x1b[90m{part}\x1b[0m"
                        else:
                            pre_colorized += f"\x1b[90m{part}\x1b[0m"

                    method_upper = method.upper()
                    if method_upper == "POST":
                        method_colorized = f"\x1b[1;33m{method}\x1b[0m"
                    elif method_upper == "GET":
                        method_colorized = f"\x1b[1;32m{method}\x1b[0m"
                    elif method_upper == "PUT":
                        method_colorized = f"\x1b[1;34m{method}\x1b[0m"
                    elif method_upper == "DELETE":
                        method_colorized = f"\x1b[1;31m{method}\x1b[0m"
                    else:
                        method_colorized = f"\x1b[1;35m{method}\x1b[0m"
                    colorized_prefix = pre_colorized + method_colorized + post
                else:
                    parts = re.split(r'(\s+|:|\[|\])', prefix)
                    for part in parts:
                        if not part:
                            continue
                        if part.isspace():
                            colorized_prefix += part
                        elif part == "INFO":
                            colorized_prefix += f"\x1b[90m{part}\x1b[0m"
                        elif part == "httpx":
                            colorized_prefix += f"\x1b[95m{part}\x1b[0m"
                        elif part == "HTTP":
                            colorized_prefix += f"\x1b[35m{part}\x1b[0m"
                        elif part == "Request":
                            colorized_prefix += f"\x1b[35m{part}\x1b[0m"
                        elif part in (":", "[", "]"):
                            colorized_prefix += f"\x1b[90m{part}\x1b[0m"
                        else:
                            colorized_prefix += f"\x1b[90m{part}\x1b[0m"

            # Colorize URL
            colorized_url = ""
            gemini_match = re.match(r'^(https?://)(generativelanguage\.googleapis\.com)(/v1beta/models/)?([^/:]+)?(:[a-zA-Z0-9]+)?(.*)$', url)
            if gemini_match:
                protocol, host, models_path, model, action, rest = gemini_match.groups()
                colorized_url = f"\x1b[36m{protocol}\x1b[0m\x1b[1;36m{host}\x1b[0m"
                if models_path:
                    colorized_url += f"\x1b[90m{models_path}\x1b[0m"
                if model:
                    colorized_url += f"\x1b[1;35m{model}\x1b[0m"
                if action:
                    colorized_url += f"\x1b[1;33m{action}\x1b[0m"
                if rest:
                    colorized_url += f"\x1b[37m{rest}\x1b[0m"
            else:
                url_parts = re.match(r'^(https?://)([^/]+)(/.*)?$', url)
                if url_parts:
                    protocol, host, path = url_parts.groups()
                    colorized_url = f"\x1b[36m{protocol}\x1b[0m\x1b[1;36m{host}\x1b[0m"
                    if path:
                        segments = path.split('/')
                        if segments:
                            last = segments[-1]
                            pre_path = '/'.join(segments[:-1]) + '/'
                            colorized_url += f"\x1b[90m{pre_path}\x1b[0m\x1b[36m{last}\x1b[0m"
                        else:
                            colorized_url += f"\x1b[90m{path}\x1b[0m"
                else:
                    colorized_url = f"\x1b[36m{url}\x1b[0m"

            # Colorize Status
            colorized_status = ""
            if status:
                clean_status = status.strip()
                has_quotes = (clean_status.startswith('"') and clean_status.endswith('"')) or \
                             (clean_status.startswith("'") and clean_status.endswith("'"))
                inner_status = clean_status[1:-1] if has_quotes else clean_status

                http_match = re.match(r'^(HTTP/\d\.\d)\s+(\d{3})\s*(.*)$', inner_status, re.IGNORECASE)
                if http_match:
                    http_version, code, status_msg = http_match.groups()

                    if code.startswith('2'):
                        code_color = "\x1b[1;32m"
                        msg_color = "\x1b[32m"
                    elif code == '429':
                        code_color = "\x1b[1;33m"
                        msg_color = "\x1b[1;33m"
                    elif code.startswith('4'):
                        code_color = "\x1b[1;33m"
                        msg_color = "\x1b[33m"
                    elif code.startswith('5'):
                        code_color = "\x1b[1;31m"
                        msg_color = "\x1b[31m"
                    else:
                        code_color = "\x1b[37m"
                        msg_color = "\x1b[37m"

                    inner_colorized = f"\x1b[36m{http_version}\x1b[0m {code_color}{code}\x1b[0m"
                    if status_msg:
                        inner_colorized += f" {msg_color}{status_msg}\x1b[0m"

                    quotes_color = "\x1b[90m"
                    if has_quotes:
                        colorized_status = f" {quotes_color}\"{inner_colorized}{quotes_color}\""
                    else:
                        colorized_status = f" {inner_colorized}"
                else:
                    if re.match(r'^\d{3}$', inner_status):
                        if inner_status.startswith('2'):
                            code_color = "\x1b[1;32m"
                        elif inner_status == '429':
                            code_color = "\x1b[1;33m"
                        elif inner_status.startswith('4'):
                            code_color = "\x1b[1;33m"
                        elif inner_status.startswith('5'):
                            code_color = "\x1b[1;31m"
                        else:
                            code_color = "\x1b[37m"

                        quotes_color = "\x1b[90m"
                        if has_quotes:
                            colorized_status = f" {quotes_color}\"{code_color}{inner_status}\x1b[0m{quotes_color}\""
                        else:
                            colorized_status = f" {code_color}{inner_status}\x1b[0m"
                    else:
                        colorized_status = f" \x1b[33m{status}\x1b[0m"

            # Suffix
            colorized_suffix = f"\x1b[90m{suffix}\x1b[0m" if suffix else ""

            return f"{colorized_prefix}{colorized_url}{colorized_status}{colorized_suffix}"

        # 3. Standalone colorization fallback when no URL is present
        if "HTTP Request" in message or "httpx" in message:
            standalone_http_regex = re.compile(
                r'^(.*?)\b(POST|GET|PUT|DELETE)\b(.*)$',
                re.IGNORECASE
            )
            st_match = standalone_http_regex.match(message)
            if st_match:
                prefix, method, suffix = st_match.groups()

                # Colorize prefix
                colorized_prefix = ""
                if prefix:
                    parts = re.split(r'(\s+|:|\[|\])', prefix)
                    for part in parts:
                        if not part:
                            continue
                        if part.isspace():
                            colorized_prefix += part
                        elif part == "INFO":
                            colorized_prefix += f"\x1b[90m{part}\x1b[0m"
                        elif part == "httpx":
                            colorized_prefix += f"\x1b[95m{part}\x1b[0m"
                        elif part == "HTTP":
                            colorized_prefix += f"\x1b[35m{part}\x1b[0m"
                        elif part == "Request":
                            colorized_prefix += f"\x1b[35m{part}\x1b[0m"
                        elif part in (":", "[", "]"):
                            colorized_prefix += f"\x1b[90m{part}\x1b[0m"
                        else:
                            colorized_prefix += f"\x1b[90m{part}\x1b[0m"

                method_upper = method.upper()
                if method_upper == "POST":
                    method_colorized = f"\x1b[1;33m{method}\x1b[0m"
                elif method_upper == "GET":
                    method_colorized = f"\x1b[1;32m{method}\x1b[0m"
                elif method_upper == "PUT":
                    method_colorized = f"\x1b[1;34m{method}\x1b[0m"
                elif method_upper == "DELETE":
                    method_colorized = f"\x1b[1;31m{method}\x1b[0m"
                else:
                    method_colorized = f"\x1b[1;35m{method}\x1b[0m"

                colorized_suffix = f"\x1b[90m{suffix}\x1b[0m" if suffix else ""
                return f"{colorized_prefix}{method_colorized}{colorized_suffix}"

        return message

    def format(self, record):
        orig_msg = record.msg
        if self.use_colors and isinstance(record.msg, str):
            record.msg = self.colorize_message(record.msg)

        if self.use_colors:
            color = self.COLORS.get(record.levelname, '')
            grey = '\x1b[90m'
            magenta = '\x1b[35m'
            blue = '\x1b[94m'
            log_fmt = f"{grey}%(asctime)s{self.RESET} {magenta}[BACKEND]{self.RESET} [{color}%(levelname)s{self.RESET}] {blue}[%(filename)s]{self.RESET} %(message)s"
        else:
            log_fmt = "%(asctime)s [BACKEND] [%(levelname)s] [%(filename)s] %(message)s"
        formatter = logging.Formatter(log_fmt, datefmt="%H:%M:%S")
        result = formatter.format(record)

        # Restore original message to avoid side effects
        record.msg = orig_msg
        if hasattr(record, 'message'):
            delattr(record, 'message')

        return result


# ─── Global SSE Buffer ────────────────────────────────────────────────────────
MAX_LOGS = 500
log_buffer = deque(maxlen=MAX_LOGS)
log_seq = 0
listeners = set()

# ANSI escape sequence remover
ANSI_ESCAPE = re.compile(r'\x1b\[[0-9;]*[mK]')


class UIStreamLogHandler(logging.Handler):
    def emit(self, record):
        global log_seq
        try:
            timestamp = time.strftime("%H:%M:%S", time.localtime(record.created))
            msg = record.getMessage()
            clean_msg = ANSI_ESCAPE.sub('', msg)

            # Determine Module & Level
            module = "System"
            if record.name.startswith("sonikoma."):
                module = record.name.split(".")[1].capitalize()
                # Map related modules to "Media" for better grouping
                if module in ("Video", "Audio", "Stitch", "Stitcher", "Moviepy"):
                    module = "Media"
                elif module in ("Db", "Database"):
                    module = "Database"
            elif record.name == "sonikoma":
                module = "App"
            elif "uvicorn" in record.name:
                module = "API"

            # Special case for Vite/Frontend logs
            if record.name == "sonikoma.vite":
                module = "Frontend"

            level = record.levelname

            log_seq += 1
            entry = {
                "id": log_seq,
                "timestamp": timestamp,
                "message": clean_msg,
                "level": level,
                "module": module
            }

            # Collect context metadata
            correlation_id = getattr(record, 'correlation_id', None)
            user_id = getattr(record, 'user_id', None)
            snapshot = getattr(record, 'snapshot', None)

            if correlation_id: entry["correlation_id"] = correlation_id
            if user_id: entry["user_id"] = user_id

            # Auto-capture snapshot for errors if not provided
            if not snapshot and level in ("ERROR", "CRITICAL"):
                try:
                    from core.system import get_engine_snapshot
                    snapshot = get_engine_snapshot()
                except:
                    pass

            if snapshot: entry["snapshot"] = snapshot

            log_buffer.append(entry)

            # Persist to Database asynchronously (lazy import to avoid circular)
            try:
                from database.db import insert_system_log
                insert_system_log(
                    level,
                    module,
                    clean_msg,
                    correlation_id=correlation_id,
                    user_id=user_id,
                    snapshot=json.dumps(snapshot) if snapshot else None
                )
            except Exception:
                pass

            # Notify active SSE stream listeners
            for listener in list(listeners):
                try:
                    listener(entry)
                except Exception:
                    pass
        except Exception:
            pass


class EndpointFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        try:
            msg = record.getMessage()
            if any(path in msg for path in ["/system-logs", "/api/metrics", "/api/health", "/metrics", "/health"]):
                return False
        except Exception:
            pass
        return True


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
