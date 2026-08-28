"""
backend/app/schemas/health.py
─────────────────────────────────────────────────────────────────────────────
Pydantic request/response schemas for system health, status, and logging.
─────────────────────────────────────────────────────────────────────────────
"""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


# =============================================================================
# 1. Custom Logging
# =============================================================================

class CustomLogPayload(BaseModel):
    """Client-side custom logging payload."""
    message: str
    level: str = "info"


# =============================================================================
# 2. Comprehensive Backend Status & Telemetry
# =============================================================================

class ServerRuntimeStatus(BaseModel):
    service: str = "Sonikoma Computational Backend"
    version: str = "1.0.0"
    status: str = "operational"  # operational | degraded | unhealthy
    uptime: str = "0h 0m 0s"
    uptime_seconds: float = 0.0
    started_at: str
    current_time: str
    environment: str = "development"
    python_version: str
    platform: str
    process_id: int
    active_threads: int = 1
    working_directory: str
    backend_port: int


class CPUUsageStatus(BaseModel):
    usage_percent: float = 0.0
    cores_logical: int = 1
    cores_physical: Optional[int] = None
    per_cpu_percent: List[float] = Field(default_factory=list)


class MemoryUsageStatus(BaseModel):
    rss_mb: float = 0.0
    total_mb: float = 0.0
    used_mb: float = 0.0
    available_mb: float = 0.0
    used_percent: float = 0.0


class GPUUsageStatus(BaseModel):
    available: bool = False
    device_count: int = 0
    devices: List[Dict[str, Any]] = Field(default_factory=list)
    driver_version: Optional[str] = None
    cuda_version: Optional[str] = None


class SystemResourcesStatus(BaseModel):
    cpu: CPUUsageStatus
    memory: MemoryUsageStatus
    gpu: GPUUsageStatus


class DatabaseTableCounts(BaseModel):
    users: int = 0
    series: int = 0
    chapters: int = 0
    panels: int = 0
    jobs: int = 0
    scrape_sessions: int = 0
    system_logs: int = 0
    token_usage_logs: int = 0
    credit_transactions: int = 0


class DatabaseHealthStatus(BaseModel):
    status: str = "connected"  # connected | error
    engine: str = "SQLite (local)"
    database_path: Optional[str] = None
    file_size_bytes: int = 0
    latency_ms: float = 0.0
    integrity: str = "ok"
    journal_mode: Optional[str] = None
    page_size: Optional[int] = None
    page_count: Optional[int] = None
    counts: DatabaseTableCounts = Field(default_factory=DatabaseTableCounts)


class StorageFolderStatus(BaseModel):
    path: str
    exists: bool = True
    size_bytes: int = 0
    file_count: int = 0


class DiskPartitionStatus(BaseModel):
    mount_point: str
    total_bytes: int = 0
    used_bytes: int = 0
    free_bytes: int = 0
    used_percent: float = 0.0


class StorageStatus(BaseModel):
    disk_partition: DiskPartitionStatus
    directories: Dict[str, StorageFolderStatus] = Field(default_factory=dict)
    total_app_storage_bytes: int = 0


class NetworkStatus(BaseModel):
    online: bool = True
    outbound_checked: bool = True
    dns_resolvable: bool = True
    probe_latency_ms: Optional[float] = None


class AIProvidersStatus(BaseModel):
    gemini: bool = False
    openai: bool = False
    anthropic: bool = False
    huggingface: bool = False
    youtube_oauth: bool = False


class CapabilityDetail(BaseModel):
    available: bool = False
    version: Optional[str] = None
    details: Optional[str] = None


class EngineCapabilitiesStatus(BaseModel):
    ffmpeg: CapabilityDetail
    opencv: CapabilityDetail
    pillow: CapabilityDetail
    numpy: CapabilityDetail
    moviepy: CapabilityDetail
    edge_tts: CapabilityDetail
    pydub: CapabilityDetail
    easyocr: CapabilityDetail
    google_genai: CapabilityDetail
    httpx: CapabilityDetail
    torch: CapabilityDetail
    ultralytics: CapabilityDetail
    models: Dict[str, Any] = Field(default_factory=dict)


class RecentJobSummary(BaseModel):
    job_id: str
    type: str
    status: str
    progress: float
    stage: str
    created_at: str
    completed_at: Optional[str] = None


class JobQueueStatus(BaseModel):
    total_jobs: int = 0
    queued: int = 0
    running: int = 0
    completed: int = 0
    failed: int = 0
    cancelled: int = 0
    recent_jobs: List[RecentJobSummary] = Field(default_factory=list)


class BackendStatusResponse(BaseModel):
    success: bool = True
    timestamp: str
    server: ServerRuntimeStatus
    resources: SystemResourcesStatus
    network: NetworkStatus = Field(default_factory=NetworkStatus)
    database: DatabaseHealthStatus
    storage: StorageStatus
    caches: Dict[str, Any] = Field(default_factory=dict)
    ai_providers: AIProvidersStatus
    capabilities: EngineCapabilitiesStatus
    job_queue: JobQueueStatus
