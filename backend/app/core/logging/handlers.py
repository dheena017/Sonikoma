"""
backend/app/core/logging/handlers.py
─────────────────────────────────────────────────────────────────────────────
SSE Log stream buffer and UI logging handler.
─────────────────────────────────────────────────────────────────────────────
"""

import time
import re
import json
import logging
from collections import deque

MAX_LOGS = 500
log_buffer = deque(maxlen=MAX_LOGS)
log_seq = 0
listeners = set()

# ANSI escape sequence remover
ANSI_ESCAPE = re.compile(r'\x1b\[[0-9;]*[mK]')

# Track last log message to suppress rapid infinite loop duplicates
_last_emitted_msg = ""
_last_emitted_time = 0.0
_repeat_count = 0


class UIStreamLogHandler(logging.Handler):
    """Logging handler streaming structured entries to UI log buffer and database."""

    def emit(self, record):
        global log_seq, _last_emitted_msg, _last_emitted_time, _repeat_count
        try:
            from app.core.logging.filters import EndpointFilter
            if not EndpointFilter().filter(record):
                return

            msg = record.getMessage()
            clean_msg = ANSI_ESCAPE.sub('', msg)

            # Suppress rapid duplicate loop messages (drop any identical message within 3s)
            now = time.time()
            if clean_msg == _last_emitted_msg and (now - _last_emitted_time) < 3.0:
                _repeat_count += 1
                return
            else:
                _last_emitted_msg = clean_msg
                _last_emitted_time = now
                _repeat_count = 0

            timestamp = time.strftime("%H:%M:%S", time.localtime(record.created))

            # Determine Module & Level
            module = "System"
            if record.name.startswith("sonikoma."):
                module = record.name.split(".")[1].capitalize()
                if module in ("Video", "Audio", "Stitch", "Stitcher", "Moviepy"):
                    module = "Media"
                elif module in ("Db", "Database"):
                    module = "Database"
            elif record.name == "sonikoma":
                module = "App"
            elif "uvicorn" in record.name:
                module = "API"

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

            if correlation_id:
                entry["correlation_id"] = correlation_id
            if user_id:
                entry["user_id"] = user_id

            # Auto-capture snapshot for errors if not provided
            if not snapshot and level in ("ERROR", "CRITICAL"):
                try:
                    from app.core.system import get_engine_snapshot
                    snapshot = get_engine_snapshot()
                except Exception:
                    pass

            if snapshot:
                entry["snapshot"] = snapshot

            log_buffer.append(entry)

            # Persist to Database asynchronously (lazy import to avoid circular dependency)
            try:
                from app.repositories.system.logs import insert_system_log
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
