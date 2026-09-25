"""
update_docs.py  —  Bulk-update all docs/ markdown files to use /api/v1/ paths.
Maps old unversioned /api/ routes to their correct /api/v1/ counterparts.
"""
import os, re

# Ordered replacements (most-specific first to avoid double-replacement)
REPLACEMENTS = [
    # Auth
    ("/api/auth/register",          "/api/v1/auth/register"),
    ("/api/auth/login",             "/api/v1/auth/login"),
    ("/api/auth/forgot-password",   "/api/v1/auth/forgot-password"),
    ("/api/auth/me",                "/api/v1/auth/me"),
    ("/api/auth/credits",           "/api/v1/auth/credits"),
    ("/api/auth/transactions",      "/api/v1/auth/transactions"),
    ("/api/auth/token",             "/api/v1/auth/token"),
    # Admin
    ("/api/admin/users/",           "/api/v1/admin/users/"),
    ("/api/admin/db/query",         "/api/v1/admin/db/query"),
    ("/api/admin/",                 "/api/v1/admin/"),
    # System / Health
    ("/api/health/ffmpeg",          "/api/v1/system/health/ffmpeg"),
    ("/api/health",                 "/api/v1/system/health"),
    ("/api/metrics",                "/api/v1/system/metrics"),
    ("/api/system-logs/stream",     "/api/v1/system/system-logs/stream"),
    ("/api/system-logs/log",        "/api/v1/system/system-logs/log"),
    ("/api/system-logs",            "/api/v1/system/system-logs"),
    # Scraper
    ("/api/scrape-episodes-advanced",   "/api/v1/scraper/scrape-episodes-advanced"),
    ("/api/scrape-episodes-paginated",  "/api/v1/scraper/scrape-episodes-paginated"),
    ("/api/scrape-episodes",            "/api/v1/scraper/scrape-episodes"),
    ("/api/batch-scrape-series",        "/api/v1/scraper/batch-scrape-series"),
    ("/api/scraper/scrape-images",      "/api/v1/scraper/scrape-images"),
    ("/api/scrape-images",              "/api/v1/scraper/scrape-images"),
    ("/api/scraper/",                   "/api/v1/scraper/"),
    ("/api/scrape",                     "/api/v1/scraper/scrape"),
    # Images / Proxy
    ("/api/proxy-image",            "/api/v1/proxy/image"),
    ("/api/image/cached/",          "/api/v1/image/cached/"),
    ("/api/image/edit",             "/api/v1/image/edit"),
    ("/api/image/merge",            "/api/v1/image/merge"),
    ("/api/image/remove-speech-bubbles", "/api/v1/image/remove-speech-bubbles"),
    ("/api/image/download-zip/get/", "/api/v1/image/download-zip/get/"),
    ("/api/image/download-zip",     "/api/v1/image/download-zip"),
    ("/api/image/training-data-file/", "/api/v1/image/training-data-file/"),
    ("/api/image/",                 "/api/v1/image/"),
    ("/api/images/debug-yolo-detections", "/api/v1/ai/images/debug-yolo-detections"),
    ("/api/merge-images/cached",    "/api/v1/image/merge-images/cached"),
    ("/api/stitch-images/cached/",  "/api/v1/image/stitch-images/cached/"),
    # AI
    ("/api/analyze-image",          "/api/v1/ai/analyze-image"),
    ("/api/analyze-sequence",       "/api/v1/ai/analyze-sequence"),
    ("/api/analyze-batch",          "/api/v1/ai/analyze-batch"),
    ("/api/ai-detect-panels",       "/api/v1/ai/detect-panels"),
    ("/api/ai-smart-crop",          "/api/v1/ai/smart-crop"),
    ("/api/detect-panels",          "/api/v1/ai/detect-panels"),
    ("/api/generate-speech-text",   "/api/v1/ai/generate-speech-text"),
    ("/api/generate",               "/api/v1/ai/generate"),
    # Audio / Video
    ("/api/convert-images-to-video","/api/v1/video/convert-images-to-video"),
    ("/api/generate-tts",           "/api/v1/audio/generate-tts"),
    # Projects
    ("/api/projects/:id/panels",    "/api/v1/projects/:id/panels"),
    ("/api/projects/:id",           "/api/v1/projects/:id"),
    ("/api/projects",               "/api/v1/projects"),
    # Narratives (planned)
    ("/api/narrative/generate",     "/api/v1/ai/narrative/generate"),
    ("/api/narrative/apply",        "/api/v1/ai/narrative/apply"),
    ("/api/narratives/",            "/api/v1/ai/narratives/"),
    ("/api/audio/providers",        "/api/v1/audio/providers"),
    # Docs/redoc (legacy)
    ("/api/docs",                   "/api/v1/docs"),
    ("/api/redoc",                  "/api/v1/redoc"),
    # ML engines (py prefix → v1 prefix)
    ("/api/py/ffmpeg/",             "/api/v1/video/ffmpeg/"),
    ("/api/py/audio/",              "/api/v1/audio/"),
    ("/api/py/whisper/",            "/api/v1/audio/whisper/"),
    ("/api/py/image/",              "/api/v1/image/"),
    ("/api/py/workflows/",          "/api/v1/ai/workflows/"),
    ("/api/py/video/",              "/api/v1/video/"),
    ("/api/py/",                    "/api/v1/"),
    # Whisper / Librosa / etc. legacy tool names
    ("/api/whisper",                "/api/v1/audio/whisper"),
    ("/api/librosa",                "/api/v1/audio/librosa"),
    ("/api/ffmpeg",                 "/api/v1/video/ffmpeg"),
    ("/api/stable-diffusion",       "/api/v1/ai/stable-diffusion"),
    ("/api/imagemagick",            "/api/v1/image/imagemagick"),
]

docs_dir = "docs"
updated = 0
total_replacements = 0

for root, dirs, files in os.walk(docs_dir):
    for file in files:
        if not file.endswith((".md", ".txt", ".rst")):
            continue
        path = os.path.join(root, file)
        try:
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            new_content = content
            for old, new in REPLACEMENTS:
                if old in new_content:
                    count = new_content.count(old)
                    new_content = new_content.replace(old, new)
                    total_replacements += count
            if new_content != content:
                with open(path, "w", encoding="utf-8") as f:
                    f.write(new_content)
                updated += 1
                print(f"  ✓ Updated: {path}")
        except Exception as e:
            print(f"  ✗ Error: {path}: {e}")

print(f"\n{'='*60}")
print(f"Updated {updated} docs files with {total_replacements} replacements.")
