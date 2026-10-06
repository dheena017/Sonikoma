# AI Generated Series Domain (`backend/features/intelligence/series/`)

## 1. Overview & Architecture
The `series` domain powers multi-chapter story generation, kinetic anime video motion (I2V/T2V), 2D manga/manhwa image rendering, multi-character Edge-TTS vocal dubbing, and franchise canon continuity memory.

- **Primary Goal**: Follow the canonical pattern: **service → schemas → router → README**.
- **Frontend Counterpart**: Directly feeds `SeriesSession`, `ChapterSession`, `AISeriesPanel`, and `InteractiveSpeechBubble` into the creator webtoon viewer and storyboard studio.

---

## 2. Directory Layout & Module Structure

```
backend/features/intelligence/series/
├── __init__.py               # Series domain exports (router, service, schemas, repositories)
├── service.py                # SeriesService facade class & singleton series_service
├── schemas.py                # Pydantic schemas (chapters, panels, characters, continuity memory)
├── repositories.py           # AISeriesRepository & ai_series_repo SQLite persistence
├── router/                   # Modular sub-routers
│   ├── __init__.py           # ai_series_master_router, series_router, router
│   ├── projects.py           # /projects (create, list, get, delete)
│   ├── chapters.py           # /chapters (generation, panels, status)
│   ├── bubbles.py            # /bubbles (dialogue speech bubbles, positions)
│   ├── characters.py         # /characters (character DNA profiles & visual bibles)
│   ├── world.py              # /world (worldbuilding lore, locations, factions)
│   ├── narrative.py          # /narrative (act structure, plot progression)
│   ├── audio.py              # /audio (Edge-TTS dubbing, voice auditions)
│   ├── vfx.py                # /vfx (kinetic motion, camera moves, anime effects)
│   ├── memory.py             # /memory (canon continuity & creator RLHF feedback)
│   └── export.py             # /export (PDF, EPUB, Webtoon vertical strip compilation)
├── services/                 # Specialized domain services
│   ├── __init__.py           # Services aggregator
│   ├── series_orchestrator.py# Progressive generation director & Turbo synthesizer
│   ├── series_image_service.py # 2D illustration rendering & disk caching
│   ├── series_audio_service.py # Multi-character vocal dubbing & auditions
│   └── series_memory_engine.py # Franchise continuity memory & style learning
└── README.md                 # Domain documentation
```

---

## 3. Endpoints Overview (Mounted at `/api/v1/ai-series`)

| Sub-Router | Path Prefix | Primary Operations |
| :--- | :--- | :--- |
| `projects` | `/projects` | Create, list, retrieve, and delete series projects |
| `chapters` | `/chapters` | Progressive chapter generation, status, panels |
| `bubbles` | `/bubbles` | Interactive speech bubbles, placement, OCR |
| `characters` | `/characters` | Character DNA profiles, visual bibles |
| `world` | `/world` | World lore, locations, faction rules |
| `narrative` | `/narrative` | Act structure, narrative continuity |
| `audio` | `/audio` | Edge-TTS vocal dubbing and audition generation |
| `vfx` | `/vfx` | Kinetic camera movement presets and anime VFX |
| `memory` | `/memory` | Franchise canon memory, RLHF feedback, style profiles |
| `export` | `/export` | Multi-format compilation (vertical strip, PDF, CBZ) |
