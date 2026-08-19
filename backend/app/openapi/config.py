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

API_DESCRIPTION = """
## ⚡ Sonikoma Webtoon-to-Video Engine & AI Pipeline

The high-performance computational backend that transforms digital comics, webtoons, and manga into cinematic motion videos with synchronized narration, dynamic sound design, visual effects, and animated storyboards.

---

### 🚀 Pipeline Workflow Architecture

```
 ┌───────────────────────────┐      ┌──────────────────────────────┐      ┌─────────────────────────────┐
 │ 03. Webtoon Scraper       │ ───► │  04. Panel Smart Split       │ ───► │ 05. OCR Speech Extraction   │
 └───────────────────────────┘      └──────────────────────────────┘      └─────────────────────────────┘
               │                                                                         │
               ▼                                                                         ▼
 ┌───────────────────────────┐      ┌──────────────────────────────┐      ┌─────────────────────────────┐
 │ 08. Image Canvas & Clean  │ ◄─── │   06. Storyboard AI          │ ◄─── │ 07. Multi-Modal Vision      │
 └───────────────────────────┘      └──────────────────────────────┘      └─────────────────────────────┘
               │                                                                         │
               ▼                                                                         ▼
 ┌───────────────────────────┐      ┌──────────────────────────────┐      ┌─────────────────────────────┐
 │ 09. Audio Synthesis & TTS │ ───► │ 10. Video Rendering Engine   │ ───► │ 12. Export & Archiving      │
 └───────────────────────────┘      └──────────────────────────────┘      └─────────────────────────────┘
```

---

### 🔑 Authentication & BYOK API Keys
- **User Sessions**: Include `Authorization: Bearer <jwt_token>` for authenticated routes.
- **BYOK (Bring Your Own Key)**: Provide direct AI provider keys via request headers:
  - `X-User-Gemini-Key`: Google AI Studio API Key
  - `X-User-OpenAI-Key`: OpenAI Developer API Key
  - `X-User-Anthropic-Key`: Anthropic Claude API Key
  - `X-User-HuggingFace-Key`: HuggingFace Hub API Token

---

### 📡 Real-Time Job Polling Protocol
Long-running async tasks (scraping, slicing, OCR, AI storyboard, video rendering) return background tasks:
1. Submit task request (e.g. `POST /api/v1/scraper/chapter` or `POST /api/v1/panels/split`).
2. Immediate response returns a job envelope: `{"job_id": "...", "status": "QUEUED", "progress": 0.0}`.
3. Poll `GET /api/v1/jobs/{job_id}` for live progress (`0.0` - `100.0%`), execution stage, and results.
4. To cancel an active task, send `POST /api/v1/jobs/{job_id}/cancel`.
"""

CATEGORY_METADATA = [
    {"id": "all", "label": "🌐 All APIs", "path": "/api/docs"},
    {"id": "jobs", "label": "⚡ Background Jobs", "path": "/api/docs/jobs"},
    {"id": "ai", "label": "🧠 AI Core & Models", "path": "/api/docs/ai"},
    {"id": "projects", "label": "📁 Projects & Series", "path": "/api/docs/projects"},
    {"id": "scraper", "label": "🕷️ Scraper & OCR", "path": "/api/docs/scraper"},
    {"id": "media", "label": "🎨 Image, Audio & Video", "path": "/api/docs/media"},
    {"id": "auth", "label": "🔐 Auth & Profile", "path": "/api/docs/auth"},
    {"id": "admin", "label": "🛡️ Superuser Admin", "path": "/api/docs/admin"},
]
