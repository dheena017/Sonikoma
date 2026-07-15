# Sonikoma — AI Story Director Phased Implementation Roadmap

This document outlines the systematic, phased implementation strategy to evolve Sonikoma from a panel-by-panel comic editor into a cohesive **AI Story Director platform**.

---

## Phase 1: Relational Schema Expansion (Narrative Model)
* **Purpose:** Establish the single source of truth narrative model. Establish database-level relationships where each chapter/project holds a dedicated `Narrative` entity.
* **Database Changes:**
  - Create table `narratives`:
    - `id` (TEXT PRIMARY KEY)
    - `chapter_id` (TEXT UNIQUE, FOREIGN KEY REFERENCES chapters(id) ON DELETE CASCADE)
    - `title` (TEXT NOT NULL)
    - `summary` (TEXT)
    - `narration_script` (TEXT)
    - `genre` (TEXT)
    - `tone` (TEXT)
    - `target_audience` (TEXT)
    - `story_goal` (TEXT)
    - `characters` (TEXT) -- JSON String containing list of character profiles
    - `emotion_curve` (TEXT) -- JSON String mapping panel indices to tension metrics
    - `audio_direction` (TEXT)
    - `created_at` (TEXT NOT NULL DEFAULT (datetime('now')))
    - `updated_at` (TEXT NOT NULL DEFAULT (datetime('now')))
  - Migrate table `panels` to support the following columns:
    - `dialogue` (TEXT), `subtitle` (TEXT), `scene_description` (TEXT), `camera_motion` (TEXT), `camera_zoom` (TEXT), `timing` (REAL), `transition` (TEXT), `voice_emotion` (TEXT), `speech_speed` (REAL), `voice_intensity` (REAL), `background_music` (TEXT), `sound_effects` (TEXT), `story_consistency_score` (REAL), `dialogue_quality_score` (REAL), `visual_continuity_score` (REAL), `audio_quality_score` (REAL).
* **Files to Modify:**
  - `backend/database/schema.sql` (Add tables & columns)
  - `backend/python/database/db.py` (Add SQLite/PostgreSQL migrations, CRUD helpers)
* **Backend changes:** Update initialization code to run migrations on startup without erasing existing user projects or chapter records.
* **API changes:** None in this phase.
* **Testing:**
  - Run database creation tests to verify foreign key constraints and schema queries.
  - Test SQLite CRUD functions using in-memory test databases.
* **Estimated Complexity:** Low (1-2 Days)

---

## Phase 2: AI Sequence Analyzer (Story Director Service)
* **Purpose:** Implement the context-aware multimodal AI compiler that reads all panels collectively to produce the single master Narrative document.
* **API Changes:**
  - Create endpoint `POST /api/narratives/analyze-sequence`:
    - Inputs: chapter_id/project_id, target model, narration style.
    - Output: Complete Narrative JSON model.
* **Files to Modify:**
  - `backend/python/routes/ai_routes.py` (Mount new narrative route)
  - `backend/python/routes/projects.py` (Allow loading narrative along with single project queries)
  - Create new skill `backend/python/skills/sequence_director.py` (Orchestrate system prompt and output structure for Gemini 2.5 Flash)
* **Backend changes:**
  - Write sequence analysis prompt that accepts: original images (downscaled to prevent context limit errors), OCR text arrays, character information, panel indices, and story objectives.
  - Return clean JSON formatted precisely to match the `narratives` schema.
* **Frontend changes:** None in this phase.
* **Testing:**
  - Mock multimodal Gemini payload responses and test JSON parsers.
  - Validate that token usage metrics are logged correctly in `token_usage_logs`.
* **Estimated Complexity:** High (3-4 Days)

---

## Phase 3: Collapsible Story Director UI Panel
* **Purpose:** Build the unified control console above the storyboard timeline where users edit scripts and trigger director processes.
* **Files to Modify:**
  - Create component `frontend/src/components/Feature/timeline/StoryDirectorPanel.tsx`
  - `frontend/src/components/Feature/editor/Layout/EditorPage.tsx` (Render panel above the timeline)
* **Frontend changes:**
  - Implement a beautiful, collapsible dark glassmorphic panel.
  - Include sections for: Story Overview, Genre & Tone, Goal & Audience, Character Bios, and a large, highly functional **Narration Script Editor**.
  - Add action buttons: "Analyze Full Sequence", "Improve Story", "Regenerate Story", "Apply to Panels", "Generate Narration Audio", and "Generate Final Video".
* **Backend changes:** None.
* **Testing:**
  - Verify collapsible layout, viewport responsive scaling, and state retention under React hot reloads.
* **Estimated Complexity:** Medium (2-3 Days)

---

## Phase 4: Decoupled Script & Speech Provider Interface
* **Purpose:** Establish the polymorphic, credential-free Speech Factory that separates script modifications from automatic audio compilation.
* **Files to Modify:**
  - Create `backend/python/media/audio/speech_provider.py` (Establish polymorphic abstract class and factory loaders)
  - Create concrete providers in `backend/python/media/audio/providers/`:
    - `EdgeTTSProvider.py`
    - `OpenAIProvider.py`
    - `ElevenLabsProvider.py`
    - `AzureProvider.py`
  - Create endpoint `POST /api/narratives/{chapter_id}/generate-audio`:
    - Reads finalized narration script and compiles audio sequentially using the selected speech provider.
* **API Changes:**
  - Create `GET /api/audio/providers` to list available audio models and credentials status.
* **Testing:**
  - Test provider fallbacks (Edge-TTS as solid standard when cloud credentials are unconfigured).
  - Verify chunked audio output concatenation using pydub/FFmpeg.
* **Estimated Complexity:** Medium (3-4 Days)

---

## Phase 5: Panel Synchronization & "Apply to Panels"
* **Purpose:** Synchronize Narrative context down to individual panels, establishing the parent document as the authoritative manager of dialogues, transitions, and timing.
* **API Changes:**
  - Create endpoint `POST /api/narratives/{chapter_id}/sync-panels`:
    - Propagates narrative parameters to child panel items, applying custom transitions, camera motions, BGM, and scoring metrics.
* **Files to Modify:**
  - `backend/python/routes/projects.py` (API handler)
  - `backend/python/database/db.py` (Relational child updates)
* **Frontend changes:**
  - Bind the "Apply to Panels" button to call the synchronization API.
  - Display progress indicators and toast notifications on successful syncs.
* **Testing:**
  - Verify that manual panel edits are protected until the user explicitly initiates a sync overwrite.
* **Estimated Complexity:** Medium (2-3 Days)

---

## Phase 6: Widescreen Cinematic Player & Compiler Updates
* **Purpose:** Evolve both the browser-based inline `CinemaPlayer` and the backend `MoviePy` compiler to handle the enhanced, context-rich cinematic experience.
* **Files to Modify:**
  - `frontend/src/components/Feature/video/CinemaPlayer.tsx` (Add subtitle overlays, audio mixing playback, and transition wiggles)
  - `backend/python/media/video.py` (Add support for soft subtitles, fading music tracks, and custom camera pans)
* **Backend changes:**
  - Read transition cues, sfx timestamps, and BGM parameters from the database, compiling them as complex overlays.
* **Frontend changes:**
  - Playback synchronizer that drives progress bars, subtitles overlays, and timeline playheads concurrently.
* **Testing:**
  - Playback testing with multi-channel audio tracks.
  - End-to-end visual tests of widescreen MP4 exports.
* **Estimated Complexity:** High (4-5 Days)
