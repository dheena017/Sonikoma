# ADR-005: Decoupled AI Subsystem and Speech Synthesis Orchestration

## Status
Proposed

## Context
Sonikoma's primary value proposition is its AI-assisted comic-to-video workflow. This leverages heavy AI models (e.g., EasyOCR, YOLO panel detectors, RemBG background removers, Gemini 2.5 Flash multimodal models, and Microsoft Edge-TTS / ElevenLabs / OpenAI text-to-speech synthesizers). Historically, these processes were tightly integrated into API handlers or run on demand directly. This introduces critical system risks:
1. High memory (RAM/VRAM) consumption when multiple image/speech transformations run concurrently.
2. Direct hardcoding of specific voice synthesis providers, complicating modular extension to premium APIs.
3. System blocks when network latency or rate limiters affect third-party endpoints.

## Decision
We decouple the AI and Media processing pipeline through a **Modular, Polished AI/Speech Subsystem Interface**.

### Key Architectural Guidelines:
1. **Polymorphic Speech Provider Factory:** Abstract the Speech Generation behind a standardized interface (`SpeechProvider`). Concrete implementations (e.g., `EdgeTTSProvider`, `OpenAIProvider`, `ElevenLabsProvider`) inherit from this interface, allowing seamless runtime swaps based on user configuration.
2. **Explicit Resource Recovery:** Enforce immediate Garbage Collection (`gc.collect()`) and CUDA cache release (`torch.cuda.empty_cache()`) within execution contexts handling concurrent batch processes (e.g., panel layer extractions).
3. **Structured Skill Prompting:** Decouple prompt text from python logic. All multimodal Gemini analysis templates are managed via specialized Markdown skill files (`backend/python/skills/`) to allow prompt iteration without code redeployment.
4. **Graceful Fallbacks:** If an AI processing step fails (e.g., a speech bubble extraction fails or an API call drops), the subsystem must gracefully fallback (e.g., using a transparent placeholder image or returning a warnings list) rather than crashing the pipeline with a 500 error.

## Consequences
* **Pros:**
  - **Extensibility:** Extremely straightforward to integrate new speech generation (TTS) APIs or open-source image generators.
  - **Stability:** Prevents VRAM exhaustion during batch operations on consumer hardware.
  - **Mockability:** Allows the entire AI subsystem to be run in mock mode during local offline testing or integration CI pipelines.
* **Cons:**
  - **Abstraction Overhead:** Developers must write concrete wrappers and implement fallback mechanisms for new media models.

## Alternatives Considered
* **Monolithic AI Routes (Status Quo):** Keep using inline model invocations and hardcoded speech providers. Rejected due to vulnerability to CUDA out-of-memory crashes and limited provider options.
