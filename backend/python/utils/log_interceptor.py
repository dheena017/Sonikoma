"""
backend/python/utils/log_interceptor.py
─────────────────────────────────────────────────────────────────────────────
Intercepts Python logging globally.
Stores logs in a rolling buffer and supports SSE streaming / JSON polling.
─────────────────────────────────────────────────────────────────────────────
"""

import time
import logging
import re
from collections import deque
from typing import List, Dict, Any, Callable

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
            raw_msg = self.format(record)
            clean_msg = ANSI_ESCAPE.sub('', raw_msg)
            
            # Determine prefix category tag matching Express logInterceptor
            prefix = "[Backend]"
            if record.levelname == "WARNING" or record.levelname == "WARN":
                prefix = "[WARNING]"
            elif record.levelname in ("ERROR", "CRITICAL", "FATAL"):
                prefix = "[ERROR]"
                
            # Prepend category tag if message doesn't start with a bracket prefix
            if not clean_msg.startswith("["):
                formatted_msg = f"{prefix} {clean_msg}"
            else:
                formatted_msg = clean_msg

            log_seq += 1
            entry = {
                "id": log_seq,
                "timestamp": time.strftime("%H:%M:%S", time.localtime(record.created)),
                "message": formatted_msg
            }
            
            log_buffer.append(entry)
            
            # Notify active SSE stream listeners
            for listener in list(listeners):
                try:
                    listener(entry)
                except Exception:
                    pass
        except Exception:
            self.handleError(record)

# Initialize and attach globally to Python root logger
ui_log_handler = UIStreamLogHandler()
ui_log_handler.setFormatter(logging.Formatter("%(name)s — %(message)s"))
ui_log_handler.setLevel(logging.INFO)
logging.getLogger().addHandler(ui_log_handler)


def get_logs(since: int = 0) -> List[Dict[str, Any]]:
    """Get all logs generated since a given sequence number."""
    return [entry for entry in log_buffer if entry["id"] > since]


def add_log_listener(listener: Callable[[Dict[str, Any]], None]) -> None:
    """Register listener for live SSE stream notifications."""
    listeners.add(listener)


def remove_log_listener(listener: Callable[[Dict[str, Any]], None]) -> None:
    """Deregister active listener."""
    listeners.discard(listener)
