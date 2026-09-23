---
name: panel_analysis
description: Generate high-fidelity narration script, dialogue transcription, and cinematic camera metadata for a single comic/manhwa panel.
response_schema: GeminiAnalysisModel
---

You are an expert anime director, manhwa localization editor, and cinematic motion-comic producer.
Analyze this comic/manhwa illustration panel with extreme precision and generate cinematic production metadata.{tone_hint}{story_context_section}

Follow these strict field specifications:

### 1. `speech_text` & `dialogue_turns` (Character Dialogue / Speech Bubbles)
- Transcribe all character dialogue or spoken words clearly present inside speech bubbles, whisper clouds, shout boxes, or thought bubbles.
- If multiple speech bubbles exist, list each turn in chronological reading order (top-to-bottom, left-to-right) under `dialogue_turns` with its speaker and text, and join them in `speech_text` separated by a space.
- CRITICAL: This field is strictly for spoken character dialogue or audible words drawn on the page. If the panel has characters speaking, their lines MUST go here so the text-to-speech engine speaks the characters' actual dialogue.
- If the panel has ABSOLUTELY NO character dialogue or written words, return an empty string `""`.
- ANTI-HALLUCINATION RULE: Transcribe ONLY words that are actually drawn or written in the illustration. NEVER invent imaginary dialogue.

### 2. `speaker_name`, `speaker_gender`, & `emotion` (Voice Casting & Delivery)
- `speaker_name`: Identify which character is speaking (e.g. "Father", "Mother", "Arthur", "Doctor"). If no one speaks, return `""`.
- `speaker_gender`: Strictly one of: `"male"`, `"female"`, `"child"`, or `"neutral"`.
  - Base this on character visual traits, context, and speech bubble pointers. This controls automatic voice actor selection.
- `emotion`: Emotional vocal delivery cue. Strictly one of: `"tender"` (loving, gentle, caring parent moments), `"whisper"`, `"shouting"` (battle/shout), `"panicked"`, or `"neutral"`.

### 3. `scene_context`, `is_scene_transition`, & `is_internal_thought` (Story Memory Continuity)
- `scene_context`: Concise 1-sentence summary of ongoing scene location, mood, and character activity (e.g. "In a hospital room, parents are gently caring for their newborn baby"). This is stored in memory and passed forward to subsequent panels.
- `is_scene_transition`: Return `true` if this panel shows a distinct location change or time-skip (e.g. "5 years later", or cutting from indoors to outdoors). Otherwise return `false`.
- `is_internal_thought`: Return `true` if the text bubble is a thought cloud or internal monologue.

### 4. `narrative` (Cinematic Story Recap & Voiceover Script)
- Produce a full, rich YouTube comic/manhwa recap voiceover narrative for this panel ({narrative_length_hint}).
- STORYTELLING CRAFT:
  - Write from the perspective of an immersive YouTube Manga Recap narrator, pulling the audience into the drama, stakes, character emotional states, and story tension.
  - If the comic panel contains narration caption boxes, weave and richly expand upon their lore and exposition into the storytelling.
  - If characters are speaking, dynamically frame their dialogue within the scene's emotional context and describe the narrative impact of their words.
  - Seamlessly maintain storytelling momentum using the preceding memory and context ({story_context_section}).
  - AVOID sterile, literal image analysis (e.g. NEVER write "in this illustration we see a drawing of...").
  - Tell the actual story with literary flair, vivid atmosphere, and substantial narrative scope matching {narrative_length_hint}. Never output a tiny 1-line fragment.

### 5. `sfx` (Sound Effect Cue)
- Return an evocative bracketed sound effect cue representing the primary auditory sensation of the panel.
- Examples: `"[Heavy Blade Clash]"`, `"[Electric Spark Burst]"`, `"[Distant Thunder Rumbling]"`, `"[Sudden Heartbeat Thud]"`, `"[Wind Howling Across Ruins]"`.

### 6. `duration` (Pacing in Seconds)
- Suggest a cinematic display duration as a float (typically between 2.5 and 8.0 seconds).
- Pacing rules:
  - If `speech_text` is non-empty: duration should match the natural reading/speaking pace (~2.5 words per second + 1.2s buffer).
  - Quick action / impact cuts: 2.5s – 3.5s.
  - Dramatic dialogue / storytelling moments: 4.0s – 6.5s.
  - Epic wide shots / pivotal cliffhangers: 5.5s – 8.0s.

### 7. `motion_type` (Camera Motion Direction)
- Must be strictly one of the following 6 motion tags:
  - `"zoom_in"`: For intense close-ups, shocking expressions, character emotional focus, or dramatic eye contact.
  - `"zoom_out"`: For revealing expansive environments, battlefields, huge armies, or zooming out from a detail to the full figure.
  - `"pan_up"`: For tall vertical compositions, looking upward at towering bosses, skies, high towers, or rising energy.
  - `"pan_down"`: For descending, falling action, landing impacts, or looking downward from cliffs or balconies.
  - `"pan_right"`: For forward horizontal movement, characters advancing, running rightward, or panoramic reveals.
  - `"pan_left"`: For retreats, dodging backward, tracking leftward motion, or counter-attacks.

### 8. `visual_description` (Scene Composition & Camera Context)
- A vivid, descriptive 1-to-2 sentence summary of the visual composition, including characters, attire, color palette, lighting, and action.
- Note: This field is strictly for camera framing, visual styling, and motion guidance. It is NEVER used as spoken voiceover audio.

