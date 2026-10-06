# ⚡ Sonikoma Universal AI Engine (`backend/ai_engine`)

> **Enterprise-Grade, Portable, Self-Contained AI Core**  
> `ai_engine` is a standalone AI platform designed to be **dropped directly into any Python project** (web apps, automation bots, video compilers, SaaS backends). It brings unified access to 14 foundational AI model providers, dynamic capability routing, fallback cascades, prompt engineering templates, and per-provider API routers.

---

## 🏛️ Directory Architecture

```text
backend/ai_engine/
│
├── 🔌 providers/                <-- Dedicated Home for All 14 AI Model Engines!
│   ├── gemini/                  <-- Google Gemini (types.py, client.py, engine.py, router.py, catalog.json)
│   ├── openai/                  <-- OpenAI GPT-4o, DALL-E 3 (types.py, client.py, router.py, catalog.json)
│   ├── anthropic/               <-- Anthropic Claude 3.5 (types.py, client.py, router.py, catalog.json)
│   ├── deepseek/                <-- DeepSeek V3 / R1 (types.py, client.py, router.py, catalog.json)
│   ├── groq/                    <-- Groq Ultra-Fast LPU (types.py, client.py, router.py, catalog.json)
│   ├── huggingface/             <-- Hugging Face FLUX.1 (types.py, client.py, router.py, catalog.json)
│   ├── pollinations/            <-- Pollinations Free (types.py, client.py, router.py, catalog.json)
│   ├── stable_diffusion/        <-- Local diffusers (types.py, client.py, router.py, catalog.json)
│   ├── edge_tts/                <-- Microsoft Edge TTS (types.py, client.py, router.py, catalog.json)
│   ├── elevenlabs/              <-- ElevenLabs Voice AI (types.py, client.py, router.py, catalog.json)
│   ├── whisper/                 <-- Whisper Transcription (types.py, client.py, router.py, catalog.json)
│   ├── ffmpeg/                  <-- Hardware video/audio rendering engine
│   ├── librosa/                 <-- Audio feature extraction & beat detection
│   ├── video/                   <-- Subtitle burning & montage compiler
│   ├── router.py                <-- Master API router consolidating all 14 provider routers
│   ├── gateway.py               <-- Unified /generate-image, /chat, /synthesize, /transcribe
│   └── catalog.py               <-- Dynamic /models discovery & status endpoints
│
├── 🎯 skills/                   <-- Portable High-Level AI Capabilities
│   ├── registry.py              <-- Skill loader & execution manager (22 production skills)
│   ├── base.py                  <-- Base skill definition & token tracking
│   ├── coordinator.py           <-- Multi-turn retry & prompt fallback coordinator
│   └── templates/               <-- 22 Production Markdown Prompt Templates
│       ├── script_dramatization.md
│       ├── voice_casting.md
│       ├── panel_analysis.md
│       ├── storyboard_narrative.md
│       ├── smart_crop.md
│       └── ...
│
└── 🧠 core/                     <-- Engine Controller & Hub
    ├── hub.py                   <-- Universal Python facade: ai_engine.chat(), ai_engine.generate_image()
    ├── orchestrator.py          <-- Intelligent multi-model router & failover cascades
    ├── registry.py              <-- Auto-discovers 70+ models across all provider catalog.json files
    ├── model_discovery.py       <-- Dynamic model discovery & active key scanner
    ├── model_validator.py       <-- API key validation, latency diagnostics, & model benchmarking
    └── config.py                <-- Self-contained API credentials & .env loader
```

---

## 🚀 Quickstart in ANY Future Project

### 1. Copy the Directory
Copy `ai_engine/` into your new project root.

### 2. Configure Credentials (Optional for Free Providers)
Set environment variables or create a `.env` file:
```env
GEMINI_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
DEEPSEEK_API_KEY=your_key_here
GROQ_API_KEY=your_key_here
ELEVENLABS_API_KEY=your_key_here
```
*(Free providers like `pollinations` and `edge_tts` require no API keys!)*

### 3. Use in Python (3 Lines of Code)

```python
import asyncio
from ai_engine import ai_engine

async def main():
    # 1. Text & Chat Generation (Auto-routes to best available model)
    story = await ai_engine.chat("Write a cyberpunk opening scene.")
    print("Story:", story)

    # 2. Free Image Generation
    img = await ai_engine.generate_image("A futuristic city at sunset")
    print("Image URL:", img.get("url"))

    # 3. Free Neural Speech Synthesis
    audio = await ai_engine.synthesize_speech("Mission initiated.", voice="en-US-GuyNeural")
    print("Audio file:", audio.get("audio_path"))

    # 4. Run Any Registered AI Skill
    voice_cast = await ai_engine.execute_skill(
        "voice_casting",
        character_name="Kaelen",
        dialogue_sample="I will protect the realm!",
        visual_description="A knight in silver armor with a glowing sword"
    )
    print("Voice Cast:", voice_cast)

asyncio.run(main())
```

---

## 🌐 Mount as REST API into FastAPI

```python
from fastapi import FastAPI
from ai_engine.providers.router import providers_router

app = FastAPI(title="My AI Service")
app.include_router(providers_router, prefix="/api/v1/providers")
```
