import re

with open("backend/python/routes/health.py", "r") as f:
    content = f.read()

# I will recreate the health endpoint because the previous replace wiped it out.
if "@router.get(\"/health\"" not in content:
    health_endpoint = """
from fastapi import Header

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
        db_stats = db.get_db_stats()
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

@router.get("/system-logs", summary="JSON polling endpoint for console logs")
async def system_logs(since: int = Query(0, description="Fetch logs generated after this sequence ID")):
"""
    content = content.replace("        logs = get_logs(since)\n        return {\"success\": True, \"logs\": logs}", health_endpoint + "    try:\n        logs = get_logs(since)\n        return {\"success\": True, \"logs\": logs}")

with open("backend/python/routes/health.py", "w") as f:
    f.write(content)
print("Done")
