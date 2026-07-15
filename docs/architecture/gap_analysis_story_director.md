# Sonikoma — AI Story Director Gap Analysis

This document identifies the architectural, procedural, database, and user interface gaps between the current system and the target **AI Story Director** vision.

---

## 1. Architectural & Conceptual Gaps
* **Current Model:** Panel-centric. AI operations and editing properties are scoped to individual panels (`panels` table rows), causing disjointed visual and audio outputs.
* **Target Vision:** Master Narrative-centric. The AI acts as a Director that analyzes the entire sequence of panels to draft a unified **Narrative Document** (single source of truth). Individual panels synchronize and inherit their context, characters, emotion curves, and camera motions directly from this parent Narrative.

---

## 2. Identified Gap Classifications

### A. Missing Database Tables & Schema Fields
1. **`narratives` Table (Missing):** Needs a dedicated 1-to-1 relational entity table nested under `chapters` with support for history versioning.
   - Fields: `id`, `chapter_id`, `title`, `summary`, `narration_script`, `genre`, `tone`, `target_audience`, `story_goal`, `characters` (JSON character profiles), `emotion_curve` (JSON pacing index), `audio_direction`, `created_at`, `updated_at`.
2. **Enhanced `panels` Fields (Missing):**
   - Scoring indicators: `story_consistency_score`, `dialogue_quality_score`, `visual_continuity_score`, `audio_quality_score`.
   - Audio styling parameters: `voice_emotion`, `speech_speed`, `voice_intensity`, `background_music`, `sound_effects`.
   - Structural flow parameters: `subtitle`, `scene_description`, `camera_motion`, `camera_zoom`, `transition`, `timing`.

### B. Missing Backend Services & APIs
1. **Narrative Generation Service:** A global multimodal analysis service (`POST /api/narrative/generate`) that aggregates all panels, runs OCR text, merges metadata, and feeds them into Gemini 2.5 Flash to output a unified, comprehensive `Narrative` JSON model.
2. **Speech Provider Factory & Service Interface:**
   - Evolve current Edge-TTS into a plug-and-play polymorphic `SpeechProvider` factory pattern.
   - Ready-to-implement providers: `OpenAIProvider`, `ElevenLabsProvider`, `GoogleProvider`, `AzureProvider`, `AmazonPollyProvider`, and `EdgeTTSProvider`.
3. **Synchronized Panel Generation Service (`POST /api/narrative/apply`):** Translates narrative beats and emotion curves into panel-level fields (pacing, custom voice intensities, exact cinematic timings, and transitions).

### C. Missing UI Panels & Components
1. **Story Director Dashboard Panel:** A collapsible, high-fidelity control section placed directly above the Storyboard Timeline in `EditorPage.tsx`. It will display and allow real-time editing of:
   - Story Overview, Title, Genre, and Tone.
   - Goal, Target Audience, and Character Bios.
   - A large, highly interactive **Narration Script Editor** where users refine speech before triggering any audio compiler.
   - Collapsible sub-sections for Audio Directions and Emotion Curves.
2. **Action Trigger Buttons:**
   - **`Analyze Full Sequence`**: Executes narrative generation.
   - **`Improve Story`**: Enhances narrative beats using custom prompt tuning.
   - **`Regenerate Story`**: Re-analyzes sequence and overwrites script.
   - **`Apply to Panels`**: Manually synchronizes Narrative properties down to panels.
   - **`Generate Narration Audio`**: Triggers batch voice generation from the finalized narration script.
   - **`Generate Final Video`**: Initiates final MoviePy compilation.

### D. Missing Editor & Playback Functionality
1. **Separated Narration Script Compilation:** Audio synthesis must decouple from raw storyboard generation. Script editing happens entirely in-browser, and voice tracks compile only upon explicit user approval.
2. **Advanced Cinematic Audio Mixes:** Ambient sound effects, fade-in/out timings, and background music volume transitions driven by the Narrative's emotion curve.
3. **Player Upgrades:** Evolve `CinemaPlayer` into a fully integrated cinematic previewer that reads narrative parameters, overlaying soft subtitle tracks, panning/zooming frames relative to current playtime, and mixing narration with ambient sound cues.

---

## 3. Prioritized Feature Roadmap
To transition from a panel editor to an AI Story Director, missing features are ranked below by execution priority.

| Priority | Feature / Gap | Classification | Description | Complexity |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **`narratives` Database Model** | Schema | Create dedicated relational narrative schema with SQLite migrations. | Low |
| **2** | **"Analyze Full Sequence" Service** | Backend API | Implement multimodal sequence analysis API returning complete Narrative JSON. | High |
| **3** | **Story Director UI Panel** | Frontend UI | Create collapsible control deck above the storyboard timeline (Title, Script, buttons). | Medium |
| **4** | **Speech Provider Interface & Factory** | Backend Service | Implement polymorphic `SpeechProvider` interface with factory loader. | Medium |
| **5** | **Decoupled Audio Generation Workflow** | API / UI | Separation of script editing from audio generation. "Generate Narration Audio" button. | Medium |
| **6** | **"Apply to Panels" Synchronization** | Backend API | Downstream synchronization of narrative properties to panel properties. | Medium |
| **7** | **Cinematic Video Compiler & Mix** | Backend / Engine | MoviePy video rendering updates to support transitions, narrative pacing, and subtitle tracks. | High |
| **8** | **Evolved Cinema Player Previewer** | Frontend Player | Synchronize narration playback, soft-burnt subtitles, and cinematic pans in browser. | High |
| **9** | **Continuous Refactoring & Cleanups** | Refactoring | Erase duplicated codes, simplify state hooks, split oversized components. | Medium |
