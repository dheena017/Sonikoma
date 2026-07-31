# Sonikoma AI & Multimodal Subsystem Architecture

This document maps Sonikoma's AI engine integrations, structured multimodal prompt skills, and text-to-speech (TTS) orchestration.

---

## 🤖 1. Multimodal Prompt Skills Architecture

Sonikoma utilizes structured **Multimodal AI Markdown Skills** to interact with Gemini 2.5 models. These templates are stored inside `backend/python/skills/`.

```text
┌────────────────────────────────────────────────────────┐
│             Gemini Multimodal API Context              │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 1. Markdown Skill Definition File                │  │
│  │    (Rules, JSON output schemas, constraints)     │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ 2. Multimodal Panel Images Array                │  │
│  │    (Sequence of downscaled panel screenshots)    │  │
│  ├──────────────────────────────────────────────────┤  │
│  │ 3. User Style Parameters                         │  │
│  │    (Brightness average, character notes)         │  │
│  └──────────────────────────────────────────────────┘  │
└──────────────────────────┬─────────────────────────────┘
                           ▼ Gemini 2.5 API
┌────────────────────────────────────────────────────────┐
│             Cohesive Sequence Output JSON              │
│  [Speech Text, Narration, SFX, Motion, Duration]       │
└────────────────────────────────────────────────────────┘
```

### Key Skill Modules:
- **`panel_analyzer`:** Analyzes panel visual content. Runs EasyOCR on speech bubbles first, and blends text with image visuals to generate natural speech texts and camera direction ideas.
- **`panel_storyteller` (Silent Fallback):** Engaged when OCR reads zero dialogue characters. Operates as a storyteller narrator, converting silent comic panels into descriptive audio scripts.
- **`sequence_analyzer`:** Coordinates sequential panel analysis. It reads multiple downscaled panels (up to 20 images) in a single pass, ensuring narrative continuity and cohesive storytelling across panel boundaries.

---

## 🗣️ 2. Polymorphic Text-to-Speech Subsystem

Dialogue and narrator audio generation is decoupled from specific voice synthesis APIs via a standard **`SpeechProvider`** architecture.

```text
               ┌──────────────────────────────────────┐
               │         SpeechProvider (Interface)   │
               └──────────────────┬───────────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         ▼                        ▼                        ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│ EdgeTTSProvider  │    │  OpenAIProvider  │    │ElevenLabsProvider│
└──────────────────┘    └──────────────────┘    └──────────────────┘
```

- **Unified Interface:** The backend invokes `generate_speech(text, voice_id, speed)` on the active speech provider instance, returning compiled audio streams.
- **Edge-TTS Graceful Fallback:** Incorporates robust error boundaries. If a premium API provider (e.g., ElevenLabs or OpenAI) fails due to rate limits, network timeouts, or missing credits, the subsystem automatically falls back to Edge-TTS or returns `null` audio references with standard warnings, preventing compiler pipeline crashes.

---

## 🎨 3. Local Computer Vision & Layer Extraction

In addition to cloud-based LLM integrations, Sonikoma runs local ML model pipelines for layout isolation and inpainting:

- **Bubble Detection Core (`bubble_detector.py`):** Uses OpenCV contour detection, thresholding, and morphological transformations to identify and isolate speech bubble boundaries.
- **Speech Bubble Removal (`cleaner.py`):** Leverages OpenCV inpainting algorithms (`INPAINT_TELEA` or `INPAINT_NS`) using customizable dilation parameters to seamlessly erase text bubbles while preserving background artwork.
- **Layout Slicing & Boundary Scans (`detect_panels.py`):** Automatically detects panel boundaries in tall vertical webtoon strips. Divisor operations are bounded via `max(1, value)` to prevent ZeroDivisionError exceptions on malformed source assets.
- **Background Removal:** Integrates PyTorch and RemBG to segment comic characters from backgrounds, generating PNG offsets used by the inline player canvas.
