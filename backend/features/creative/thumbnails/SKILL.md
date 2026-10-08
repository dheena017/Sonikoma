---
name: ai-youtube-thumbnail-generator
description: Autonomous high-CTR YouTube thumbnail generator skill for Webtoon, Manga, and Comic video recaps. Analyzes chapter panels and story climaxes with AI, dynamically synthesizes psychological clickbait hooks, and composes 1280x720 HD (16:9) multi-variant thumbnail packages (3 or 6 variants) without hardcoded templates.
---

# AI YouTube Thumbnail Generator Skill

Located directly in `backend/features/creative/thumbnails/`.

This skill provides autonomous generation and optimization of high-CTR YouTube thumbnails for Webtoon, Manga, and Manhwa video recaps, shorts, and adaptations.

## Core Capabilities
1. **AI Climax & Emotion Detection**: Evaluates story panels using Vision AI and LLM context to identify high-impact character moments, shock expressions, power awakenings, and villain confrontations.
2. **Dynamic Clickbait Hook Synthesis**: Replaces hardcoded strings with context-aware, curiosity-gap hooks tailored dynamically to the specific plot moments, chapter number, and series genre.
3. **Multi-Variant Package Generation**: Generates 3 or 6 distinct thumbnail variants (1280x720 HD 16:9) covering different emotional triggers:
   - **Solo Awakening**: High-contrast power awakening with luminous aura highlights.
   - **Climax Versus Split**: Symmetrical or diagonal dual-character confrontation with complementary color divides.
   - **Story Hook & Mystery**: Rule-of-thirds cinematic composition with high-curiosity framing.
   - **Dark Silhouette**: High-contrast silhouette with rim lighting and sinister mist.
   - **Reaction & Shock**: Extreme facial gasp or shock expression with high-visibility warning border.
   - **Multi-Frame Comic Strip**: 3-panel dynamic strip montage for complete chapter or recap coverage.
4. **Color Psychology & Visual Contrast**: Implements high-CTR color science:
   - Electric Blue (#38BDF8) vs Crimson Red (#EF4444) for conflict.
   - Deep Void (#0D0D14) with Electric Gold (#FFD700) for solo overpower moments.
   - Toxic Green (#10B981) or Royal Violet (#8B5CF6) for forbidden powers or betrayal.

---

## Architecture & Responsibilities
- **AI Skill Layer (`ai_skill.py`)**: Communicates with Gemini / LLMs to analyze comic chapter context and synthesize dynamic viral hooks, visual directions, and psychological color schemes with zero static templates.
- **Composition & Rendering Engine (`generator.py`)**: Applies dynamic visual specifications to chapter panels, energy auras, vignettes, and styled typography stickers at 1280x720 HD resolution.
- **Service Orchestrator (`service.py`)**: Coordinates batch requests (3 or 6 variants) and manages cache persistence.
- **FastAPI Endpoints (`router.py`)**: Exposes `POST /api/v1/creative/thumbnails/generate`.

---

## Workflow Steps

### Step 1: Input Analysis & Story Metadata
- Extract:
  - `series_title`: Name of the series (e.g. *Solo Leveling*, *Tower of God*, *Omniscient Reader*).
  - `genre`: Action, Fantasy, Romance, Horror, Mystery, etc.
  - `panels`: List of extracted chapter panel images with dialogue or visual descriptions.
  - `prompt`: User prompt or visual direction.

### Step 2: Dynamic AI Hook & Concept Synthesis
- Query Gemini or LLM with the story context to synthesize unique, non-hardcoded concepts:
  - For each thumbnail variant (1 to 3 or 6):
    - **Visual Prompt**: Detailed composition instruction (character position, lighting direction, background ambiance).
    - **Hook Text**: 2-4 words maximum in all caps (e.g. `"HE TOOK THE THRONE?!"`, `"THE REAL MONARCH"`, `"BETRAYED BY GOD"`).
    - **Color Palette**: Dominant background, accent lighting, and text border colors.
    - **Archetype**: Chosen emotional style from the high-CTR library.

### Step 3: Image Slicing & Panel Mapping
- If chapter panels are provided:
  - Select panels with the highest emotional intensity or climax action.
  - Crop or focus on character eye level or action center.
- If no panels are provided:
  - Synthesize canvas art or use series cover / visual background prompt.

### Step 4: 1280x720 HD Rendering
- Canvas: Exactly `1280` width by `720` height (YouTube standard 16:9).
- Apply radial vignettes and directional gradients to create depth.
- Composite comic frames, lightning effects, and focal character isolation.
- Render typography stickers:
  - High-impact display font with multi-pass stroke outlines (2-4px black border).
  - Dynamic dropshadows and rotation tilts to increase dynamism.

### Step 5: Export & YouTube Metadata Handoff
- Cache thumbnail artifacts at `/api/v1/images/cached/{id}.jpg`.
- Provide one-click selection for YouTube Publisher to attach directly to YouTube upload payloads.
