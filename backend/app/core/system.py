"""
backend/core/system.py
─────────────────────────────────────────────────────────────────────────────
System diagnostics and process hardware snapshot helper.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import platform
import time
from typing import Any, Dict

import psutil


def get_engine_snapshot() -> Dict[str, Any]:
    """Return a compact OS/process snapshot for diagnostics and error logs."""
    try:
        process = psutil.Process(os.getpid())
        storage_root = os.path.abspath(os.sep)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage(storage_root)

        return {
            "platform": {
                "system": platform.system(),
                "release": platform.release(),
                "version": platform.version(),
                "machine": platform.machine(),
            },
            "system": {
                "cpu_percent": psutil.cpu_percent(interval=None),
                "memory_percent": memory.percent,
                "disk_usage": disk.percent,
            },
            "process": {
                "memory_rss_mb": round(process.memory_info().rss / (1024 * 1024), 2),
                "threads": process.num_threads(),
                "uptime_sec": round(time.time() - process.create_time(), 2),
            },
        }
    except Exception:
        return {"error": "Failed to capture system snapshot"}


__all__ = ["get_engine_snapshot"]
