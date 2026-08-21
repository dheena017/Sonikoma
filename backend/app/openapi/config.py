"""
backend/app/openapi/config.py
─────────────────────────────────────────────────────────────────────────────
OpenAPI schema metadata, tags hierarchy, pipeline documentation, and category filters.
─────────────────────────────────────────────────────────────────────────────
"""

OPENAPI_TAGS = [
    {
        "name": "01A. Authentication & Security",
        "description": "User authentication, JWT login sessions, credential verification, password reset, and Google OAuth.",
    },
    {
        "name": "01B. Creator Profile & API Keys",
        "description": "Creator profile details, custom avatar upload, UX preferences, and BYOK AI provider API keys.",
    },
    {
        "name": "02. Projects & Workspace",
        "description": "Parent comic series containers, chapters, episodes, and storyboard panel persistence.",
    },
    {
        "name": "03. Webtoon Scraping",
        "description": "Adaptive webtoon comic scraper, chapter discovery, and batch URL processing.",
    },
    {
        "name": "04. Panel Splitting",
        "description": "Smart vertical webtoon strip segmenting and automatic panel bounding box detection.",
    },
    {
        "name": "05. OCR & Speech Extraction",
        "description": "Speech bubble OCR vision extraction and dialogue script generation.",
    },
    {
        "name": "06. Storyboard AI",
        "description": "LLM vision scene descriptions, narrative flow, voiceover scripts, and audio cues.",
    },
    {
        "name": "07A. AI Model Catalog & Routing",
        "description": "Dynamic AI model catalog filtered by entered keys, cost calculations, and task routing.",
    },
    {
        "name": "07B. AI Vision & Panel Analysis",
        "description": "Multi-modal image analysis, panel sequence understanding, and visual prompt engineering.",
    },
    {
        "name": "07C. AI Dialogue & Script Writing",
        "description": "Scene dialogue dramatization, YouTube Shorts hooks, and creative narration generation.",
    },
    {
        "name": "07D. AI Translation & Localization",
        "description": "Automated comic panel translation and multilingual dialogue localization.",
    },
    {
        "name": "08. Image Canvas & Editing",
        "description": "Image inpainting, layer cleaning, ImageMagick processing, and stable diffusion.",
    },
    {
        "name": "09. Audio Synthesis",
        "description": "TTS voiceover narration, sound effects (SFX), and multi-track audio mixing.",
    },
    {
        "name": "10. Video Rendering Engine",
        "description": "Video compilation, motion effects, transition generation, and timeline rendering.",
    },
    {
        "name": "11. Background Jobs",
        "description": "Real-time task tracking, progress polling, execution status, and job cancellation.",
    },
    {
        "name": "12. Export & Archiving",
        "description": "Exporting comic archives (.CBZ / .ZIP), video packages, and media downloads.",
    },
    {
        "name": "13. System Health & Telemetry",
        "description": "System health telemetry, GPU worker status, memory pools, and live SSE log streams.",
    },
    {
        "name": "14. Superuser Admin Console",
        "description": "Superuser administration, credit economy grants, system audits, DB query, and platform settings.",
    },
]

API_DESCRIPTION = ""

CATEGORY_METADATA = [
    {"id": "all", "label": "🌐 All APIs (Full Hub)", "path": "/api/docs"},
    {"id": "auth", "label": "🔐 Auth & Creator Profile", "path": "/api/docs/auth"},
    {"id": "projects", "label": "📁 Projects & Workspace", "path": "/api/docs/projects"},
    {"id": "scraper", "label": "🕷️ Webtoon Scraper", "path": "/api/docs/scraper"},
    {"id": "panels", "label": "📐 Panel Splitting & OCR", "path": "/api/docs/panels"},
    {"id": "ai", "label": "🧠 AI Models & Storyboard", "path": "/api/docs/ai"},
    {"id": "audio", "label": "🎙️ Audio Synthesis & TTS", "path": "/api/docs/audio"},
    {"id": "video", "label": "🎬 Video Rendering Engine", "path": "/api/docs/video"},
    {"id": "jobs", "label": "⚡ Background Jobs & Queue", "path": "/api/docs/jobs"},
    {"id": "export", "label": "📦 Export & Archiving", "path": "/api/docs/export"},
    {"id": "system", "label": "💚 Health & System Stats", "path": "/api/docs/system"},
    {"id": "schemas", "label": "📊 Data Models & Schemas", "path": "/api/docs/schemas"},
]
