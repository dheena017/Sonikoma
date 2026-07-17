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
