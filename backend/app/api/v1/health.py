"""
backend/app/api/v1/health.py
─────────────────────────────────────────────────────────────────────────────
Health Check, Capability Probe, and Real-Time SSE Log Streaming routes.
Acts as a thin controller delegating database/system operations to repositories.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import sys
import time
import json
import asyncio
import platform
import logging
import subprocess
from typing import Optional

from fastapi import APIRouter, Request, Query, HTTPException, Header, Depends
from fastapi.responses import JSONResponse, StreamingResponse

from routes.auth_routes import get_admin_user
from utils.log_interceptor import get_logs, add_log_listener, remove_log_listener
from utils.cache import get_all_cache_stats, get_total_storage_size_bytes
from config.ports import BACKEND_PORT
from schemas.health import CustomLogPayload

# Import repository functions directly
from repositories.system_repository import (
    get_db_stats,
    get_system_logs,
    wipe_system_logs
)
from infrastructure.database.connection import get_db_connection

logger = logging.getLogger("sonikoma.routes.health")
health_router = APIRouter()
router = health_router

START_TIME = time.time()


def _check_capability(module_name: str) -> bool:
    """Returns True if the given Python module can be imported."""
    try:
        __import__(module_name)
        return True
    except ImportError:
        return False


# ─── Routes ───────────────────────────────────────────────────────────────────

@router.get("/health", summary="Health check and capability probe")
async def health(
    x_user_gemini_key: str = Header(None, alias="X-User-Gemini-Key"),
    x_user_huggingface_key: str = Header(None, alias="X-User-Huggingface-Key"),
    x_user_openai_key: str = Header(None, alias="X-User-Openai-Key"),
    x_user_anthropic_key: str = Header(None, alias="X-User-Anthropic-Key"),
):
    uptime_sec = round(time.time() - START_TIME, 1)
    h = int(uptime_sec // 3600)
    m = int((uptime_sec % 3600) // 60)
    s = int(uptime_sec % 60)

    db_status = "connected"
    db_stats = {}
    try:
        db_stats = get_db_stats()
    except Exception:
        db_status = "error"

    return JSONResponse(
        content={
            "success": True,
            "status": "ok",
            "service": "Sonikoma Computational Backend",
            "version": os.getenv("API_VERSION", "1.0.0"),
            "uptime": f"{h}h {m}m {s}s",
            "uptimeSeconds": uptime_sec,
            "database": db_status,
            "db_type": "SQLite (local)",
            "db_stats": db_stats,
            "python": sys.version.split(" ")[0],
            "platform": f"{platform.system()} {platform.machine()}",
            "capabilities": {
                "cv2":         _check_capability("cv2"),
                "PIL":         _check_capability("PIL"),
                "numpy":       _check_capability("numpy"),
                "moviepy":     _check_capability("moviepy"),
                "edge_tts":    _check_capability("edge_tts"),
                "pydub":       _check_capability("pydub"),
                "easyocr":     _check_capability("easyocr"),
                "httpx":       _check_capability("httpx"),
                "google_genai":_check_capability("google.genai"),
            },
            "env": {
                "GEMINI_API_KEY": bool(x_user_gemini_key or os.getenv("GEMINI_API_KEY")),
                "HUGGINGFACE_API_KEY": bool(x_user_huggingface_key or os.getenv("HUGGINGFACE_API_KEY")),
                "OPENAI_API_KEY": bool(x_user_openai_key or os.getenv("OPENAI_API_KEY")),
                "ANTHROPIC_API_KEY": bool(x_user_anthropic_key or os.getenv("ANTHROPIC_API_KEY")),
            },
        }
    )


@router.get("/system-logs", summary="Diagnostic logs retrieval with historical support")
async def system_logs(
    since: int = Query(0, description="Fetch ephemeral logs generated after this sequence ID"),
    limit: int = Query(200, description="Max records to return for historical query"),
    offset: int = Query(0, description="Offset for historical query"),
    level: Optional[str] = Query(None, description="Filter by log level"),
    module: Optional[str] = Query(None, description="Filter by module"),
    search: Optional[str] = Query(None, description="Text search in message or details")
):
    try:
        if level or module or search or offset > 0:
            logs = get_system_logs(limit, offset, level, module, search)
            return {"success": True, "logs": logs, "historical": True}

        logs = get_logs(since)
        return {"success": True, "logs": logs, "historical": False}
    except Exception as e:
        logger.error(f"Failed to fetch system logs: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/system-logs", summary="Wipe all persistent system logs")
async def clear_system_logs():
    try:
        wipe_system_logs()
        return {"success": True, "message": "Persistent system logs wiped successfully."}
    except Exception as e:
        logger.error(f"Failed to wipe system logs: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/system-logs/log", summary="Post a custom log entry to system logs")
async def add_custom_log(payload: CustomLogPayload):
    try:
        vite_logger = logging.getLogger("sonikoma.vite")
        lvl = payload.level.upper()
        if lvl == "ERROR":
            vite_logger.error(payload.message)
        elif lvl == "WARNING" or lvl == "WARN":
            vite_logger.warning(payload.message)
        else:
            vite_logger.info(payload.message)
        return {"success": True}
    except Exception as e:
        logger.error(f"Failed to add custom log: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/system-logs/stream", summary="Server-Sent Events (SSE) real-time console log stream")
async def system_logs_stream(request: Request):
    loop = asyncio.get_running_loop()

    async def log_generator():
        history = get_logs(0)
        for entry in history:
            yield f"data: {json.dumps(entry)}\n\n"

        queue = asyncio.Queue()

        def listener(entry):
            loop.call_soon_threadsafe(queue.put_nowait, entry)

        add_log_listener(listener)
        try:
            while True:
                if await request.is_disconnected():
                    break
                try:
                    entry = await asyncio.wait_for(queue.get(), timeout=15.0)
                    yield f"data: {json.dumps(entry)}\n\n"
                except asyncio.TimeoutError:
                    yield ": ping\n\n"
        except (asyncio.CancelledError, GeneratorExit):
            logger.debug("[System Logs Stream] Client disconnected from SSE console logs stream.")
        finally:
            remove_log_listener(listener)

    return StreamingResponse(
        log_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@router.get("/metrics", summary="Live server performance and cache metrics")
async def server_metrics():
    uptime_sec = round(time.time() - START_TIME, 1)
    h = int(uptime_sec // 3600)
    m = int((uptime_sec % 3600) // 60)
    s = int(uptime_sec % 60)

    mem_used = 0
    mem_total = 0
    mem_pct = "0.0%"
    cpu_pct = 0.0
    cpu_cores = 1

    try:
        import psutil
        process = psutil.Process(os.getpid())
        mem_used = round(process.memory_info().rss / 1024 / 1024, 2)
        mem_total = round(psutil.virtual_memory().total / 1024 / 1024, 2)
        mem_pct = f"{psutil.virtual_memory().percent}%"
        cpu_pct = psutil.cpu_percent(interval=0.1)
        cpu_cores = psutil.cpu_count(logical=True) or 1
    except Exception:
        try:
            import resource
            mem_used = round(resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / 1024, 2)
        except Exception:
            pass

    db_stats = {
        "users": 0,
        "projects": 0,
        "scenes": 0,
        "activeJobs": 0,
        "dbLatencyMs": 0,
        "gpuWorkers": {
            "total": 4,
            "busy": 1,
            "idle": 3
        }
    }
    try:
        t0 = time.time()
        db_conn = get_db_connection()

        row_u = db_conn.execute("SELECT COUNT(*) as c FROM users").fetchone()
        if row_u: db_stats["users"] = dict(row_u).get("c", 0) or dict(row_u).get("COUNT(*)", 0)

        row_p = db_conn.execute("SELECT COUNT(*) as c FROM series").fetchone()
        if row_p: db_stats["projects"] = dict(row_p).get("c", 0) or dict(row_p).get("COUNT(*)", 0)

        row_s = db_conn.execute("SELECT COUNT(*) as c FROM panels").fetchone()
        if row_s: db_stats["scenes"] = dict(row_s).get("c", 0) or dict(row_s).get("COUNT(*)", 0)

        row_a = db_conn.execute("SELECT COUNT(*) as c FROM chapters WHERE status IN ('pending', 'processing')").fetchone()
        if row_a: db_stats["activeJobs"] = dict(row_a).get("c", 0) or dict(row_a).get("COUNT(*)", 0)

        db_stats["dbLatencyMs"] = round((time.time() - t0) * 1000, 2)

        try:
            db_conn.close()
        except Exception:
            pass
    except Exception as e:
        logger.warning(f"Could not fetch DB stats: {e}")

    return {
        "server": {
            "uptime": f"{h}h {m}m {s}s",
            "uptimeSeconds": uptime_sec,
            "apiVersion": os.getenv("API_VERSION", "1.0.0"),
            "pythonVersion": sys.version.split(" ")[0],
            "platform": f"{platform.system()} {platform.machine()}",
            "env": os.getenv("NODE_ENV", "development"),
        },
        "config": {
            "port": BACKEND_PORT,
        },
        "memory": {
            "rssMB": mem_used,
            "systemTotalMB": mem_total,
            "systemUsedPct": mem_pct,
            "cpuPct": cpu_pct,
            "cpuCores": cpu_cores
        },
        "database": db_stats,
        "cache": get_all_cache_stats(),
        "storage": {
            "usedBytes": get_total_storage_size_bytes(),
            "limitBytes": 5 * 1024 * 1024 * 1024
        }
    }


@router.post("/metrics/purge-cache", summary="Force clear all backend LRU caches")
async def purge_server_caches():
    try:
        from utils.cache import stitched_cache, edit_history, zip_cache, proxy_cache
        stitched_cache.clear()
        edit_history.clear()
        zip_cache.clear()
        proxy_cache.clear()
        logger.info("[Diagnostics] All LRU memory caches manually purged via API.")
        return {"success": True, "message": "All caches cleared successfully."}
    except Exception as e:
        logger.error(f"Failed to clear caches: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/metrics/flush-temp", dependencies=[Depends(get_admin_user)], summary="Delete all temporary export and worker files")
async def flush_temp_files():
    try:
        import shutil
        dirs_to_clean = ["data/media", "data/temp", "public/exports"]
        cleaned_count = 0
        for d in dirs_to_clean:
            if os.path.exists(d):
                for f in os.listdir(d):
                    path = os.path.join(d, f)
                    try:
                        if os.path.isfile(path): os.remove(path)
                        elif os.path.isdir(path): shutil.rmtree(path)
                        cleaned_count += 1
                    except: pass
        return {"success": True, "message": f"Flushed {cleaned_count} files/folders."}
    except Exception as e:
        logger.error(f"Failed to flush temp files: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/metrics/emergency-stop", summary="Kill all background child processes (like FFmpeg)")
async def emergency_stop():
    killed_count = 0
    try:
        try:
            import psutil
        except ImportError:
            return {"success": False, "detail": "The 'psutil' Python library is required to perform process termination. Run 'pip install psutil' on the server."}

        parent = psutil.Process(os.getpid())
        for child in parent.children(recursive=True):
            try:
                child.terminate()
                killed_count += 1
            except psutil.NoSuchProcess:
                pass

        _, alive = psutil.wait_procs(parent.children(recursive=True), timeout=2)
        for p in alive:
            try:
                p.kill()
            except psutil.NoSuchProcess:
                pass

        logger.warning(f"[Diagnostics] EMERGENCY STOP EXECUTED. Killed {killed_count} active child processes.")
        return {"success": True, "message": f"Successfully terminated {killed_count} hanging process(es)."}
    except Exception as e:
        logger.error(f"Failed to execute emergency stop: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health/ffmpeg", summary="Verify FFmpeg is accessible")
async def health_ffmpeg():
    try:
        result = subprocess.run(
            ["ffmpeg", "-version"], 
            capture_output=True, 
            text=True, 
            timeout=5
        )
        if result.returncode == 0:
            version_line = result.stdout.split('\n')[0]
            return {"success": True, "status": "ok", "version": version_line}
        else:
            logger.error(f"FFmpeg check failed with code {result.returncode}: {result.stderr}")
            raise HTTPException(status_code=503, detail="FFmpeg is installed but returned an error.")
    except FileNotFoundError:
        logger.error("FFmpeg binary not found on system PATH.")
        raise HTTPException(status_code=503, detail="FFmpeg is not accessible on the system path.")
    except subprocess.TimeoutExpired:
        logger.error("FFmpeg check timed out.")
        raise HTTPException(status_code=503, detail="FFmpeg check timed out.")
    except Exception as e:
        logger.error(f"Unexpected error checking FFmpeg: {e}")
        raise HTTPException(status_code=503, detail=f"Unexpected error checking FFmpeg: {str(e)}")
