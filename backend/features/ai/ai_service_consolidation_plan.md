# Exhaustive Specification: Unified `backend/features/ai/` Architecture

## Executive Blueprint: Elevating AI to a First-Class Canonical Domain

In alignment with Sonikoma's top-level domain consolidation:
- Visual domain consolidated in **`backend/features/image/`**
- Speech & DSP domain consolidated in **`backend/features/audio/`**
- Video rendering & motion consolidated in **`backend/features/video/`**

This specification establishes **`backend/features/ai/`** as the dedicated, authoritative, first-class cognitive and artificial intelligence domain for the entire Sonikoma platform.

---

### 1.1 The Rationale for Elevating `backend/features/ai/`
Previously, artificial intelligence and cognitive capabilities were scattered across multiple disparate locations:
1. **Buried in Nested Sub-domains**: Core AI capabilities were buried inside `backend/features/intelligence/ai/services/facade.py` (a 1,363-line monolith combining vision, smart cropping, prompt enhancement, memory tracking, and dynamic model fetching).
2. **Duplicated & Disconnected Across Domains**:
   - Comic dialogue translation was implemented in both `backend/features/intelligence/ai/router/translation.py` and `backend/features/creative/translation/`.
   - YouTube thumbnail generation was separated into `backend/features/creative/thumbnails/ai_skill.py` (prompting) and `generator.py` (PIL rendering), disconnected from the AI core.
   - Storyboard analysis in `backend/features/workspace/services/storyboard_ai.py` duplicated panel analysis in `intelligence/ai/services/facade.py`.
3. **Autonomous Agent Isolation**: The Autonomous Comic-to-Video Agent (`backend/features/creative/agent/workflow.py` and `cast_manager.py`) lived under `features/creative/` despite being Sonikoma's primary multimodal AI orchestrator.
4. **Architectural Symmetry**: Elevating AI to `backend/features/ai/` creates an elegant, standardized top-level quadri-core:
   - `backend/features/image/` ── Visual panel slicing, YOLO bubbles, SAM2 layers, EasyOCR.
   - `backend/features/audio/` ── Neural TTS synthesis, Whisper STT, Librosa audio DSP.
   - `backend/features/video/` ── Timeline compilation, Ken Burns 2D motion, FFmpeg operations.
   - `backend/features/ai/`    ── Multimodal vision, autonomous director agent, series narrative, prompt engineering, translation, thumbnails, and model discovery.

By establishing **`backend/features/ai/`** as the single canonical home, Sonikoma gains a unified, modular, production-grade AI architecture with 100% backward compatibility for all existing callers and endpoints.

---

### 1.2 Ecosystem Discovery: Complete AI Map in Sonikoma

The following exhaustive inventory audits all AI, machine learning, and cognitive services across the entire Sonikoma codebase:

| Subsystem / Layer | Location | Description & Role | Current Status | Target State in `features/ai/` |
| :--- | :--- | :--- | :--- | :--- |
| **Canonical AI Root** | `backend/features/ai/` | Primary top-level cognitive domain: multimodal vision, prompt engineering, series continuity, autonomous agent, translation, thumbnails, training, and model catalog. | Unpopulated Directory | **Canonical Authoritative Home** |
| **Monolithic AI Sub-domain** | `backend/features/intelligence/ai/services/facade.py` | 1,363-line monolith: panel analysis, batch vision, smart crop, prompt enhancement, memory tracking, and model listing. | Bloated Monolith | Decomposed into 4 modular services in `features/ai/analysis/`, `features/ai/prompts/`, and `features/ai/catalog/`. |
| **Autonomous Storyboard Agent** | `backend/features/creative/agent/` | 1-click end-to-end comic-to-video director agent: scrapes webtoon, detects panels, synthesizes audio, computes Ken Burns motions, compiles MP4, and publishes to YouTube. | Displaced in `creative/` | Canonical logic in `features/ai/agent/`; `features/creative/agent/` maintained as backward-compatibility shim. |
| **AI Series Studio Core** | `backend/features/intelligence/series/` | Full comic franchise production director: story arc architecture, character DNA bibles, world-building lore, panel synthesis, multi-character dubbing, and episodic memory. | Modular sub-domain | Canonical logic in `features/ai/series/`; `features/intelligence/series/` maintained as backward-compatibility shim. |
| **Thumbnail Generation Studio** | `backend/features/creative/thumbnails/` | AI YouTube / Webtoon cover generator: Gemini prompt engineer (`ai_skill.py`) and Pillow graphic compositor (`generator.py`). | Displaced in `creative/` | Canonical generator in `features/ai/thumbnails/`; `features/creative/thumbnails/` maintained as backward-compatibility shim. |
| **Comic Translation & Localization** | `backend/features/creative/translation/`<br>`backend/features/intelligence/ai/router/translation.py` | 50+ language comic dialogue translation with context preservation, honorifics, and reading order awareness. | Duplicated in 2 locations | Unified canonical translation in `features/ai/translation/`; re-exported to legacy endpoints. |
| **YOLO Fine-Tuning & Dataset Monitor** | `backend/features/intelligence/services_training/` | Custom YOLOv8 speech bubble and comic panel training service and background dataset telemetry monitor. | Standalone sub-domain | Canonical logic in `features/ai/training/` with clean "Helpers at Top, Main API at Bottom" structure. |
| **Low-Level Multi-Provider AI Engine** | `backend/ai_engine/providers/` | Hardware & protocol integration with 14 foundational providers: `gemini`, `openai`, `anthropic`, `deepseek`, `groq`, `huggingface`, `pollinations`, `stable_diffusion`, `whisper`, `edge_tts`, `elevenlabs`, `librosa`, `ffmpeg`, `video`. | Foundational Provider Layer | Provider Layer (Unchanged). Consumed via `ai_engine.core.orchestrator`. |
| **AI Orchestrator & Hub** | `backend/ai_engine/core/` | Dynamic provider routing, fallback cascades, API key rotation, model validation, and provider registry. | Foundational Orchestrator | Core Engine (Unchanged). Consumed directly by AI services. |
| **Markdown Skills Engine** | `backend/ai_engine/skills/` | Template-driven markdown skill runner with Jinja variable substitution, provider resolution, and robust JSON parsing (`base.py`, `coordinator.py`, `registry.py`). | Foundational Skill Runner | Foundational Skill Engine (Unchanged). |
| **Computer Vision AI (Image)** | `backend/features/image/detector/`<br>`backend/features/image/layer_separation/`<br>`backend/features/image/ocr/` | Deep learning vision models: YOLOv8 speech bubble segmentation, OpenCV panel detection, SAM2 Segment Anything, character extraction, pyramid inpainting, and EasyOCR. | Domain: `features/image/` | Visual AI Domain (Unchanged). Consumed by AI analysis & agent. |
| **Speech & Audio AI (Audio)** | `backend/features/audio/tts/`<br>`backend/features/audio/transcription/`<br>`backend/features/audio/dsp/` | Neural voice synthesis (Edge-TTS, ElevenLabs), Whisper STT transcription, word-level typography timestamps, and Librosa DSP analysis. | Domain: `features/audio/` | Speech AI Domain (Unchanged). Consumed by series dubbing & agent workflow. |
| **Storyboard AI (Workspace)** | `backend/features/workspace/services/storyboard_ai.py` | Workspace panel dramatization and storyboard generation helper. | High-level consumer | Refactored to consume canonical `features.ai.analysis` services. |
| **Export & Syndication** | `backend/features/creative/export/` | YouTube Data API v3 OAuth2, resumable video uploading, publishing history, and channel credentials. | Domain: `features/creative/` | Publication Domain (Remains in `creative/export/` as distribution layer). |

---

## 2. Directory Blueprint (Approved)

```
backend/features/ai/
│
├── __init__.py                               # Unified top-level package facade (re-exports all canonical services)
├── schemas.py                                # Master Pydantic request/response models & schemas
├── service.py                                # AIService master facade & ai_service singleton
├── README.md                                 # Architecture documentation & domain specification
├── ai_service_consolidation_plan.md          # This comprehensive architectural specification
│
├── analysis/                                 # ── 1. MULTIMODAL VISION & STORYBOARD ANALYSIS (Decomposed from facade.py) ──
│   ├── __init__.py
│   ├── panel_analyzer_service.py             # 1. Single panel visual breakdown, speaker attribution & emotion
│   ├── batch_analyzer_service.py             # 2. Multi-panel concurrent / sequential batch comic analysis
│   ├── smart_crop_service.py                 # 3. Vision-guided intelligent panel bounding box & gutter detection
│   └── narrative_analyzer_service.py         # 4. Multi-panel scene progression, pacing & story memory tracking
│
├── prompts/                                  # ── 2. PROMPT ENGINEERING & STYLE EXPANSION ──
│   ├── __init__.py
│   ├── prompt_enhancer_service.py            # 1. Comic prompt upscaling, style tags & quality token injection
│   └── style_preset_service.py               # 2. Visual style tokens (Shonen, Seinen, Manhwa, Webtoon, Noir, Shojo)
│
├── agent/                                    # ── 3. AUTONOMOUS STORYBOARD AGENT (Elevated from creative/agent) ──
│   ├── __init__.py
│   ├── workflow_service.py                   # 1. 1-click autonomous director pipeline (Scrape → Vision → TTS → Motion → Video)
│   ├── cast_manager_service.py               # 2. Automated character entity casting & neural voice profile assignment
│   └── agent_run_service.py                  # 3. Background agent lifecycle, SQLite run persistence & status polling
│
├── series/                                   # ── 4. AI GENERATED SERIES STUDIO CORE (Elevated from intelligence/series) ──
│   ├── __init__.py
│   ├── arc_architect_service.py              # 1. Multi-episode story arc synthesis & plot tension planning
│   ├── panel_synthesizer_service.py          # 2. Character-consistent panel image prompt generation & framing
│   ├── series_image_service.py               # 3. Generative diffusion panel rendering & disk asset persistence
│   ├── series_audio_service.py               # 4. Multi-character voice dubbing & dialogue pacing
│   ├── series_memory_engine.py               # 5. Long-term franchise continuity, lore canon & relationship tracking
│   ├── series_orchestrator_service.py        # 6. Progressive chapter generation & Turbo synthesis pipeline
│   ├── repositories.py                       # Series, chapter, character, and world database repository
│   └── styles/                               # Genre style configurations (Anime, Manga, Manhwa, Western Comic)
│       ├── __init__.py
│       ├── anime.py
│       ├── manga.py
│       ├── manhwa.py
│       ├── western_comic.py
│       └── presets.py
│
├── translation/                              # ── 5. COMIC LOCALIZATION & TRANSLATION ──
│   ├── __init__.py
│   ├── dialogue_translation_service.py       # 1. Single speech bubble & dialogue translation with tone preservation
│   └── batch_translation_service.py          # 2. Chapter-wide dialogue translation with character voice consistency
│
├── thumbnails/                               # ── 6. THUMBNAIL STUDIO & VISUAL COMPOSITION (Elevated from creative/thumbnails) ──
│   ├── __init__.py
│   ├── thumbnail_prompt_service.py           # 1. High-CTR clickbait hook prompt generator & visual concept builder
│   └── thumbnail_composer_service.py         # 2. Pillow 16:9 canvas compositor (layers, glowing borders, title badges)
│
├── training/                                 # ── 7. COMPUTER VISION MODEL TRAINING & MONITORING (Elevated from intelligence) ──
│   ├── __init__.py
│   ├── yolo_training_service.py              # 1. Custom YOLOv8 speech bubble & panel fine-tuning pipeline
│   └── training_monitor_service.py           # 2. Epoch telemetry tracker, mAP evaluator & training status stream
│
├── catalog/                                  # ── 8. AI PROVIDER MODELS & BENCHMARKING ──
│   ├── __init__.py
│   ├── model_catalog_service.py              # 1. Multi-provider model discovery, quota specs & capability matrix
│   ├── latency_benchmark_service.py          # 2. Real-time provider latency & token response-time benchmark
│   └── token_analytics_service.py            # 3. Model token ledger, cost calculations & user credit quotas
│
├── utils/                                    # ── 9. PURE FOUNDATIONAL UTILITY LAYER ──
│   ├── __init__.py                           # Clean facade exporting prompt helpers, token math, memory buffers
│   ├── prompt_builder.py                     # Safe Jinja/string template interpolator & system prompt wrapper
│   ├── story_memory_tracker.py               # Sliding dialogue buffer, scene transition tracker & character memory
│   └── duration_estimator.py                 # Speech syllable & word-count acoustic duration estimator
│
└── router/                                   # ── 10. FASTAPI ROUTER INTERFACE ──
    ├── __init__.py                           # Aggregated ai_router & backward-compatibility mappings
    ├── analysis.py                           # Routes for /analyze-single-image, /analyze-all-panels, /smart-crop
    ├── prompts.py                            # Routes for /enhance-prompt, /style-presets
    ├── agent.py                              # Routes for /creative/agent/run, /status/{id}, /approve/{id}, /history
    ├── series.py                             # Routes for /ai-series/* (projects, chapters, characters, world, memory)
    ├── translation.py                        # Routes for /translate, /batch-translate
    ├── thumbnails.py                         # Routes for /creative/thumbnails/generate
    ├── training.py                           # Routes for /save-training-data, /training-status
    └── catalog.py                            # Routes for /list-models, /models/routing, /test-latency, /analytics
```

---

## 3. Universal File Structure Rule: "Helpers at Top, Main API at Bottom"

Every single service file strictly adheres to the following structural standard:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. File Header & Docstring                                             │
├────────────────────────────────────────────────────────────────────────┤
│ 2. Imports (Standard library, 3rd party, foundational utils)           │
├────────────────────────────────────────────────────────────────────────┤
│ 3. Module Constants & Private Configuration                            │
├────────────────────────────────────────────────────────────────────────┤
│ 4. TOP: Internal Helper Utilities (Prefixed with `_`)                  │
│    - Private retries, conversions, response sanitization & prompt math │
│    - Sub-step implementations (e.g. `_call_llm`, `_extract_json`)      │
├────────────────────────────────────────────────────────────────────────┤
│ 5. BOTTOM: The Canonical Public API Function                           │
│    - One single public entrypoint for the entire file                  │
│    - Takes clean typed arguments, coordinates helpers, returns result  │
├────────────────────────────────────────────────────────────────────────┤
│ 6. `__all__ = ["main_public_function"]`                                │
│    - Exports ONLY the main function; outside files NEVER call helpers! │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Standardized Function Specifications (Every File Defined)

---

### Module: `backend/features/ai/analysis/`

#### 1. `panel_analyzer_service.py`
* **Role**: Decomposed from `facade.py`. Conducts deep multimodal vision analysis on a single comic panel image: detects dialogue bubbles, extracts speech text, identifies speakers, predicts emotional cadence, suggests camera motions, and drafts narrative voiceover.
* **Local Helpers (Top)**:
  * `_resolve_panel_image(image_input: Union[str, bytes, Image.Image]) -> Image.Image`
  * `_build_vision_prompt(context: Optional[str], memory_summary: Optional[str]) -> str`
  * `_parse_and_sanitize_vision_json(raw_text: str) -> Dict[str, Any]`
  * `_validate_panel_attributes(data: Dict[str, Any]) -> Dict[str, Any]`
* **Main Public API (Bottom)**:
  ```python
  async def analyze_single_panel(
      image_data: Union[str, bytes, Image.Image],
      context: Optional[str] = None,
      memory_context: Optional[str] = None,
      provider: str = "gemini",
      model: Optional[str] = None,
      api_key: Optional[str] = None
  ) -> Dict[str, Any]:
      """Executes multimodal visual analysis on a single comic panel, returning speech, speaker, emotion, motion, and narrative."""
  ```
* **Exports**: `__all__ = ["analyze_single_panel"]`

#### 2. `batch_analyzer_service.py`
* **Role**: Decomposed from `facade.py`. Analyzes sequential batches of comic panels concurrently with rate-limit protection and sliding continuity memory.
* **Local Helpers (Top)**:
  * `_execute_single_panel_task(semaphore: asyncio.Semaphore, panel: Dict[str, Any], index: int, memory: Any, provider: str, model: Optional[str], api_key: Optional[str]) -> Dict[str, Any]`
  * `_fallback_linear_processing(panels: List[Dict[str, Any]], provider: str, model: Optional[str], api_key: Optional[str]) -> List[Dict[str, Any]]`
* **Main Public API (Bottom)**:
  ```python
  async def analyze_panel_batch(
      panels: List[Dict[str, Any]],
      max_concurrency: int = 4,
      provider: str = "gemini",
      model: Optional[str] = None,
      api_key: Optional[str] = None,
      maintain_memory: bool = True
  ) -> List[Dict[str, Any]]:
      """Concurrently analyzes an ordered sequence of comic panels with narrative continuity memory tracking."""
  ```
* **Exports**: `__all__ = ["analyze_panel_batch"]`

#### 3. `smart_crop_service.py`
* **Role**: Decomposed from `facade.py`. Uses multimodal vision intelligence to detect comic panel bounding boxes within tall webtoon strips, discarding empty gutters and overlapping artwork.
* **Local Helpers (Top)**:
  * `_calculate_strip_segments(img_width: int, img_height: int, segment_height: int = 3000) -> List[Tuple[int, int]]`
  * `_filter_overlapping_boxes(boxes: List[Dict[str, Any]], iou_threshold: float = 0.5) -> List[Dict[str, Any]]`
  * `_crop_panels_to_disk(image: Image.Image, boxes: List[Dict[str, Any]], output_dir: Optional[str]) -> List[str]`
* **Main Public API (Bottom)**:
  ```python
  async def detect_smart_panel_crops(
      image_data: Union[str, bytes, Image.Image],
      min_panel_height: int = 150,
      auto_slice: bool = True,
      output_dir: Optional[str] = None,
      provider: str = "gemini",
      api_key: Optional[str] = None
  ) -> Dict[str, Any]:
      """Detects panel bounding boxes in webtoon strips and optionally slices them into cropped panel assets."""
  ```
* **Exports**: `__all__ = ["detect_smart_panel_crops"]`

#### 4. `narrative_analyzer_service.py`
* **Role**: Analyzes the multi-panel dramatic arc of a chapter, computing tension pacing, dialogue distribution, character interaction graphs, and cinematic scene transitions.
* **Local Helpers (Top)**:
  * `_build_narrative_digest(panels: List[Dict[str, Any]]) -> str`
  * `_calculate_dramatic_tension_curve(scenes: List[Dict[str, Any]]) -> List[float]`
* **Main Public API (Bottom)**:
  ```python
  async def analyze_narrative_sequence(
      panels: List[Dict[str, Any]],
      genre: str = "Action Fantasy",
      provider: str = "gemini",
      model: Optional[str] = None,
      api_key: Optional[str] = None
  ) -> Dict[str, Any]:
      """Evaluates multi-panel pacing, character presence, scene transitions, and emotional story beats."""
  ```
* **Exports**: `__all__ = ["analyze_narrative_sequence"]`

---

### Module: `backend/features/ai/prompts/`

#### 1. `prompt_enhancer_service.py`
* **Role**: Decomposed from `facade.py`. Transforms basic comic ideas and rough descriptions into rich, production-ready prompts optimized for image generation (Flux/SDXL) and LLM dramatization.
* **Local Helpers (Top)**:
  * `_clean_input_prompt(prompt: str) -> str`
  * `_apply_genre_modifiers(prompt: str, genre: str, art_style: str) -> str`
* **Main Public API (Bottom)**:
  ```python
  async def enhance_creative_prompt(
      raw_prompt: str,
      target_engine: Literal["image", "script", "video"] = "image",
      art_style: str = "manhwa",
      genre: str = "action",
      provider: str = "gemini",
      api_key: Optional[str] = None
  ) -> Dict[str, Any]:
      """Refines raw user prompts into cinematic, token-dense generation prompts."""
  ```
* **Exports**: `__all__ = ["enhance_creative_prompt"]`

#### 2. `style_preset_service.py`
* **Role**: Registry of fine-tuned aesthetic tokens, camera lenses, lighting rigs, and rendering parameters for major comic genres.
* **Data Registry (Top)**:
  * `STYLE_PRESETS: Dict[str, Dict[str, Any]]` (Shonen, Seinen, Manhwa Webtoon, Shojo Romance, Cyberpunk Manga, Noir Comic)
* **Main Public API (Bottom)**:
  ```python
  def get_style_preset(style_name: str) -> Dict[str, Any]:
      """Returns curated rendering tokens, camera presets, and color palettes for the specified style."""
  ```
* **Exports**: `__all__ = ["get_style_preset"]`

---

### Module: `backend/features/ai/agent/`

#### 1. `workflow_service.py`
* **Role**: Canonical home for `AutonomousAgentWorkflow` (elevated from `creative/agent/workflow.py`). Orchestrates the complete 1-click autonomous comic-to-video director pipeline.
* **Local Helpers (Top)**:
  * `_scrape_webtoon_chapter(url: str) -> List[str]`
  * `_detect_and_crop_panels(images: List[str]) -> List[Dict[str, Any]]`
  * `_synthesize_voiceover_audio(panels: List[Dict[str, Any]], cast: Dict[str, str]) -> List[Dict[str, Any]]`
  * `_calculate_ken_burns_motion(panels: List[Dict[str, Any]]) -> List[Dict[str, Any]]`
  * `_compile_master_video(panels: List[Dict[str, Any]], format_type: str) -> str`
* **Main Public API (Bottom)**:
  ```python
  async def execute_autonomous_agent_pipeline(
      run_id: str,
      url: str,
      video_format: str = "shorts",
      language: str = "en",
      default_voice: str = "alloy",
      review_mode: bool = False,
      max_panels: Optional[int] = None,
      user_id: Optional[str] = None,
      progress_callback: Optional[Any] = None
  ) -> Dict[str, Any]:
      """Executes end-to-end autonomous comic chapter transformation into cinematic video."""
  ```
* **Exports**: `__all__ = ["execute_autonomous_agent_pipeline"]`

#### 2. `cast_manager_service.py`
* **Role**: Canonical home for `CastManager` (elevated from `creative/agent/cast_manager.py`). Identifies character identities across panels and assigns consistent neural voice profiles.
* **Local Helpers (Top)**:
  * `_match_character_voice(gender: str, role: str, language: str) -> str`
* **Main Public API (Bottom)**:
  ```python
  def resolve_character_cast(
      detected_characters: List[Dict[str, Any]],
      default_voice: str = "alloy",
      user_overrides: Optional[Dict[str, str]] = None
  ) -> List[Dict[str, Any]]:
      """Builds an immutable voice cast mapping character names to neural TTS voice models."""
  ```
* **Exports**: `__all__ = ["resolve_character_cast"]`

#### 3. `agent_run_service.py`
* **Role**: Manages active agent run jobs, SQLite persistence (`creative_agent_runs`), review checkpoints, and status polling.
* **Local Helpers (Top)**:
  * `_ensure_db_schema() -> None`
  * `_serialize_run_record(row: Any) -> Dict[str, Any]`
* **Main Public API (Bottom)**:
  ```python
  def get_agent_run_status(run_id: str) -> Optional[Dict[str, Any]]: ...
  def approve_agent_checkpoint(run_id: str, edits: Optional[Dict[str, Any]] = None) -> Dict[str, Any]: ...
  def list_user_agent_runs(user_id: str, limit: int = 50) -> List[Dict[str, Any]]: ...
  ```
* **Exports**: `__all__ = ["get_agent_run_status", "approve_agent_checkpoint", "list_user_agent_runs"]`

---

### Module: `backend/features/ai/series/`

#### 1. `arc_architect_service.py`
* **Role**: Plans multi-chapter franchise storylines, structuring episodic narrative beats (Introduction, Inciting Incident, Rising Action, Climax, Resolution).
* **Local Helpers (Top)**:
  * `_load_series_arc_skill(genre: str) -> str`
  * `_format_character_bible(characters: List[Dict[str, Any]]) -> str`
* **Main Public API (Bottom)**:
  ```python
  async def generate_series_story_arc(
      series_title: str,
      genre: str,
      logline: str,
      chapter_count: int = 5,
      characters: Optional[List[Dict[str, Any]]] = None,
      provider: str = "gemini",
      api_key: Optional[str] = None
  ) -> Dict[str, Any]:
      """Architects a multi-chapter dramatic story arc with continuous character progression."""
  ```
* **Exports**: `__all__ = ["generate_series_story_arc"]`

#### 2. `panel_synthesizer_service.py`
* **Role**: Transforms episodic chapter scripts into panel-by-panel generative prompts with consistent character DNA, camera shots, and lighting cues.
* **Local Helpers (Top)**:
  * `_build_character_dna_token(character: Dict[str, Any]) -> str`
* **Main Public API (Bottom)**:
  ```python
  async def synthesize_chapter_panels(
      chapter_script: str,
      character_bibles: List[Dict[str, Any]],
      art_style: str = "manhwa",
      panel_count: int = 10
  ) -> List[Dict[str, Any]]:
      """Generates character-consistent generative diffusion prompts for all panels in a chapter."""
  ```
* **Exports**: `__all__ = ["synthesize_chapter_panels"]`

#### 3. `series_image_service.py`
* **Role**: Generates high-definition panel artwork via diffusion models (Flux/SDXL/Pollinations) and persists rendered assets to disk and static mounts.
* **Local Helpers (Top)**:
  * `_download_and_cache_rendered_image(image_bytes: bytes, series_id: str, chapter_id: str, panel_idx: int) -> str`
* **Main Public API (Bottom)**:
  ```python
  async def render_series_panel_image(
      prompt: str,
      series_id: str,
      chapter_id: str,
      panel_index: int,
      negative_prompt: Optional[str] = None,
      aspect_ratio: str = "9:16"
  ) -> Dict[str, Any]:
      """Renders a panel image via generative diffusion and caches it to local series media storage."""
  ```
* **Exports**: `__all__ = ["render_series_panel_image"]`

#### 4. `series_audio_service.py`
* **Role**: Multi-character voice dubbing coordinator delegating synthesis to `features.audio` while tracking character vocal consistency.
* **Local Helpers (Top)**:
  * `_resolve_character_voice_code(speaker: str, character_records: List[Dict[str, Any]]) -> str`
* **Main Public API (Bottom)**:
  ```python
  async def dub_series_chapter_audio(
      series_id: str,
      chapter_id: str,
      dialogue_items: List[Dict[str, Any]],
      characters: List[Dict[str, Any]]
  ) -> List[Dict[str, Any]]:
      """Synthesizes character-consistent voiceover dialogue for all panels in a series chapter."""
  ```
* **Exports**: `__all__ = ["dub_series_chapter_audio"]`

#### 5. `series_memory_engine.py`
* **Role**: Long-term episodic memory engine tracking character relationships, physical wounds, inventory, and canonical lore across multiple chapters.
* **Local Helpers (Top)**:
  * `_extract_canonical_events(chapter_summary: str) -> List[Dict[str, Any]]`
* **Main Public API (Bottom)**:
  ```python
  def update_series_canon_memory(
      series_id: str,
      chapter_index: int,
      events: List[Dict[str, Any]],
      character_state_updates: Dict[str, Any]
  ) -> Dict[str, Any]:
      """Records episodic plot developments into franchise long-term memory."""
  ```
* **Exports**: `__all__ = ["update_series_canon_memory"]`

#### 6. `series_orchestrator_service.py`
* **Role**: Master workflow coordinator for progressive chapter creation, asset rendering, audio generation, and packaging.
* **Local Helpers (Top)**:
  * `_validate_chapter_prerequisites(series_id: str, chapter_id: str) -> None`
* **Main Public API (Bottom)**:
  ```python
  async def produce_series_chapter(
      series_id: str,
      chapter_title: str,
      prompt_summary: str,
      render_visuals: bool = True,
      generate_audio: bool = True
  ) -> Dict[str, Any]:
      """Orchestrates end-to-end production of a new series chapter from prompt to final render."""
  ```
* **Exports**: `__all__ = ["produce_series_chapter"]`

---

### Module: `backend/features/ai/translation/`

#### 1. `dialogue_translation_service.py`
* **Role**: Canonical single-dialogue localization service (unifying `creative/translation` and `intelligence/ai/router/translation.py`).
* **Local Helpers (Top)**:
  * `_build_translation_prompt(text: str, target_lang: str, tone: str, context: Optional[str]) -> str`
  * `_sanitize_translated_dialogue(raw_output: str) -> str`
* **Main Public API (Bottom)**:
  ```python
  async def translate_comic_dialogue(
      text: str,
      target_lang: str = "Japanese",
      tone: str = "natural",
      context: Optional[str] = None,
      provider: str = "gemini",
      api_key: Optional[str] = None
  ) -> Dict[str, Any]:
      """Translates comic dialogue into target language preserving honorifics, humor, and genre tone."""
  ```
* **Exports**: `__all__ = ["translate_comic_dialogue"]`

#### 2. `batch_translation_service.py`
* **Role**: Chapter-wide multi-panel dialogue translation with character voice consistency and glossary enforcement.
* **Local Helpers (Top)**:
  * `_build_batch_translation_payload(items: List[Dict[str, Any]], glossary: Optional[Dict[str, str]]) -> str`
* **Main Public API (Bottom)**:
  ```python
  async def batch_translate_chapter_dialogues(
      dialogue_items: List[Dict[str, Any]],
      target_lang: str,
      character_glossary: Optional[Dict[str, str]] = None,
      provider: str = "gemini",
      api_key: Optional[str] = None
  ) -> List[Dict[str, Any]]:
      """Batch translates all dialogue bubbles in a chapter while enforcing consistent naming glossaries."""
  ```
* **Exports**: `__all__ = ["batch_translate_chapter_dialogues"]`

---

### Module: `backend/features/ai/thumbnails/`

#### 1. `thumbnail_prompt_service.py`
* **Role**: Canonical home for `ai_skill.py` (elevated from `creative/thumbnails/ai_skill.py`). Designs high-CTR clickbait thumbnail concepts and composition layouts.
* **Local Helpers (Top)**:
  * `_build_thumbnail_director_prompt(series_title: str, genre: str, prompt: str) -> str`
* **Main Public API (Bottom)**:
  ```python
  async def generate_thumbnail_concepts(
      series_title: str,
      genre: str,
      prompt: str,
      count: int = 3,
      provider: str = "gemini",
      api_key: Optional[str] = None
  ) -> List[Dict[str, Any]]:
      """Generates high-CTR thumbnail prompts, camera angles, color palettes, and text badge overlays."""
  ```
* **Exports**: `__all__ = ["generate_thumbnail_concepts"]`

#### 2. `thumbnail_composer_service.py`
* **Role**: Canonical home for `generator.py` (elevated from `creative/thumbnails/generator.py`). Composites rendered diffusion art with stylized comic lettering, vignette effects, and glowing borders.
* **Local Helpers (Top)**:
  * `_render_curved_text_badge(draw: Any, text: str, width: int, height: int, style: str) -> None`
  * `_apply_dramatic_vignette(image: Image.Image, intensity: float) -> Image.Image`
* **Main Public API (Bottom)**:
  ```python
  def composite_cinematic_thumbnail(
      background_image: Image.Image,
      headline_text: Optional[str] = None,
      character_overlay: Optional[Image.Image] = None,
      target_width: int = 1280,
      target_height: int = 720,
      theme: str = "action_gold"
  ) -> Image.Image:
      """Composites a professional 16:9 YouTube/Webtoon cover thumbnail with text banners and lightning borders."""
  ```
* **Exports**: `__all__ = ["composite_cinematic_thumbnail"]`

---

### Module: `backend/features/ai/training/`

#### 1. `yolo_training_service.py`
* **Role**: Coordinates fine-tuning of Ultralytics YOLOv8 models for comic speech bubble detection and panel segmentation.
* **Local Helpers (Top)**:
  * `_verify_dataset_yaml(data_yaml_path: str) -> bool`
  * `_build_yolo_train_args(epochs: int, batch_size: int, imgsz: int, device: str) -> Dict[str, Any]`
* **Main Public API (Bottom)**:
  ```python
  async def launch_yolo_training_job(
      dataset_dir: str,
      model_type: Literal["bubble", "panel"] = "bubble",
      epochs: int = 50,
      batch_size: int = 16,
      imgsz: int = 640
  ) -> Dict[str, Any]:
      """Launches background YOLO fine-tuning job on labeled comic datasets."""
  ```
* **Exports**: `__all__ = ["launch_yolo_training_job"]`

#### 2. `training_monitor_service.py`
* **Role**: Telemetry monitor tracking training epochs, box loss, class loss, validation mAP50, and dataset sample count.
* **Local Helpers (Top)**:
  * `_read_training_csv(csv_path: str) -> List[Dict[str, Any]]`
* **Main Public API (Bottom)**:
  ```python
  def get_active_training_metrics(job_id: str) -> Dict[str, Any]:
      """Returns live progress metrics, validation loss curves, and ETA for a training run."""
  ```
* **Exports**: `__all__ = ["get_active_training_metrics"]`

---

### Module: `backend/features/ai/catalog/`

#### 1. `model_catalog_service.py`
* **Role**: Decomposed from `facade.py` (`facade_list_models`). Queries active LLM, Vision, and Diffusion providers, returning supported models, token context limits, and rate limits.
* **Local Helpers (Top)**:
  * `_fetch_gemini_models_safe(api_key: str) -> List[Dict[str, Any]]`
  * `_fetch_openai_models_safe(api_key: str) -> List[Dict[str, Any]]`
  * `_fetch_anthropic_models_safe(api_key: str) -> List[Dict[str, Any]]`
* **Main Public API (Bottom)**:
  ```python
  async def list_available_ai_models(
      provider: str,
      api_key: Optional[str] = None
  ) -> Dict[str, Any]:
      """Queries live provider endpoints returning available models, categories, and quota specifications."""
  ```
* **Exports**: `__all__ = ["list_available_ai_models"]`

#### 2. `latency_benchmark_service.py`
* **Role**: Benchmarks round-trip inference latency and tokens-per-second across configured AI providers.
* **Local Helpers (Top)**:
  * `_measure_ping(provider: str, model: str, test_prompt: str) -> float`
* **Main Public API (Bottom)**:
  ```python
  async def benchmark_provider_latency(
      provider: str,
      model: str,
      api_key: Optional[str] = None
  ) -> Dict[str, Any]:
      """Executes a diagnostic inference probe, measuring response latency and token throughput."""
  ```
* **Exports**: `__all__ = ["benchmark_provider_latency"]`

#### 3. `token_analytics_service.py`
* **Role**: Computes estimated token consumption, cost estimates, and creator credit deduction.
* **Local Helpers (Top)**:
  * `_estimate_token_count(text: str) -> int`
* **Main Public API (Bottom)**:
  ```python
  def calculate_token_usage_cost(
      input_tokens: int,
      output_tokens: int,
      model_name: str
  ) -> Dict[str, Any]:
      """Calculates estimated financial cost and credits required for an inference run."""
  ```
* **Exports**: `__all__ = ["calculate_token_usage_cost"]`

---

### Module: `backend/features/ai/utils/` (Pure Foundational Layer)

#### 1. `prompt_builder.py`
* **Role**: Pure string utility for assembling system prompts, user turns, and few-shot examples with variable substitution.
* **Main Public API (Bottom)**:
  ```python
  def assemble_system_prompt(template: str, variables: Dict[str, Any]) -> str: ...
  def sanitize_llm_json_response(raw_response: str) -> str: ...
  ```
* **Exports**: `__all__ = ["assemble_system_prompt", "sanitize_llm_json_response"]`

#### 2. `story_memory_tracker.py`
* **Role**: Decomposed from `facade.py`. Self-contained `StoryMemoryTracker` class maintaining active scene context, character rosters, and sliding dialogue buffers.
* **Exports**: `__all__ = ["StoryMemoryTracker"]`

#### 3. `duration_estimator.py`
* **Role**: Speech duration math based on word count and speech rate.
* **Main Public API (Bottom)**:
  ```python
  def estimate_speech_duration(text: str, wpm: int = 145) -> float: ...
  ```
* **Exports**: `__all__ = ["estimate_speech_duration"]`

---

## 5. Architectural Guarantees: Caller Discipline & Backward Compatibility

### 5.1 Strict Caller Discipline
1. **No External Imports of `_helpers`**: Outside modules, routers, and test cases call **only** the single exported public function at the bottom of each service file.
2. **Explicit Encapsulation via `__all__`**: Every service module defines `__all__` exposing only its canonical public API function.
3. **Decoupled Engine vs Domain AI**:
   - `backend/ai_engine/providers/*` handles raw hardware integration, network protocols, and process management.
   - `backend/features/ai/` handles comic storyboard business logic, narrative continuity, character casting, and user project models.
4. **Foundational Independence**: `utils/` contains pure helper functions and never imports high-level domain services or routers.
5. **Facade Class & Singleton**: `service.py` provides the canonical `AIService` class and `ai_service` singleton which delegates cleanly to the new modular service functions.

### 5.2 100% Backward Compatibility Guarantees
To ensure zero regressions across all existing frontends, worker tasks, and test suites:
1. **Transparent Re-Exports in `features/creative/`**:
   - `backend/features/creative/agent/service.py` becomes a thin shim delegating to `features.ai.agent`.
   - `backend/features/creative/thumbnails/service.py` delegates to `features.ai.thumbnails`.
   - `backend/features/creative/translation/service.py` delegates to `features.ai.translation`.
2. **Transparent Re-Exports in `features/intelligence/`**:
   - `backend/features/intelligence/service.py` and `router.py` re-export from `features.ai`.
   - `backend/features/intelligence/series/` re-exports from `features.ai.series`.
3. **Legacy Route Aliases**:
   - All legacy route prefixes (`/api/v1/ai/*`, `/api/v1/ai-series/*`, `/api/v1/creative/agent/*`, `/api/v1/creative/thumbnails/*`, `/api/v1/creative/translation/*`) continue functioning identically.
4. **Test Suite Integrity**:
   - `test_09_ai_providers.py`, `test_12_ai_series.py`, `test_14_creative_agent.py`, `test_15_creative_thumbnails.py`, and `test_16_creative_translation.py` will continue running cleanly with zero modifications.

---

## 6. Migration & Consolidation Roadmap (For Execution)

| Phase | Target Scope | Key Tasks |
| :--- | :--- | :--- |
| **Phase 1** | **Foundational Utils & Catalog** | Populate `features/ai/utils/` (`prompt_builder.py`, `story_memory_tracker.py`, `duration_estimator.py`). Extract `features/ai/catalog/` (`model_catalog_service.py`, `latency_benchmark_service.py`, `token_analytics_service.py`). |
| **Phase 2** | **Decompose Monolithic Facade into Analysis** | Break down `facade.py` into `features/ai/analysis/` (`panel_analyzer_service.py`, `batch_analyzer_service.py`, `smart_crop_service.py`, `narrative_analyzer_service.py`). Wire transparent backward re-export shim in `features/intelligence/ai/services/facade.py`. |
| **Phase 3** | **Prompt Engineering & Translation Unification** | Deploy `features/ai/prompts/` (`prompt_enhancer_service.py`, `style_preset_service.py`). Unify duplicate translations into `features/ai/translation/` (`dialogue_translation_service.py`, `batch_translation_service.py`). |
| **Phase 4** | **Autonomous Agent & Thumbnail Elevation** | Elevate autonomous director agent from `creative/agent/` into `features/ai/agent/`. Elevate thumbnail generator from `creative/thumbnails/` into `features/ai/thumbnails/`. Deploy backward-compatibility facades. |
| **Phase 5** | **AI Series Studio Elevation** | Elevate `intelligence/series/` into `features/ai/series/` adhering strictly to the "Helpers at Top, Main API at Bottom" standard with explicit `__all__` exports. |
| **Phase 6** | **Training Services & Modular Routers** | Standardize `features/ai/training/` (`yolo_training_service.py`, `training_monitor_service.py`). Wire unified modular routers in `features/ai/router/` and register compatibility mounts in `app/router/router.py`. |
| **Phase 7** | **Verification & Test Suite Validation** | Run full test suite (`test_09`, `test_12`, `test_14`, `test_15`, `test_16`) to verify 100% test pass rate and backward compatibility. |
