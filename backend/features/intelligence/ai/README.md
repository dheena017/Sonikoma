# AI Generation & Multimodal Models Domain (`backend/features/intelligence/ai/`)

## 1. Overview & Architecture
The `ai` sub-domain powers multimodal vision processing, SD/Flux image generation, character dialogue narration, conversational agents, prompt enhancement, and token consumption analytics.

- **Pattern**: Follows the canonical **service → schemas → router → README** pattern.

---

## 2. Directory Layout & Module Structure

```
backend/features/intelligence/ai/
├── __init__.py               # AI domain exports (router, ai_router, service, ai_service, schemas, services)
├── service.py                # AIService facade class & singleton instance ai_service
├── schemas.py                # Canonical Pydantic schemas (images, prompts, chat, translations)
├── router/                   # Modular sub-routers
│   ├── __init__.py           # Unified ai_router / router
│   ├── image.py              # /image (synthesis, img2img, variations, controlnet)
│   ├── narration.py          # /narration (dialogue scripts, voice synthesis)
│   ├── chat.py               # /chat (assistant conversations, character chat)
│   ├── translation.py        # /translate (multilingual manga/webtoon translation)
│   ├── prompts.py            # /prompts (enhancement, model listing, latency benchmarks)
│   └── analytics.py          # /analytics (token logs, capability usage, daily rollups)
├── services/                 # Specialized domain services
│   ├── __init__.py           # Services aggregator
│   ├── facade.py             # Multimodal provider routing (Gemini, SD, Anthropic)
│   └── _deps.py              # Provider keys, skill execution engine, token telemetry
└── README.md                 # Domain documentation
```

---

## 3. Endpoints Overview (Mounted at `/api/v1/intelligence/ai`)

| Sub-Router | Prefix | Description |
| :--- | :--- | :--- |
| `image` | `/image` | Multi-provider image synthesis, style transfer |
| `narration` | `/narration` | Dialogue script generation and audio synthesis |
| `chat` | `/chat` | Interactive AI creator assistant and persona chat |
| `translation` | `/translate` | Multi-language translation preserving speech context |
| `prompts` | `/prompts` | Prompt optimization and latency benchmarks |
| `analytics` | `/analytics` | Token usage ledger and consumption reports |
