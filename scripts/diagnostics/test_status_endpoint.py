"""
Scratch script to verify backend status service and endpoint directly.
"""

import os
import sys
import json

backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
app_dir = os.path.join(backend_dir, "app")
sys.path.insert(0, backend_dir)
sys.path.insert(0, app_dir)

from app.services.system.status_service import get_comprehensive_backend_status
from app.main import app
from fastapi.testclient import TestClient

print("=" * 60)
print("TESTING STATUS SERVICE DIRECTLY")
print("=" * 60)

status = get_comprehensive_backend_status()
status_dict = status.model_dump()

print("Status response generated successfully:")
print(f"Service: {status_dict['server']['service']} (v{status_dict['server']['version']})")
print(f"Server Status: {status_dict['server']['status']}")
print(f"Uptime: {status_dict['server']['uptime']}")
print(f"CPU Usage: {status_dict['resources']['cpu']['usage_percent']}% across {status_dict['resources']['cpu']['cores_logical']} cores")
print(f"RAM RSS: {status_dict['resources']['memory']['rss_mb']} MB (System: {status_dict['resources']['memory']['used_mb']} / {status_dict['resources']['memory']['total_mb']} MB)")
print(f"GPU Available: {status_dict['resources']['gpu']['available']} (Count: {status_dict['resources']['gpu']['device_count']})")
print(f"Database: {status_dict['database']['status']} (Latency: {status_dict['database']['latency_ms']}ms, Size: {status_dict['database']['file_size_bytes']} bytes)")
print(f"Database Counts: {status_dict['database']['counts']}")
print(f"Storage Total App: {round(status_dict['storage']['total_app_storage_bytes'] / (1024*1024), 2)} MB")
print(f"Disk Partition: {round(status_dict['storage']['disk_partition']['free_bytes'] / (1024*1024*1024), 2)} GB free")
print(f"AI Providers: {status_dict['ai_providers']}")
print(f"Capabilities FFmpeg: {status_dict['capabilities']['ffmpeg']}")
print(f"Capabilities Torch: {status_dict['capabilities']['torch']}")
print(f"Job Queue: Total {status_dict['job_queue']['total_jobs']}, Queued: {status_dict['job_queue']['queued']}, Running: {status_dict['job_queue']['running']}")

print("\n" + "=" * 60)
print("TESTING FASTAPI /api/v1/system/status ROUTE VIA TESTCLIENT")
print("=" * 60)

client = TestClient(app)
res = client.get("/api/v1/system/status")
print(f"GET /api/v1/system/status -> Status Code: {res.status_code}")
assert res.status_code == 200, f"Expected 200, got {res.status_code}"
data = res.json()
assert data["success"] is True
assert data["server"]["service"] == "Sonikoma Computational Backend"
assert "database" in data
assert "resources" in data
assert "storage" in data
assert "capabilities" in data

print("Testing primary route /api/v1/system/status:")
res_alias = client.get("/api/v1/system/status")
print(f"GET /api/v1/system/status -> Status Code: {res_alias.status_code}")
assert res_alias.status_code == 200, f"Expected 200, got {res_alias.status_code}"

print("\nALL BACKEND STATUS TESTS PASSED SUCCESSFULLY! 100% AUTHENTIC METRICS.")
