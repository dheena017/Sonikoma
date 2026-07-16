import psutil
import platform
import os
import time

def get_engine_snapshot():
    """
    Returns a dictionary containing a snapshot of the current hardware and process state.
    Used for attaching diagnostic metadata to error logs.
    """
    try:
        process = psutil.Process(os.getpid())
        return {
            "platform": {
                "system": platform.system(),
                "release": platform.release(),
                "version": platform.version(),
                "machine": platform.machine()
            },
            "system": {
                "cpu_percent": psutil.cpu_percent(interval=None),
                "memory_percent": psutil.virtual_memory().percent,
                "disk_usage": psutil.disk_usage('/').percent
            },
            "process": {
                "memory_rss_mb": round(process.memory_info().rss / (1024 * 1024), 2),
                "threads": process.num_threads(),
                "uptime_sec": round(time.time() - process.create_time(), 2)
            }
        }
    except Exception:
        return {"error": "Failed to capture system snapshot"}
