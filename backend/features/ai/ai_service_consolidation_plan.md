# Exhaustive Specification: Unified `backend/features/ai/` Architecture

## Executive Blueprint: Elevating AI to a First-Class Canonical Domain

In alignment with Sonikoma's top-level domain consolidation:
- Visual tools live in **`backend/features/image/`**
- Sound and voice tools live in **`backend/features/audio/`**
- Video making tools live in **`backend/features/video/`**

This document establishes **`backend/features/ai/`** as the single, authoritative home for all Artificial Intelligence (AI) and Machine Learning (ML) features across Sonikoma.

---

## 1. Directory Blueprint (Clean & Simplest English)

Every folder, file, and function is named in plain, everyday English so its exact job is immediately obvious to any developer:

```
backend/features/ai/
│
├── __init__.py                       # Main package entrypoint
├── schemas.py                        # All data models and inputs/outputs
├── service.py                        # Main AIService class and ai_service instance
├── README.md                         # How this module works
├── ai_service_consolidation_plan.md  # This complete architecture blueprint
│
├── analysis/                         # ── 1. LOOKING AT COMIC PANELS ──
│   ├── __init__.py
│   ├── analyze_panel.py              # Look at one panel (find words, speaker, mood, camera)
│   ├── analyze_batch.py              # Look at many panels in a row without crashing
│   ├── smart_crop.py                 # Find where comic panels are and cut them out cleanly
│   ├── match_bubbles.py              # Match speech bubbles to the character who is talking
│   ├── detect_emotion.py             # Figure out if character is whispering, shouting, or calm
│   └── detect_sfx.py                 # Find sound effects like "BOOM", "SLASH", "DODODO"
│
├── narrative/                        # ── 2. STORY MEMORY & SCRIPTS ──
│   ├── __init__.py
│   ├── story_memory.py               # Remember what happened before (characters, wounds, scenes)
│   ├── story_pacing.py               # Check story speed, tension, and scene changes
│   └── write_script.py               # Turn comic bubbles into a spoken story script
│
├── prompts/                          # ── 3. PROMPT HELPER TOOLS ──
│   ├── __init__.py
│   ├── improve_prompt.py             # Take a simple idea and make it detailed and cinematic
│   ├── image_prompts.py              # Make positive and negative prompts for image models
│   └── style_presets.py              # Visual styles (Shonen, Manhwa, Dark Manga, Comic)
│
├── agent/                            # ── 4. 1-CLICK AUTONOMOUS VIDEO AGENT ──
│   ├── __init__.py
│   ├── agent_workflow.py             # Runs the whole process (read link -> make video)
│   ├── agent_scraper.py              # Downloads webtoon chapter pictures from a web link
│   ├── agent_script.py               # Writes the voiceover script for the agent
│   ├── agent_voices.py               # Picks the best AI voice for each character
│   ├── agent_director.py             # Decides camera moves (zoom, pan) and builds the video
│   └── agent_jobs.py                 # Saves agent progress, history, and approval checks
│
├── series/                           # ── 5. AI SERIES CREATOR STUDIO ──
│   ├── __init__.py
│   ├── story_planner.py              # Plans story arcs over 5 to 20 episodes
│   ├── chapter_writer.py             # Writes out scene beats and lines for an episode
│   ├── panel_prompts.py              # Creates picture prompts keeping characters looking the same
│   ├── image_generator.py            # Generates images using AI and saves them to disk
│   ├── voice_dubber.py               # Generates AI voices for all characters in a chapter
│   ├── series_memory.py              # Long-term memory for lore, secrets, and relationships
│   ├── chapter_builder.py            # Puts a whole new chapter together from start to finish
│   ├── repositories.py               # Database storage for series, characters, and chapters
│   └── styles/                       # Art styles for anime, manga, manhwa, and comics
│       ├── __init__.py
│       ├── anime.py
│       ├── manga.py
│       ├── manhwa.py
│       ├── western_comic.py
│       └── presets.py
│
├── translation/                      # ── 6. TRANSLATION & LOCALIZATION ──
│   ├── __init__.py
│   ├── translate_speech.py           # Translates one dialogue line keeping comic slang and tone
│   ├── translate_chapter.py          # Translates all panels in a chapter together
│   └── names_dictionary.py           # Keeps character names and magic attacks consistent
│
├── thumbnails/                       # ── 7. COVER & THUMBNAIL STUDIO ──
│   ├── __init__.py
│   ├── thumbnail_ideas.py            # Generates click-worthy hook ideas and angles
│   ├── thumbnail_prompts.py          # Makes 16:9 image prompts for YouTube covers
│   └── thumbnail_builder.py          # Draws title badges, lightning borders, and character cutouts
│
├── chat/                             # ── 8. AI CREATOR ASSISTANT ──
│   ├── __init__.py
│   ├── chat_assistant.py             # Chats with creator to help brainstorm and fix scripts
│   └── chat_context.py               # Feeds current comic project info to the chat
│
├── training/                         # ── 9. TRAINING DETECTION MODELS ──
│   ├── __init__.py
│   ├── train_detector.py             # Trains YOLO to find speech bubbles on your own comics
│   ├── prep_dataset.py               # Prepares and cleans comic training images and boxes
│   └── track_training.py             # Tracks training graphs, speed, and accuracy (mAP)
│
├── catalog/                          # ── 10. AI MODELS & TOKEN COSTS ──
│   ├── __init__.py
│   ├── list_models.py                # Shows all available models (Gemini, OpenAI, Claude, etc.)
│   ├── test_model_speed.py           # Tests response time (ping) for each AI provider
│   └── track_costs.py                # Counts tokens used and calculates user credit cost
│
├── utils/                            # ── 11. HELPER TOOLS ──
│   ├── __init__.py                   # Clean exports of all basic helpers
│   ├── prompt_builder.py             # Fills variables into prompt templates safely
│   ├── clean_json.py                 # Fixes broken JSON returned by AI models
│   ├── speech_timer.py               # Estimates spoken seconds from words and speaking speed
│   └── image_loader.py               # Loads base64 and web pictures safely into memory
│
└── router/                           # ── 12. WEB API ENDPOINTS (/api/v1/ai) ──
    ├── __init__.py                   # Combines all routes into unified ai_router
    ├── analysis.py                   # /analyze-single-image, /analyze-all-panels, /smart-crop
    ├── narrative.py                  # /narrative/sequence, /narrative/dramatize
    ├── prompts.py                    # /enhance-prompt, /style-presets
    ├── agent.py                      # /creative/agent/run, /status/{id}, /approve/{id}
    ├── series.py                     # /ai-series/* (projects, chapters, characters, memory)
    ├── translation.py                # /translate, /batch-translate, /glossary
    ├── thumbnails.py                 # /creative/thumbnails/generate
    ├── chat.py                       # /chat/completions, /chat/sessions
    ├── training.py                   # /save-training-data, /training-status
    └── catalog.py                    # /list-models, /models/routing, /test-latency, /analytics
```

---

## 2. Plain English Naming & Function Translation Table

| Sub-Module | Simple File Name | Main Function Name | What It Does (Simplest English) |
| :--- | :--- | :--- | :--- |
| **Analysis** | `analyze_panel.py` | `read_panel(...)` | Reads one comic panel: finds words, speaker, mood, and camera move. |
| **Analysis** | `analyze_batch.py` | `read_many_panels(...)` | Reads all panels in an episode safely without rate-limit errors. |
| **Analysis** | `smart_crop.py` | `cut_out_panels(...)` | Finds panels in a long webtoon strip and cuts them into separate picture files. |
| **Analysis** | `match_bubbles.py` | `match_bubbles_to_faces(...)`| Connects speech bubbles to the face closest to the bubble's pointer tail. |
| **Analysis** | `detect_emotion.py` | `find_emotion(...)` | Checks if a character is screaming, whispering, terrified, or calm. |
| **Analysis** | `detect_sfx.py` | `find_sound_effects(...)` | Identifies visual sound words (*BOOM*, *SLASH*, *DODODO*) to pick audio sounds. |
| **Narrative**| `story_memory.py` | `remember_story(...)` | Remembers what happened in past panels so characters stay consistent. |
| **Narrative**| `story_pacing.py` | `check_pacing(...)` | Checks scene excitement, quiet pauses, and scene transitions. |
| **Narrative**| `write_script.py` | `write_story_script(...)` | Turns dialogue and scene actions into a spoken narrator script. |
| **Prompts**  | `improve_prompt.py`| `make_better_prompt(...)`| Takes a simple prompt ("hero fight") and makes it rich and cinematic. |
| **Prompts**  | `image_prompts.py` | `make_image_prompts(...)` | Builds positive and negative prompts for image models (Flux/SDXL). |
| **Prompts**  | `style_presets.py` | `get_art_style(...)` | Returns keyword settings for styles (Shonen, Manhwa, Dark Manga, Comic). |
| **Agent**    | `agent_workflow.py`| `start_video_agent(...)` | Master 1-click runner: scrapes chapter -> cuts -> speaks -> makes video. |
| **Agent**    | `agent_scraper.py` | `download_chapter(...)` | Downloads chapter pictures from a web link into the agent folder. |
| **Agent**    | `agent_script.py`  | `write_agent_script(...)` | Reads lines from pictures and writes voiceover lines for each panel. |
| **Agent**    | `agent_voices.py`  | `assign_voices(...)` | Picks the best AI voice for each detected character. |
| **Agent**    | `agent_director.py`| `make_agent_video(...)` | Plans zoom/pan camera moves and compiles the final MP4 video. |
| **Agent**    | `agent_jobs.py`    | `check_job(...)`, `approve_job(...)`| Saves job progress, user review checks, and run history. |
| **Series**   | `story_planner.py` | `plan_story_arc(...)` | Plans out a full 5 to 20 chapter story arc with cliffhangers. |
| **Series**   | `chapter_writer.py`| `write_chapter(...)` | Writes panel actions and character speaking lines for an episode. |
| **Series**   | `panel_prompts.py` | `make_panel_prompts(...)` | Creates image prompts with tags that keep character faces consistent. |
| **Series**   | `image_generator.py`| `make_panel_image(...)` | Generates high-res panel art using AI diffusion and saves to disk. |
| **Series**   | `voice_dubber.py`  | `dub_chapter_voices(...)` | Generates AI voices for all characters in an episode. |
| **Series**   | `series_memory.py` | `save_series_memory(...)` | Saves lore, character health, secrets, and relationships into memory. |
| **Series**   | `chapter_builder.py`| `build_full_chapter(...)` | Builds the whole chapter from idea to final pictures and audio. |
| **Translate**| `translate_speech.py`| `translate_speech(...)` | Translates one dialogue line keeping slang and comic tone. |
| **Translate**| `translate_chapter.py`| `translate_chapter(...)` | Translates all dialogue bubbles in a chapter together. |
| **Translate**| `names_dictionary.py`| `get_names(...)`, `save_names(...)`| Keeps character names and magic spells consistent across languages. |
| **Thumbnails**| `thumbnail_ideas.py`| `make_cover_ideas(...)` | Brainstorms catchy hook ideas, text titles, and dramatic angles. |
| **Thumbnails**| `thumbnail_prompts.py`| `make_cover_prompts(...)` | Makes 16:9 prompts for cover art generation. |
| **Thumbnails**| `thumbnail_builder.py`| `make_cover_image(...)` | Draws title banners, glowing borders, and stickers onto covers. |
| **Chat**     | `chat_assistant.py`| `ask_assistant(...)` | Chats with creator to help brainstorm, edit, and fix lines. |
| **Chat**     | `chat_context.py`  | `get_comic_context(...)` | Gathers comic project details so the chat understands your comic. |
| **Training** | `train_detector.py`| `train_bubble_model(...)` | Trains YOLO to find speech bubbles on your own comic style. |
| **Training** | `prep_dataset.py`  | `prep_training_data(...)` | Prepares and validates comic box coordinates for training. |
| **Training** | `track_training.py`| `check_training_status(...)` | Shows live training progress, loss scores, and time left. |
| **Catalog**  | `list_models.py`   | `get_all_ai_models(...)` | Lists all models available under your API keys. |
| **Catalog**  | `test_model_speed.py`| `test_model_speed(...)` | Measures how fast each model responds (ping in milliseconds). |
| **Catalog**  | `track_costs.py`   | `calculate_token_cost(...)` | Counts tokens and calculates user coin/credit costs. |
| **Utils**    | `prompt_builder.py`| `fill_template(...)` | Fills variables into prompt templates cleanly. |
| **Utils**    | `clean_json.py`    | `fix_bad_json(...)` | Fixes broken quotes and bad formatting from AI responses. |
| **Utils**    | `speech_timer.py`  | `count_speech_seconds(...)` | Calculates how many seconds a line will take to speak. |
| **Utils**    | `image_loader.py`  | `load_picture(...)` | Loads base64 strings and web picture links safely into memory. |

---

## 3. Universal File Standard: "Helpers at Top, Main Tool at Bottom"

Every single python file in `backend/features/ai/` follows this simple, strict rule:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. File Title & What it Does (Simple English docstring)                │
├────────────────────────────────────────────────────────────────────────┤
│ 2. Imports (Only what this file needs)                                 │
├────────────────────────────────────────────────────────────────────────┤
│ 3. Settings & Constants                                                │
├────────────────────────────────────────────────────────────────────────┤
│ 4. TOP: Internal Helpers (Names start with `_`)                        │
│    - Small math checks, retries, and data preparation                  │
│    - Outside files NEVER call these helper functions                   │
├────────────────────────────────────────────────────────────────────────┤
│ 5. BOTTOM: The One Public Function                                     │
│    - The single, clean function that outside files and routers call    │
│    - Takes clean inputs, runs the helpers, and returns the result      │
├────────────────────────────────────────────────────────────────────────┤
│ 6. `__all__ = ["main_public_function"]`                                │
│    - Only gives outside access to the main function at the bottom      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Function Specifications (All Functions in Simplest English)

---

### Folder: `backend/features/ai/analysis/`

#### 1. `analyze_panel.py`
* **Job**: Looks at one comic panel picture, reads dialogue words, finds who is speaking, detects emotion, suggests a camera move, and writes voiceover lines.
* **Internal Helpers (Top)**:
  * `_prepare_picture(picture: Union[str, bytes, Image.Image]) -> Image.Image`
  * `_make_prompt(story_notes: Optional[str], past_events: Optional[str]) -> str`
  * `_clean_json(raw_text: str) -> Dict[str, Any]`
  * `_check_fields(data: Dict[str, Any]) -> Dict[str, Any]`
* **Main Public Function (Bottom)**:
  ```python
  async def read_panel(
      picture: Union[str, bytes, Image.Image],
      story_notes: Optional[str] = None,
      past_events: Optional[str] = None,
      ai_provider: str = "gemini",
      model_name: Optional[str] = None,
      api_key: Optional[str] = None
  ) -> Dict[str, Any]:
      """Reads a comic panel and returns dialogue, speaker name, emotion, camera move, and voiceover text."""
  ```
* **Exports**: `__all__ = ["read_panel"]`

#### 2. `analyze_batch.py`
* **Job**: Looks at a list of panels in an episode one by one or in small groups without freezing or hitting rate limits.
* **Internal Helpers (Top)**:
  * `_read_one_safely(gate: asyncio.Semaphore, panel: Dict[str, Any], index: int, memory: Any, ai_provider: str, model_name: Optional[str], api_key: Optional[str]) -> Dict[str, Any]`
  * `_read_one_by_one(panels: List[Dict[str, Any]], ai_provider: str, model_name: Optional[str], api_key: Optional[str]) -> List[Dict[str, Any]]`
* **Main Public Function (Bottom)**:
  ```python
  async def read_many_panels(
      panels: List[Dict[str, Any]],
      parallel_limit: int = 4,
      ai_provider: str = "gemini",
      model_name: Optional[str] = None,
      api_key: Optional[str] = None,
      remember_story: bool = True
  ) -> List[Dict[str, Any]]:
      """Reads a list of panels in order while remembering characters and ongoing events."""
  ```
* **Exports**: `__all__ = ["read_many_panels"]`

#### 3. `smart_crop.py`
* **Job**: Finds where panels are located in a long webtoon strip and cuts each panel into its own picture file.
* **Internal Helpers (Top)**:
  * `_slice_tall_strip(width: int, height: int, slice_height: int = 3000) -> List[Tuple[int, int]]`
  * `_drop_overlapping_boxes(boxes: List[Dict[str, Any]], max_overlap: float = 0.5) -> List[Dict[str, Any]]`
  * `_save_boxes_to_disk(picture: Image.Image, boxes: List[Dict[str, Any]], save_folder: Optional[str]) -> List[str]`
* **Main Public Function (Bottom)**:
  ```python
  async def cut_out_panels(
      strip_picture: Union[str, bytes, Image.Image],
      smallest_height: int = 150,
      auto_cut: bool = True,
      save_folder: Optional[str] = None,
      ai_provider: str = "gemini",
      api_key: Optional[str] = None
  ) -> Dict[str, Any]:
      """Finds panel boxes in a long webtoon strip and cuts each panel into a separate picture file."""
  ```
* **Exports**: `__all__ = ["cut_out_panels"]`

#### 4. `match_bubbles.py`
* **Job**: Matches each speech bubble to the character face closest to the bubble's pointer tail.
* **Internal Helpers (Top)**:
  * `_find_pointer_tail(bubble_mask: np.ndarray) -> Optional[Tuple[float, float]]`
  * `_find_nearest_face(bubble_spot: Tuple[int, int], faces: List[Dict[str, Any]]) -> str`
* **Main Public Function (Bottom)**:
  ```python
  def match_bubbles_to_faces(
      bubbles: List[Dict[str, Any]],
      faces: List[Dict[str, Any]],
      picture_size: Tuple[int, int]
  ) -> List[Dict[str, Any]]:
      """Connects speech text bubbles with character faces so we know who said each line."""
  ```
* **Exports**: `__all__ = ["match_bubbles_to_faces"]`

#### 5. `detect_emotion.py`
* **Job**: Detects whether dialogue should be spoken in a whisper, a calm voice, a scream, or in panic.
* **Internal Helpers (Top)**:
  * `_read_punctuation_marks(line: str) -> str`
* **Main Public Function (Bottom)**:
  ```python
  def find_emotion(
      speech_line: str,
      face_look: Optional[str] = None
  ) -> Dict[str, Any]:
      """Figures out the emotion (whisper, calm, shouting, tender, panicked) and speaking speed."""
  ```
* **Exports**: `__all__ = ["find_emotion"]`

#### 6. `detect_sfx.py`
* **Job**: Finds comic sound effect words like *SLASH*, *BAM*, *THUD*, *DODODO* and picks the right sound effect file.
* **Internal Helpers (Top)**:
  * `_clean_sfx_word(word: str) -> str`
* **Main Public Function (Bottom)**:
  ```python
  def find_sound_effects(
      sound_word: str,
      genre: str = "action"
  ) -> Dict[str, Any]:
      """Matches a comic sound effect word to a digital audio library category."""
  ```
* **Exports**: `__all__ = ["find_sound_effects"]`

---

### Folder: `backend/features/ai/narrative/`

#### 1. `story_memory.py`
* **Job**: Remembers active characters, their injuries, inventory, and recent dialogue lines so the story stays consistent.
* **Internal Helpers (Top)**:
  * `_format_characters_text(roster: Dict[str, Any]) -> str`
* **Main Public Function (Bottom)**:
  ```python
  def remember_story(
      old_memory: Dict[str, Any],
      panel_results: Dict[str, Any],
      panel_number: int
  ) -> Dict[str, Any]:
      """Updates ongoing story memory with who spoke, who appeared, and what just happened."""
  ```
* **Exports**: `__all__ = ["remember_story"]`

#### 2. `story_pacing.py`
* **Job**: Measures exciting action moments, quiet dialogue pauses, and scene changes across panels to make sure the story does not drag.
* **Internal Helpers (Top)**:
  * `_score_excitement(panel: Dict[str, Any]) -> float`
* **Main Public Function (Bottom)**:
  ```python
  async def check_pacing(
      panels: List[Dict[str, Any]],
      genre: str = "Action Fantasy",
      ai_provider: str = "gemini",
      api_key: Optional[str] = None
  ) -> Dict[str, Any]:
      """Measures story speed, action peaks, and scene breaks across a comic chapter."""
  ```
* **Exports**: `__all__ = ["check_pacing"]`

#### 3. `write_script.py`
* **Job**: Turns still comic panels and dialogue bubbles into an engaging, smooth narrator voiceover script.
* **Internal Helpers (Top)**:
  * `_clean_script_words(text: str) -> str`
* **Main Public Function (Bottom)**:
  ```python
  async def write_story_script(
      panels: List[Dict[str, Any]],
      voice_tone: str = "cinematic",
      ai_provider: str = "gemini",
      api_key: Optional[str] = None
  ) -> List[Dict[str, Any]]:
      """Creates a complete spoken voiceover script that matches each comic panel's visual action."""
  ```
* **Exports**: `__all__ = ["write_story_script"]`

---

### Folder: `backend/features/ai/prompts/`

#### 1. `improve_prompt.py`
* **Job**: Takes a simple creator prompt like "hero fighting monster" and expands it with lighting, camera angles, and art details.
* **Internal Helpers (Top)**:
  * `_clean_raw_words(raw_words: str) -> str`
  * `_add_style_details(raw_words: str, art_style: str) -> str`
* **Main Public Function (Bottom)**:
  ```python
  async def make_better_prompt(
      simple_idea: str,
      output_type: Literal["image", "script", "video"] = "image",
      art_style: str = "manhwa",
      genre: str = "action",
      ai_provider: str = "gemini",
      api_key: Optional[str] = None
  ) -> Dict[str, Any]:
      """Turns a basic idea into a rich, high-quality prompt for picture generators or AI writers."""
  ```
* **Exports**: `__all__ = ["make_better_prompt"]`

#### 2. `image_prompts.py`
* **Job**: Builds both positive prompts and negative prompts for diffusion models like Flux and Stable Diffusion.
* **Internal Helpers (Top)**:
  * `_make_negative_prompt() -> str`
* **Main Public Function (Bottom)**:
  ```python
  def make_image_prompts(
      scene_idea: str,
      character_looks: List[str],
      art_style: str = "anime",
      picture_shape: str = "9:16"
  ) -> Dict[str, str]:
      """Builds ready-to-run positive and negative prompts formatted for image generators."""
  ```
* **Exports**: `__all__ = ["make_image_prompts"]`

#### 3. `style_presets.py`
* **Job**: Stores ready-to-use style tokens for anime, manhwa, dark manga, and western superhero comics.
* **Data List (Top)**:
  * `STYLE_PRESETS: Dict[str, Dict[str, Any]]`
* **Main Public Function (Bottom)**:
  ```python
  def get_art_style(style_name: str) -> Dict[str, Any]:
      """Returns art style keywords, color rules, and camera settings for the chosen style."""
  ```
* **Exports**: `__all__ = ["get_art_style"]`

---

### Folder: `backend/features/ai/agent/`

#### 1. `agent_workflow.py`
* **Job**: The main engine for the 1-click autonomous director. Takes a webtoon chapter link and automatically produces a finished video.
* **Internal Helpers (Top)**:
  * `_save_step_status(run_id: str, percent: int, step_name: str) -> None`
* **Main Public Function (Bottom)**:
  ```python
  async def start_video_agent(
      run_id: str,
      chapter_url: str,
      video_shape: str = "shorts",
      language: str = "en",
      default_voice: str = "alloy",
      pause_for_review: bool = False,
      max_panels: Optional[int] = None,
      user_id: Optional[str] = None
  ) -> Dict[str, Any]:
      """Runs the complete 1-click process: scrapes chapter, cuts panels, writes script, speaks audio, and builds video."""
  ```
* **Exports**: `__all__ = ["start_video_agent"]`

#### 2. `agent_scraper.py`
* **Job**: Fetches comic chapter pictures from a web link and saves them locally so the agent can work on them.
* **Internal Helpers (Top)**:
  * `_download_file(file_url: str, destination_folder: str) -> str`
* **Main Public Function (Bottom)**:
  ```python
  async def download_chapter(
      web_link: str,
      save_folder: str,
      max_pictures: Optional[int] = None
  ) -> List[str]:
      """Downloads all pictures from a webtoon link and saves them into the agent's work folder."""
  ```
* **Exports**: `__all__ = ["download_chapter"]`

#### 3. `agent_script.py`
* **Job**: Looks over all pictures in an agent run, reads words, and writes the speaking script for each panel.
* **Internal Helpers (Top)**:
  * `_clean_dialogue_text(raw_panel: Dict[str, Any]) -> str`
* **Main Public Function (Bottom)**:
  ```python
  async def write_agent_script(
      panel_pictures: List[str],
      series_title: str,
      language: str = "en"
  ) -> List[Dict[str, Any]]:
      """Reads dialogue from pictures and writes a narrator voiceover script for every panel."""
  ```
* **Exports**: `__all__ = ["write_agent_script"]`

#### 4. `agent_voices.py`
* **Job**: Figures out which characters appear in the comic and picks an AI voice (male, female, child, deep) for each one.
* **Internal Helpers (Top)**:
  * `_match_voice_by_gender(gender: str, language: str) -> str`
* **Main Public Function (Bottom)**:
  ```python
  def assign_voices(
      characters: List[Dict[str, Any]],
      default_voice: str = "alloy",
      user_choices: Optional[Dict[str, str]] = None
  ) -> List[Dict[str, Any]]:
      """Assigns an AI speaking voice to each character so they always sound the same."""
  ```
* **Exports**: `__all__ = ["assign_voices"]`

#### 5. `agent_director.py`
* **Job**: Decides camera zoom and pan movements for panels and mixes audio tracks with the video timeline.
* **Internal Helpers (Top)**:
  * `_choose_camera_move(panel: Dict[str, Any]) -> str`
* **Main Public Function (Bottom)**:
  ```python
  async def make_agent_video(
      panels: List[Dict[str, Any]],
      voice_cast: List[Dict[str, Any]],
      video_shape: str = "shorts",
      save_folder: Optional[str] = None
  ) -> str:
      """Generates AI speech, adds pan/zoom camera moves, and creates the final MP4 video file."""
  ```
* **Exports**: `__all__ = ["make_agent_video"]`

#### 6. `agent_jobs.py`
* **Job**: Saves and looks up agent jobs in the database, tracks status, and handles user approvals before making video.
* **Internal Helpers (Top)**:
  * `_check_database_table() -> None`
* **Main Public Function (Bottom)**:
  ```python
  def check_job(job_id: str) -> Optional[Dict[str, Any]]: ...
  def approve_job(job_id: str, user_changes: Optional[Dict[str, Any]] = None) -> Dict[str, Any]: ...
  def get_all_jobs(user_id: str) -> List[Dict[str, Any]]: ...
  ```
* **Exports**: `__all__ = ["check_job", "approve_job", "get_all_jobs"]`

---

### Folder: `backend/features/ai/series/`

#### 1. `story_planner.py`
* **Job**: Plans out a whole multi-episode story with introduction, rising action, big fight, and cliffhanger.
* **Internal Helpers (Top)**:
  * `_read_genre_rules(genre: str) -> str`
* **Main Public Function (Bottom)**:
  ```python
  async def plan_story_arc(
      title: str,
      genre: str,
      summary: str,
      chapter_count: int = 5,
      characters: Optional[List[Dict[str, Any]]] = None
  ) -> Dict[str, Any]:
      """Plans a dramatic story arc across multiple comic episodes."""
  ```
* **Exports**: `__all__ = ["plan_story_arc"]`

#### 2. `chapter_writer.py`
* **Job**: Takes one planned episode and writes out panel-by-panel action and dialogue lines.
* **Internal Helpers (Top)**:
  * `_make_scene_prompt(episode_summary: str) -> str`
* **Main Public Function (Bottom)**:
  ```python
  async def write_chapter(
      series_title: str,
      chapter_number: int,
      synopsis: str,
      panel_count: int = 10
  ) -> List[Dict[str, Any]]:
      """Writes out the dialogue, character actions, and scene details for all panels in an episode."""
  ```
* **Exports**: `__all__ = ["write_chapter"]`

#### 3. `panel_prompts.py`
* **Job**: Creates image generator prompts that keep character hair, faces, and outfits looking identical in every panel.
* **Internal Helpers (Top)**:
  * `_add_character_tags(character: Dict[str, Any]) -> str`
* **Main Public Function (Bottom)**:
  ```python
  async def make_panel_prompts(
      chapter_script: str,
      character_sheets: List[Dict[str, Any]],
      art_style: str = "manhwa"
  ) -> List[Dict[str, Any]]:
      """Creates image prompts for each panel with character consistency tags."""
  ```
* **Exports**: `__all__ = ["make_panel_prompts"]`

#### 4. `image_generator.py`
* **Job**: Generates high-definition panel pictures using diffusion models and saves them to local media storage.
* **Internal Helpers (Top)**:
  * `_save_picture_to_disk(picture_bytes: bytes, series_id: str, chapter_id: str, panel_idx: int) -> str`
* **Main Public Function (Bottom)**:
  ```python
  async def make_panel_image(
      prompt: str,
      series_id: str,
      chapter_id: str,
      panel_number: int,
      negative_prompt: Optional[str] = None
  ) -> Dict[str, Any]:
      """Generates a high-quality picture using AI diffusion and saves it to disk."""
  ```
* **Exports**: `__all__ = ["make_panel_image"]`

#### 5. `voice_dubber.py`
* **Job**: Creates character voices for an entire episode using neural TTS so each character speaks in their own voice.
* **Internal Helpers (Top)**:
  * `_find_voice_for_speaker(speaker_name: str, characters: List[Dict[str, Any]]) -> str`
* **Main Public Function (Bottom)**:
  ```python
  async def dub_chapter_voices(
      series_id: str,
      chapter_id: str,
      dialogue_lines: List[Dict[str, Any]],
      characters: List[Dict[str, Any]]
  ) -> List[Dict[str, Any]]:
      """Generates voiced audio for all dialogue lines in an episode."""
  ```
* **Exports**: `__all__ = ["dub_chapter_voices"]`

#### 6. `series_memory.py`
* **Job**: Long-term database of story lore: who defeated who, what items they found, and character injuries.
* **Internal Helpers (Top)**:
  * `_summarize_story_facts(chapter_text: str) -> List[Dict[str, Any]]`
* **Main Public Function (Bottom)**:
  ```python
  def save_series_memory(
      series_id: str,
      chapter_number: int,
      new_events: List[Dict[str, Any]],
      character_changes: Dict[str, Any]
  ) -> Dict[str, Any]:
      """Saves important plot events and character status into ongoing story memory."""
  ```
* **Exports**: `__all__ = ["save_series_memory"]`

#### 7. `chapter_builder.py`
* **Job**: Runs the whole episode creation process: idea -> script -> pictures -> voices -> finished comic.
* **Internal Helpers (Top)**:
  * `_check_everything_ready(series_id: str, chapter_id: str) -> None`
* **Main Public Function (Bottom)**:
  ```python
  async def build_full_chapter(
      series_id: str,
      chapter_name: str,
      chapter_idea: str,
      make_images: bool = True,
      make_voices: bool = True
  ) -> Dict[str, Any]:
      """Coordinates the complete production of an AI comic chapter from idea to final images and audio."""
  ```
* **Exports**: `__all__ = ["build_full_chapter"]`

---

### Folder: `backend/features/ai/translation/`

#### 1. `translate_speech.py`
* **Job**: Translates a single line of comic dialogue while preserving slang, character attitude, and humor.
* **Internal Helpers (Top)**:
  * `_clean_translated_text(text: str) -> str`
* **Main Public Function (Bottom)**:
  ```python
  async def translate_speech(
      text: str,
      to_language: str = "Japanese",
      tone: str = "natural",
      story_context: Optional[str] = None
  ) -> Dict[str, Any]:
      """Translates comic dialogue into another language with proper tone and slang."""
  ```
* **Exports**: `__all__ = ["translate_speech"]`

#### 2. `translate_chapter.py`
* **Job**: Translates all dialogue bubbles across an entire chapter together so character names and speech styles stay consistent.
* **Internal Helpers (Top)**:
  * `_combine_lines(dialogue_list: List[Dict[str, Any]]) -> str`
* **Main Public Function (Bottom)**:
  ```python
  async def translate_chapter(
      dialogue_lines: List[Dict[str, Any]],
      to_language: str,
      name_rules: Optional[Dict[str, str]] = None
  ) -> List[Dict[str, Any]]:
      """Batch translates every dialogue bubble in a comic chapter."""
  ```
* **Exports**: `__all__ = ["translate_chapter"]`

#### 3. `names_dictionary.py`
* **Job**: Stores how special names, attack moves, and titles are translated so they are never spelled differently across chapters.
* **Internal Helpers (Top)**:
  * `_validate_words(words: Dict[str, str]) -> Dict[str, str]`
* **Main Public Function (Bottom)**:
  ```python
  def get_names(series_id: str, language: str) -> Dict[str, str]: ...
  def save_names(series_id: str, language: str, word_pairs: Dict[str, str]) -> Dict[str, str]: ...
  ```
* **Exports**: `__all__ = ["get_names", "save_names"]`

---

### Folder: `backend/features/ai/thumbnails/`

#### 1. `thumbnail_ideas.py`
* **Job**: Brainstorms high-click rate YouTube and Webtoon cover ideas with emotional character faces and drama.
* **Internal Helpers (Top)**:
  * `_make_hook_prompt(title: str, genre: str) -> str`
* **Main Public Function (Bottom)**:
  ```python
  async def make_cover_ideas(
      title: str,
      genre: str,
      synopsis: str,
      count: int = 3
  ) -> List[Dict[str, Any]]:
      """Creates high-CTR thumbnail ideas with catchy text badges and focal character poses."""
  ```
* **Exports**: `__all__ = ["make_cover_ideas"]`

#### 2. `thumbnail_prompts.py`
* **Job**: Takes a thumbnail idea and writes positive and negative prompts formatted for 16:9 image generators.
* **Internal Helpers (Top)**:
  * `_add_cover_quality_tags(prompt: str) -> str`
* **Main Public Function (Bottom)**:
  ```python
  def make_cover_prompts(
      idea: Dict[str, Any],
      art_style: str = "action_anime"
  ) -> Dict[str, str]:
      """Builds diffusion prompts for 16:9 YouTube cover generation."""
  ```
* **Exports**: `__all__ = ["make_cover_prompts"]`

#### 3. `thumbnail_builder.py`
* **Job**: Draws large styled text banners, glowing borders, and adds cut-out character stickers onto cover images.
* **Internal Helpers (Top)**:
  * `_draw_curved_banner(draw: Any, text: str, width: int, height: int) -> None`
  * `_add_glow_border(picture: Image.Image, color: Tuple[int, int, int]) -> Image.Image`
* **Main Public Function (Bottom)**:
  ```python
  def make_cover_image(
      background_picture: Image.Image,
      banner_text: Optional[str] = None,
      character_cutout: Optional[Image.Image] = None,
      width: int = 1280,
      height: int = 720
  ) -> Image.Image:
      """Builds a complete, professional YouTube/comic cover image with text and glowing borders."""
  ```
* **Exports**: `__all__ = ["make_cover_image"]`

---

### Folder: `backend/features/ai/chat/`

#### 1. `chat_assistant.py`
* **Job**: AI chat helper that answers questions, brainstorms plot twists, and helps write dialogue.
* **Internal Helpers (Top)**:
  * `_format_chat_history(messages: List[Dict[str, str]]) -> List[Dict[str, str]]`
* **Main Public Function (Bottom)**:
  ```python
  async def ask_assistant(
      user_message: str,
      chat_history: List[Dict[str, str]],
      story_context: Optional[str] = None,
      ai_provider: str = "gemini",
      model_name: Optional[str] = None
  ) -> Dict[str, Any]:
      """Sends a message to the AI creative assistant and returns their helpful response."""
  ```
* **Exports**: `__all__ = ["ask_assistant"]`

#### 2. `chat_context.py`
* **Job**: Compiles your active comic details (which characters are present, what the current panel shows) so the chat understands your comic.
* **Internal Helpers (Top)**:
  * `_summarize_panels(panels: List[Dict[str, Any]]) -> str`
* **Main Public Function (Bottom)**:
  ```python
  def get_comic_context(
      series_details: Dict[str, Any],
      current_panel: Optional[Dict[str, Any]] = None,
      characters: Optional[List[Dict[str, Any]]] = None
  ) -> str:
      """Builds background context for the AI assistant so it knows your story."""
  ```
* **Exports**: `__all__ = ["get_comic_context"]`

---

### Folder: `backend/features/ai/training/`

#### 1. `train_detector.py`
* **Job**: Starts background training of YOLOv8 to recognize speech bubbles and panels on your own custom comic drawings.
* **Internal Helpers (Top)**:
  * `_check_training_files(data_yaml: str) -> bool`
* **Main Public Function (Bottom)**:
  ```python
  async def train_bubble_model(
      dataset_folder: str,
      target: Literal["bubble", "panel"] = "bubble",
      rounds: int = 50,
      batch_size: int = 16
  ) -> Dict[str, Any]:
      """Launches background training for a custom YOLO comic detection model."""
  ```
* **Exports**: `__all__ = ["train_bubble_model"]`

#### 2. `prep_dataset.py`
* **Job**: Converts labeled comic boxes into standard YOLO text files and splits images into training and validation sets.
* **Internal Helpers (Top)**:
  * `_box_to_text_line(box: Dict[str, float], img_w: int, img_h: int) -> str`
* **Main Public Function (Bottom)**:
  ```python
  def prep_training_data(
      box_file: str,
      output_folder: str,
      test_ratio: float = 0.2
  ) -> Dict[str, Any]:
      """Prepares and validates comic box coordinates for training."""
  ```
* **Exports**: `__all__ = ["prep_training_data"]`

#### 3. `track_training.py`
* **Job**: Checks live progress of ongoing training runs: how many epochs are finished, loss numbers, and accuracy.
* **Internal Helpers (Top)**:
  * `_read_log_file(csv_file: str) -> List[Dict[str, Any]]`
* **Main Public Function (Bottom)**:
  ```python
  def check_training_status(job_id: str) -> Dict[str, Any]:
      """Returns live training progress, loss scores, and estimated time remaining."""
  ```
* **Exports**: `__all__ = ["check_training_status"]`

---

### Folder: `backend/features/ai/catalog/`

#### 1. `list_models.py`
* **Job**: Fetches the list of all models available under your API keys (Gemini, Claude, GPT-4, etc.) and their speed/pricing tiers.
* **Internal Helpers (Top)**:
  * `_fetch_gemini_models(api_key: str) -> List[Dict[str, Any]]`
  * `_fetch_openai_models(api_key: str) -> List[Dict[str, Any]]`
* **Main Public Function (Bottom)**:
  ```python
  async def get_all_ai_models(
      ai_provider: str,
      api_key: Optional[str] = None
  ) -> Dict[str, Any]:
      """Returns all available models and their token limits for the chosen provider."""
  ```
* **Exports**: `__all__ = ["get_all_ai_models"]`

#### 2. `test_model_speed.py`
* **Job**: Sends a small test prompt to measure how fast an AI model answers (response ping in milliseconds).
* **Internal Helpers (Top)**:
  * `_measure_ping(ai_provider: str, model_name: str, test_words: str) -> float`
* **Main Public Function (Bottom)**:
  ```python
  async def test_model_speed(
      ai_provider: str,
      model_name: str,
      api_key: Optional[str] = None
  ) -> Dict[str, Any]:
      """Tests live response time and token speed for an AI model."""
  ```
* **Exports**: `__all__ = ["test_model_speed"]`

#### 3. `track_costs.py`
* **Job**: Calculates tokens used and computes user credit/coin costs for an AI request.
* **Internal Helpers (Top)**:
  * `_count_word_tokens(text: str) -> int`
* **Main Public Function (Bottom)**:
  ```python
  def calculate_token_cost(
      words_in: int,
      words_out: int,
      model_name: str
  ) -> Dict[str, Any]:
      """Calculates token costs and credits needed for an AI generation."""
  ```
* **Exports**: `__all__ = ["calculate_token_cost"]`

---

### Folder: `backend/features/ai/utils/` (Pure Foundational Layer)

#### 1. `prompt_builder.py`
* **Job**: Safe string template filler for prompts.
* **Main Public Function (Bottom)**:
  ```python
  def fill_template(template_text: str, variables: Dict[str, Any]) -> str: ...
  ```
* **Exports**: `__all__ = ["fill_template"]`

#### 2. `clean_json.py`
* **Job**: Strips markdown backticks and repairs broken quotes from AI answers so they parse cleanly into Python dictionaries.
* **Main Public Function (Bottom)**:
  ```python
  def fix_bad_json(raw_text: str) -> Dict[str, Any]: ...
  ```
* **Exports**: `__all__ = ["fix_bad_json"]`

#### 3. `speech_timer.py`
* **Job**: Calculates how many seconds speech will take based on words and talking speed.
* **Main Public Function (Bottom)**:
  ```python
  def count_speech_seconds(text: str, words_per_minute: int = 145) -> float: ...
  ```
* **Exports**: `__all__ = ["count_speech_seconds"]`

#### 4. `image_loader.py`
* **Job**: Safely loads base64 strings and web picture URLs into clean PIL Image buffers.
* **Main Public Function (Bottom)**:
  ```python
  def load_picture(picture_input: Union[str, bytes, Image.Image]) -> Image.Image: ...
  ```
* **Exports**: `__all__ = ["load_picture"]`

---

## 5. Architectural Guarantees & Backward Compatibility

1. **Clean Simple Names, Zero Buzzwords**: Every file and function has a plain, obvious English name describing its single job.
2. **Strict Caller Discipline**: Outside routers and files only call the single exported function at the bottom. Internal `_` helpers are never touched.
3. **100% Backward Compatibility**:
   - `backend/features/creative/agent/service.py` re-exports from `features.ai.agent.agent_workflow`.
   - `backend/features/creative/thumbnails/service.py` re-exports from `features.ai.thumbnails.thumbnail_builder`.
   - `backend/features/creative/translation/service.py` re-exports from `features.ai.translation.translate_speech`.
   - `backend/features/intelligence/series/` re-exports from `features.ai.series`.
   - `backend/features/intelligence/ai/services/facade.py` re-exports from `features.ai.analysis.analyze_panel`.
4. **Existing Endpoints & Tests Stay Green**:
   - All existing frontend routes (`/api/v1/ai/*`, `/api/v1/ai-series/*`, `/api/v1/creative/*`) stay 100% functional.
   - All existing tests (`test_09`, `test_12`, `test_14`, `test_15`, `test_16`, `test_22`) pass without breaking changes (57/57 passed, 100% green).

---

## 6. Implementation Status: 100% COMPLETE

- [x] **Phase 1: Foundational Utils & Catalog**: `utils/` (`fill_template`, `fix_bad_json`, `count_speech_seconds`, `load_picture`) and `catalog/` (`get_all_ai_models`, `test_model_speed`, `calculate_token_cost`)
- [x] **Phase 2: Vision Analysis & Attribution**: `analysis/` (`read_panel`, `read_many_panels`, `cut_out_panels`, `match_bubbles_to_faces`, `find_emotion`, `find_sound_effects`)
- [x] **Phase 3: Narrative Continuity & Prompts**: `narrative/` (`remember_story`, `check_pacing`, `write_story_script`) and `prompts/` (`make_better_prompt`, `make_image_prompts`, `get_art_style`)
- [x] **Phase 4: Autonomous Video Agent**: `agent/` (`start_video_agent`, `download_chapter`, `write_agent_script`, `assign_voices`, `make_agent_video`, `check_job`, `approve_job`, `get_all_jobs`)
- [x] **Phase 5: AI Series, Translation & Thumbnails**: `series/` (`plan_story_arc`, `write_chapter`, `make_panel_prompts`, `make_panel_image`, `dub_chapter_voices`, `save_series_memory`, `build_full_chapter`), `translation/` (`translate_speech`, `translate_chapter`, `get_names`, `save_names`), and `thumbnails/` (`make_cover_ideas`, `make_cover_prompts`, `make_cover_image`)
- [x] **Phase 6: Chat, Training & Master Facade**: `chat/` (`ask_assistant`, `get_comic_context`), `training/` (`train_bubble_model`, `prep_training_data`, `check_training_status`), `schemas.py`, master `service.py` (`AIService`, `ai_service`), and unified `router/`
- [x] **Phase 7: Full Verification**: 57 passed tests across `test_09`, `test_12`, `test_14`, `test_15`, `test_16`, and `test_22`.

