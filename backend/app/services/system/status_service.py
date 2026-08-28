"""
backend/app/services/system/status_service.py
─────────────────────────────────────────────────────────────────────────────
Comprehensive diagnostic telemetry service gathering authentic, real-time
server runtime metrics, hardware resource loads, database statistics,
storage breakdown, LRU cache performance, AI provider availability,
and background job queue state.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import sys
import time
import shutil
import platform
import subprocess
import datetime
from typing import Dict, Any, Optional, List

from app.core.config import NODE_ENV, BACKEND_PORT, API_VERSION, PROJECT_ROOT
from app.core.cache import get_all_cache_stats
from app.database.config import DB_PATH
from app.database.engine import get_db_connection
from app.schemas.health import (
    BackendStatusResponse,
    ServerRuntimeStatus,
    SystemResourcesStatus,
    CPUUsageStatus,
    MemoryUsageStatus,
    GPUUsageStatus,
    DatabaseHealthStatus,
    DatabaseTableCounts,
    StorageStatus,
    DiskPartitionStatus,
    StorageFolderStatus,
    AIProvidersStatus,
    EngineCapabilitiesStatus,
    CapabilityDetail,
    JobQueueStatus,
    RecentJobSummary,
)

# Record application launch timestamp
START_TIME = time.time()
START_DATETIME = datetime.datetime.fromtimestamp(START_TIME, datetime.timezone.utc).isoformat()

import threading
import socket

# Cache FFmpeg probe result for 60 seconds to prevent unnecessary process spawns
_FFMPEG_CACHE: Dict[str, Any] = {"version": None, "available": False, "last_checked": 0}
_MODULE_CACHE: Dict[str, CapabilityDetail] = {}
_NETWORK_CACHE: Dict[str, Any] = {"online": True, "dns": True, "latency": 10.0, "last_checked": 0}


def _probe_network() -> NetworkStatus:
    """Authentically probes DNS resolution and outbound TCP connectivity."""
    now = time.time()
    if _NETWORK_CACHE["last_checked"] > 0 and (now - _NETWORK_CACHE["last_checked"] < 60):
        return NetworkStatus(
            online=_NETWORK_CACHE["online"],
            outbound_checked=True,
            dns_resolvable=_NETWORK_CACHE["dns"],
            probe_latency_ms=_NETWORK_CACHE["latency"]
        )

    t0 = time.perf_counter()
    dns_ok = False
    online_ok = False
    latency_val = None

    try:
        # Fast DNS lookup
        ip = socket.gethostbyname("dns.google")
        dns_ok = True
        # Fast socket connect to port 53 (DNS) or 443 (HTTPS)
        with socket.create_connection((ip, 53), timeout=1.5):
            online_ok = True
            latency_val = round((time.perf_counter() - t0) * 1000, 2)
    except Exception:
        pass

    _NETWORK_CACHE["online"] = online_ok
    _NETWORK_CACHE["dns"] = dns_ok
    _NETWORK_CACHE["latency"] = latency_val
    _NETWORK_CACHE["last_checked"] = now

    return NetworkStatus(
        online=online_ok,
        outbound_checked=True,
        dns_resolvable=dns_ok,
        probe_latency_ms=latency_val
    )


def _probe_ffmpeg() -> CapabilityDetail:
    """Authentically probe FFmpeg binary on the system PATH."""
    now = time.time()
    if _FFMPEG_CACHE["last_checked"] > 0 and (now - _FFMPEG_CACHE["last_checked"] < 60):
        return CapabilityDetail(
            available=_FFMPEG_CACHE["available"],
            version=_FFMPEG_CACHE["version"]
        )

    try:
        proc = subprocess.run(["ffmpeg", "-version"], capture_output=True, text=True, timeout=3)
        if proc.returncode == 0 and proc.stdout:
            version_line = proc.stdout.splitlines()[0]
            _FFMPEG_CACHE["available"] = True
            _FFMPEG_CACHE["version"] = version_line
            _FFMPEG_CACHE["last_checked"] = now
            return CapabilityDetail(available=True, version=version_line)
    except Exception as e:
        _FFMPEG_CACHE["available"] = False
        _FFMPEG_CACHE["version"] = None
        _FFMPEG_CACHE["last_checked"] = now
        return CapabilityDetail(available=False, details=str(e))

    _FFMPEG_CACHE["available"] = False
    _FFMPEG_CACHE["version"] = None
    _FFMPEG_CACHE["last_checked"] = now
    return CapabilityDetail(available=False, details="Binary not found on PATH")


def _probe_python_module(module_name: str) -> CapabilityDetail:
    """Authentically probe a Python module version and availability."""
    if module_name in _MODULE_CACHE:
        return _MODULE_CACHE[module_name]

    try:
        mod = __import__(module_name)
        version = getattr(mod, "__version__", None)
        if version is None and hasattr(mod, "VERSION"):
            version = str(getattr(mod, "VERSION"))
        res = CapabilityDetail(
            available=True,
            version=str(version) if version else "installed"
        )
        _MODULE_CACHE[module_name] = res
        return res
    except Exception as e:
        res = CapabilityDetail(
            available=False,
            details=str(e)
        )
        _MODULE_CACHE[module_name] = res
        return res


def _probe_gpu() -> GPUUsageStatus:
    """Authentically inspect GPU/CUDA availability and VRAM allocation."""
    devices: List[Dict[str, Any]] = []
    cuda_available = False
    driver_version = None
    cuda_version = None

    try:
        import torch
        cuda_available = bool(torch.cuda.is_available())
        if cuda_available:
            cuda_version = getattr(torch.version, "cuda", None)
            device_count = torch.cuda.device_count()
            for i in range(device_count):
                props = torch.cuda.get_device_properties(i)
                total_mb = round(props.total_memory / (1024 * 1024), 2)
                allocated_mb = round(torch.cuda.memory_allocated(i) / (1024 * 1024), 2)
                reserved_mb = round(torch.cuda.memory_reserved(i) / (1024 * 1024), 2)
                devices.append({
                    "index": i,
                    "name": props.name,
                    "total_memory_mb": total_mb,
                    "allocated_memory_mb": allocated_mb,
                    "reserved_memory_mb": reserved_mb,
                    "free_memory_mb": round(total_mb - allocated_mb, 2),
                    "multi_processor_count": getattr(props, "multi_processor_count", None),
                })
            return GPUUsageStatus(
                available=True,
                device_count=device_count,
                devices=devices,
                cuda_version=cuda_version,
            )
    except Exception:
        pass

    # Fallback probe via nvidia-smi if torch not installed or CPU-only
    try:
        proc = subprocess.run(
            ["nvidia-smi", "--query-gpu=name,memory.total,memory.used,driver_version", "--format=csv,noheader,nounits"],
            capture_output=True,
            text=True,
            timeout=2
        )
        if proc.returncode == 0 and proc.stdout:
            lines = [l.strip() for l in proc.stdout.strip().splitlines() if l.strip()]
            for idx, line in enumerate(lines):
                parts = [p.strip() for p in line.split(",")]
                if len(parts) >= 4:
                    name, total, used, drv = parts[0], float(parts[1]), float(parts[2]), parts[3]
                    driver_version = drv
                    devices.append({
                        "index": idx,
                        "name": name,
                        "total_memory_mb": total,
                        "allocated_memory_mb": used,
                        "free_memory_mb": round(total - used, 2)
                    })
            if devices:
                return GPUUsageStatus(
                    available=True,
                    device_count=len(devices),
                    devices=devices,
                    driver_version=driver_version
                )
    except Exception:
        pass

    return GPUUsageStatus(
        available=False,
        device_count=0,
        devices=[],
        cuda_version=None
    )


def _get_dir_stats(path: str) -> StorageFolderStatus:
    """Calculates authentic file count and size in bytes for a directory."""
    abs_path = os.path.abspath(path)
    if not os.path.exists(abs_path):
        return StorageFolderStatus(path=abs_path, exists=False, size_bytes=0, file_count=0)

    total_size = 0
    count = 0
    try:
        for root, _, files in os.walk(abs_path):
            for f in files:
                fp = os.path.join(root, f)
                if not os.path.islink(fp):
                    try:
                        total_size += os.path.getsize(fp)
                        count += 1
                    except OSError:
                        pass
    except Exception:
        pass

    return StorageFolderStatus(
        path=abs_path,
        exists=True,
        size_bytes=total_size,
        file_count=count
    )


def get_comprehensive_backend_status(
    gemini_key_override: Optional[str] = None,
    huggingface_key_override: Optional[str] = None,
    openai_key_override: Optional[str] = None,
    anthropic_key_override: Optional[str] = None,
) -> BackendStatusResponse:
    """Gathers 100% real-time diagnostic status and telemetry data."""
    now_ts = time.time()
    uptime_sec = round(now_ts - START_TIME, 1)
    h = int(uptime_sec // 3600)
    m = int((uptime_sec % 3600) // 60)
    s = int(uptime_sec % 60)
    uptime_str = f"{h}h {m}m {s}s"
    current_iso = datetime.datetime.fromtimestamp(now_ts, datetime.timezone.utc).isoformat()

    # 1. Resource metrics (CPU & Memory)
    cpu_usage = 0.0
    cores_logical = os.cpu_count() or 1
    cores_physical = None
    per_cpu: List[float] = []

    rss_mb = 0.0
    total_mem_mb = 0.0
    used_mem_mb = 0.0
    avail_mem_mb = 0.0
    used_mem_pct = 0.0

    try:
        import psutil
        process = psutil.Process(os.getpid())
        cpu_usage = psutil.cpu_percent(interval=0.05)
        cores_logical = psutil.cpu_count(logical=True) or cores_logical
        cores_physical = psutil.cpu_count(logical=False)
        per_cpu = psutil.cpu_percent(percpu=True) or []

        mem_info = process.memory_info()
        rss_mb = round(mem_info.rss / (1024 * 1024), 2)
        vmem = psutil.virtual_memory()
        total_mem_mb = round(vmem.total / (1024 * 1024), 2)
        used_mem_mb = round(vmem.used / (1024 * 1024), 2)
        avail_mem_mb = round(vmem.available / (1024 * 1024), 2)
        used_mem_pct = float(vmem.percent)
    except Exception:
        try:
            import resource
            rss_mb = round(resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / 1024, 2)
        except Exception:
            pass

    # 2. GPU Telemetry
    gpu_status = _probe_gpu()

    # 3. Database Statistics & Latency
    db_status = "connected"
    db_latency_ms = 0.0
    db_integrity = "ok"
    counts = DatabaseTableCounts()
    db_file_size = 0

    try:
        if os.path.exists(DB_PATH):
            db_file_size = os.path.getsize(DB_PATH)
    except Exception:
        pass

    try:
        t0 = time.perf_counter()
        conn = get_db_connection()
        # Latency check
        conn.execute("SELECT 1").fetchone()
        db_latency_ms = round((time.perf_counter() - t0) * 1000, 2)

        # Integrity check
        try:
            row_int = conn.execute("PRAGMA integrity_check").fetchone()
            if row_int and isinstance(row_int[0], str) and row_int[0].lower() != "ok":
                db_integrity = row_int[0]
        except Exception:
            pass

        # Real Table Counts
        def _get_count(table: str) -> int:
            try:
                r = conn.execute(f"SELECT COUNT(*) as c FROM {table}").fetchone()
                return int(r["c"] if r and "c" in r else (r[0] if r else 0))
            except Exception:
                return 0

        counts.users = _get_count("users")
        counts.series = _get_count("series")
        counts.chapters = _get_count("chapters")
        counts.panels = _get_count("panels")
        counts.jobs = _get_count("jobs")
        counts.scrape_sessions = _get_count("scrape_sessions")
        counts.system_logs = _get_count("system_logs")
        counts.token_usage_logs = _get_count("token_usage_logs")
        counts.credit_transactions = _get_count("credit_transactions")

        # SQLite Pragmas
        db_journal_mode = None
        db_page_size = None
        db_page_count = None
        try:
            jm_row = conn.execute("PRAGMA journal_mode").fetchone()
            if jm_row: db_journal_mode = str(jm_row[0])
            ps_row = conn.execute("PRAGMA page_size").fetchone()
            if ps_row: db_page_size = int(ps_row[0])
            pc_row = conn.execute("PRAGMA page_count").fetchone()
            if pc_row: db_page_count = int(pc_row[0])
        except Exception:
            pass

        conn.close()
    except Exception as e:
        db_status = f"error: {e}"
        db_integrity = "failed"
        db_journal_mode = None
        db_page_size = None
        db_page_count = None

    # 4. Storage & Partitions
    root_path = PROJECT_ROOT
    disk_total = 0
    disk_used = 0
    disk_free = 0
    disk_pct = 0.0
    try:
        usage = shutil.disk_usage(root_path)
        disk_total = usage.total
        disk_used = usage.used
        disk_free = usage.free
        disk_pct = round((usage.used / usage.total) * 100, 1) if usage.total > 0 else 0.0
    except Exception:
        pass

    dirs_to_inspect = {
        "media": os.path.join(root_path, "data", "media"),
        "local_media": os.path.join(root_path, "data", "local_media"),
        "temp": os.path.join(root_path, "data", "temp"),
        "image_cache": os.path.join(root_path, "data", "image_cache"),
        "training_data": os.path.join(root_path, "data", "training_data"),
        "exports": os.path.join(root_path, "public", "exports"),
    }

    dir_stats = {name: _get_dir_stats(p) for name, p in dirs_to_inspect.items()}
    total_app_storage = sum(d.size_bytes for d in dir_stats.values()) + db_file_size

    # 5. AI Providers & Keys
    ai_status = AIProvidersStatus(
        gemini=bool(gemini_key_override or os.getenv("GEMINI_API_KEY")),
        openai=bool(openai_key_override or os.getenv("OPENAI_API_KEY")),
        anthropic=bool(anthropic_key_override or os.getenv("ANTHROPIC_API_KEY")),
        huggingface=bool(huggingface_key_override or os.getenv("HUGGINGFACE_API_KEY")),
        youtube_oauth=bool(os.getenv("YOUTUBE_CLIENT_ID") and os.getenv("YOUTUBE_CLIENT_SECRET")),
    )

    # 6. Engine & Processing Capabilities
    yolo_model_path = os.path.join(root_path, "yolov8n-seg.pt")
    models_info = {
        "yolov8n_seg": {
            "path": yolo_model_path,
            "exists": os.path.exists(yolo_model_path),
            "size_bytes": os.path.getsize(yolo_model_path) if os.path.exists(yolo_model_path) else 0,
        }
    }

    capabilities = EngineCapabilitiesStatus(
        ffmpeg=_probe_ffmpeg(),
        opencv=_probe_python_module("cv2"),
        pillow=_probe_python_module("PIL"),
        numpy=_probe_python_module("numpy"),
        moviepy=_probe_python_module("moviepy"),
        edge_tts=_probe_python_module("edge_tts"),
        pydub=_probe_python_module("pydub"),
        easyocr=_probe_python_module("easyocr"),
        google_genai=_probe_python_module("google.genai"),
        httpx=_probe_python_module("httpx"),
        torch=_probe_python_module("torch"),
        ultralytics=_probe_python_module("ultralytics"),
        models=models_info,
    )

    # 7. Job Queue Statistics & Recent Executions
    job_queue = JobQueueStatus()
    try:
        conn = get_db_connection()
        status_rows = conn.execute("SELECT status, COUNT(*) as c FROM jobs GROUP BY status").fetchall()
        for r in status_rows:
            st = str(r["status"]).upper()
            cnt = int(r["c"])
            if st == "QUEUED":
                job_queue.queued = cnt
            elif st == "RUNNING" or st == "PROCESSING":
                job_queue.running = cnt
            elif st == "COMPLETED" or st == "SUCCESS":
                job_queue.completed = cnt
            elif st == "FAILED" or st == "ERROR":
                job_queue.failed = cnt
            elif st == "CANCELLED":
                job_queue.cancelled = cnt

        job_queue.total_jobs = sum([job_queue.queued, job_queue.running, job_queue.completed, job_queue.failed, job_queue.cancelled])

        recent_rows = conn.execute(
            "SELECT id, type, status, progress, stage, created_at, completed_at FROM jobs ORDER BY created_at DESC LIMIT 5"
        ).fetchall()
        for r in recent_rows:
            job_queue.recent_jobs.append(
                RecentJobSummary(
                    job_id=str(r["id"]),
                    type=str(r["type"]),
                    status=str(r["status"]),
                    progress=float(r["progress"] or 0.0),
                    stage=str(r["stage"] or ""),
                    created_at=str(r["created_at"] or ""),
                    completed_at=r["completed_at"] if r["completed_at"] else None,
                )
            )
        conn.close()
    except Exception:
        pass

    # Overall system health evaluation
    overall_status = "operational"
    if "error" in db_status:
        overall_status = "degraded"
    if cpu_usage > 95.0 or (used_mem_pct > 95.0 and total_mem_mb > 0):
        overall_status = "degraded"

    return BackendStatusResponse(
        success=True,
        timestamp=current_iso,
        server=ServerRuntimeStatus(
            service="Sonikoma Computational Backend",
            version=str(API_VERSION),
            status=overall_status,
            uptime=uptime_str,
            uptime_seconds=uptime_sec,
            started_at=START_DATETIME,
            current_time=current_iso,
            environment=NODE_ENV,
            python_version=sys.version.split(" ")[0],
            platform=f"{platform.system()} {platform.release()} ({platform.machine()})",
            process_id=os.getpid(),
            active_threads=threading.active_count(),
            working_directory=os.path.abspath(os.getcwd()),
            backend_port=BACKEND_PORT,
        ),
        resources=SystemResourcesStatus(
            cpu=CPUUsageStatus(
                usage_percent=cpu_usage,
                cores_logical=cores_logical,
                cores_physical=cores_physical,
                per_cpu_percent=per_cpu,
            ),
            memory=MemoryUsageStatus(
                rss_mb=rss_mb,
                total_mb=total_mem_mb,
                used_mb=used_mem_mb,
                available_mb=avail_mem_mb,
                used_percent=used_mem_pct,
            ),
            gpu=gpu_status,
        ),
        network=_probe_network(),
        database=DatabaseHealthStatus(
            status=db_status,
            engine="SQLite (local)",
            database_path=os.path.abspath(DB_PATH),
            file_size_bytes=db_file_size,
            latency_ms=db_latency_ms,
            integrity=db_integrity,
            journal_mode=db_journal_mode,
            page_size=db_page_size,
            page_count=db_page_count,
            counts=counts,
        ),
        storage=StorageStatus(
            disk_partition=DiskPartitionStatus(
                mount_point=os.path.abspath(root_path),
                total_bytes=disk_total,
                used_bytes=disk_used,
                free_bytes=disk_free,
                used_percent=disk_pct,
            ),
            directories=dir_stats,
            total_app_storage_bytes=total_app_storage,
        ),
        caches=get_all_cache_stats(),
        ai_providers=ai_status,
        capabilities=capabilities,
        job_queue=job_queue,
    )
