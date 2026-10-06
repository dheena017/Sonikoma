# Intelligence Feature Module (`backend/features/intelligence/`)

## 1. Overview & Architecture
The **Intelligence** domain serves as the cognitive AI core of Sonikoma. It combines multimodal computer vision analysis, generative diffusion synthesis, episodic continuity memory, character voice-casting, dialogue localization, and script dramatization.

- **Architecture Standard**: Follows the canonical **service → schemas → router → README** pattern:
  - **`ai/`**: Multimodal AI vision, generative image models (SD/Flux/Gemini), chat assistants, voice narration, prompt engineering labs, and translation.
  - **`series/`**: AI Generated Series production director, kinetic anime motion (I2V/T2V), character DNA bibles, worldbuilding, and continuity memory.
  - **`services_training/`**: YOLO model training and automated dataset monitoring.

---

## 2. Directory Layout & Module Structure

```
backend/features/intelligence/
├── __init__.py               # Unified exports: router, intelligence_router, service, intelligence_service, schemas, ai, series
├── router.py                 # Root router mounting /ai and /series
├── service.py                # IntelligenceService facade combining AIService and SeriesService
├── schemas.py                # Unified schemas export (AI and Series models)
├── schemas_ai.py             # AI domain schema definitions
├── schemas_series.py         # Series domain schema definitions
├── schemas_memory.py         # Franchise continuity & style schema definitions
├── repositories_series.py    # Backward compatibility shim for AISeriesRepository
├── ai/                       # Multimodal AI Models & Skills sub-domain
│   ├── __init__.py           # ai_router, AIService, ai_service, schemas, services
│   ├── service.py            # AIService facade
│   ├── schemas.py            # AI domain schemas
│   ├── router/               # Sub-routers directory
│   │   ├── __init__.py       # Unified ai_router / router
│   │   ├── image.py          # /image
│   │   ├── narration.py      # /narration
│   │   ├── chat.py           # /chat
│   │   ├── translation.py    # /translate
│   │   ├── prompts.py        # /prompts
│   │   └── analytics.py      # /analytics
│   ├── services/             # Specialized AI services
│   │   ├── __init__.py
│   │   ├── facade.py         # Multimodal model provider routing
│   │   └── _deps.py          # Provider credentials & skill execution
│   └── README.md             # AI domain documentation
├── series/                   # AI Generated Series Production sub-domain
│   ├── __init__.py           # series_router, SeriesService, series_service, repositories, schemas, services
│   ├── service.py            # SeriesService facade
│   ├── schemas.py            # Series & continuity memory schemas
│   ├── repositories.py       # AISeriesRepository SQLite database persistence
│   ├── router/               # Sub-routers directory
│   │   ├── __init__.py       # ai_series_master_router, series_router, router
│   │   ├── projects.py       # /projects
│   │   ├── chapters.py       # /chapters
│   │   ├── bubbles.py        # /bubbles
│   │   ├── characters.py     # /characters
│   │   ├── world.py          # /world
│   │   ├── narrative.py      # /narrative
│   │   ├── audio.py          # /audio
│   │   ├── vfx.py            # /vfx
│   │   ├── memory.py         # /memory
│   │   └── export.py         # /export
│   ├── services/             # Specialized Series services
│   │   ├── __init__.py
│   │   ├── series_orchestrator.py  # Progressive chapter generation & Turbo synthesis
│   │   ├── series_image_service.py # 2D image synthesis & local disk caching
│   │   ├── series_audio_service.py # Edge-TTS vocal dubbing & audition previews
│   │   └── series_memory_engine.py # Franchise continuity & creator style learning
│   └── README.md             # Series domain documentation
├── services_training/        # YOLO fine-tuning & dataset monitoring
│   ├── __init__.py
│   ├── training_monitor.py
│   └── yolo_training_service.py
└── README.md                 # Intelligence module documentation
```

---

## 3. Endpoints Overview

### AI Models & Skills (`/api/v1/intelligence/ai`)
| Sub-Router | Path Prefix | Primary Operations |
| :--- | :--- | :--- |
| `image` | `/image` | Multi-engine image generation, style transfers |
| `narration` | `/narration` | Dialogue script creation & TTS speech synthesis |
| `chat` | `/chat` | Conversational agents, creator assistant |
| `translation` | `/translate` | 50+ languages comic localization |
| `prompts` | `/prompts` | Prompt enhancement, model latency testing |
| `analytics` | `/analytics` | Token usage ledger and billing analytics |

### AI Generated Series (`/api/v1/intelligence/series` or `/api/v1/ai-series`)
| Sub-Router | Path Prefix | Primary Operations |
| :--- | :--- | :--- |
| `projects` | `/projects` | Multi-session series lifecycle management |
| `chapters` | `/chapters` | Progressive chapter generation, panels, status |
| `bubbles` | `/bubbles` | Speech bubble detection, placement, styles |
| `characters` | `/characters` | Character DNA profiles, visual continuity bibles |
| `world` | `/world` | World lore, recurring factions, locations |
| `narrative` | `/narrative` | Story acts, plot threads, tension pacing |
| `audio` | `/audio` | Vocal dubbing and audition generation |
| `vfx` | `/vfx` | Kinetic camera movement presets and anime VFX |
| `memory` | `/memory` | Franchise canon memory and creator RLHF |
| `export` | `/export` | Multi-format compilation (vertical strip, PDF, CBZ) |
