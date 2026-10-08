"""
backend/app/api/v1/providers/gateway.py
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Unified AI Gateway â€” Provider-Agnostic API Endpoints

Use these endpoints from ANYWHERE â€” frontend, services, external tools, n8n.
Just change the `provider` field to route to any installed AI backend.

  POST /api/v1/providers/chat            â†’ text generation (any LLM)
  POST /api/v1/providers/generate-image  â†’ image diffusion (any image model)
  POST /api/v1/providers/synthesize      â†’ text-to-speech (any TTS engine)
  POST /api/v1/providers/transcribe      â†’ speech-to-text (Whisper)
  POST /api/v1/providers/embed           â†’ text embeddings (Gemini / OpenAI)
  GET  /api/v1/providers/health          â†’ all providers live health summary

Supported provider values
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  chat:           gemini Â· openai Â· anthropic Â· deepseek Â· groq
  generate-image: pollinations Â· huggingface Â· stable_diffusion
  synthesize:     edge_tts Â· elevenlabs
  transcribe:     whisper
  embed:          gemini Â· openai
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
"""

import os
import base64
import uuid
import time
import logging
from typing import Optional, List, Dict, Any, Union

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.core.dependencies.auth import get_all_user_keys, clean_api_key

logger = logging.getLogger("sonikoma.api.providers.gateway")
router = APIRouter()


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# REQUEST / RESPONSE SCHEMAS
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class ChatMessage(BaseModel):
    role: str = "user"          # "user" | "assistant" | "system"
    content: str


class ChatRequest(BaseModel):
    """
    Unified LLM chat/text-generation request.

    Minimal example:
        { "prompt": "Write a haiku about webtoons." }

    Full example with history:
        {
          "provider": "openai",
          "model": "gpt-4o",
          "messages": [{"role": "user", "content": "Hello"}],
          "temperature": 0.7,
          "max_tokens": 1024,
          "api_key": "sk-..."   # optional override
        }
    """
    provider:     Optional[str]               = Field("gemini",
                  description="LLM provider: gemini Â· openai Â· anthropic Â· deepseek Â· groq")
    model:        Optional[str]               = Field(None,
                  description="Model name. Defaults to the provider's primary model.")
    prompt:       Optional[str]               = Field(None,
                  description="Single-turn user prompt (shorthand instead of messages[]).")
    messages:     Optional[List[ChatMessage]] = Field(None,
                  description="Conversation history. If omitted, `prompt` is used as a single user message.")
    system:       Optional[str]               = Field(None,
                  description="System instruction (supported by Gemini, Anthropic, OpenAI).")
    temperature:  Optional[float]             = Field(0.7,  ge=0.0, le=2.0)
    max_tokens:   Optional[int]               = Field(2048, ge=1, le=32000)
    api_key:      Optional[str]               = Field(None,
                  description="Per-request API key override (takes priority over headers/env).")


class ImageRequest(BaseModel):
    """
    Unified text-to-image generation request.

    Minimal example:
        { "prompt": "Anime warrior girl in neon city" }

    Full example:
        {
          "provider": "pollinations",
          "model": "flux-anime",
          "prompt": "...",
          "width": 768, "height": 1024,
          "seed": 42,
          "api_key": "hf_..."   # only needed for huggingface
        }
    """
    provider: Optional[str] = Field("pollinations",
              description="Image provider: pollinations Â· huggingface Â· stable_diffusion")
    model:    Optional[str] = Field(None,
              description="Model name. Defaults to provider's primary model.")
    prompt:   str           = Field(..., description="Text-to-image prompt.")
    negative_prompt: Optional[str] = Field(None, description="Negative prompt (SD / HF).")
    width:    Optional[int] = Field(768,  ge=64, le=2048)
    height:   Optional[int] = Field(1024, ge=64, le=2048)
    seed:     Optional[int] = Field(None)
    quality:  Optional[int] = Field(90, ge=50, le=100, description="JPEG quality (HF / SD).")
    api_key:  Optional[str] = Field(None,
              description="Per-request API key override.")


class SynthesizeRequest(BaseModel):
    """
    Unified text-to-speech request.

    Minimal example:
        { "text": "Welcome to Sonikoma!" }

    Full example:
        {
          "provider": "elevenlabs",
          "voice": "21m00Tcm4TlvDq8ikWAM",
          "text": "...",
          "rate": "+10%",
          "api_key": "xi-..."
        }
    """
    provider: Optional[str] = Field("edge_tts",
              description="TTS provider: edge_tts Â· elevenlabs")
    text:     str           = Field(..., description="Text to synthesize.")
    voice:    Optional[str] = Field(None,
              description="Voice name/ID. Uses provider default if omitted.")
    rate:     Optional[str] = Field("+0%",  description="Speech rate (Edge TTS only).")
    pitch:    Optional[str] = Field("+0Hz", description="Pitch offset (Edge TTS only).")
    model_id: Optional[str] = Field(None,   description="ElevenLabs model (e.g. eleven_multilingual_v2).")
    api_key:  Optional[str] = Field(None,   description="Per-request API key override.")


class TranscribeRequest(BaseModel):
    """
    Unified speech-to-text request via Whisper.

    Example:
        {
          "audio_path": "/tmp/dialogue.mp3",
          "model_name": "small",
          "language": "en",
          "output_format": "srt"
        }
    """
    audio_path:    str           = Field(..., description="Absolute path to the audio file.")
    model_name:    Optional[str] = Field("base",
                   description="Whisper model size: tiny Â· base Â· small Â· medium Â· large")
    language:      Optional[str] = Field(None, description="ISO language code (None = auto-detect).")
    task:          Optional[str] = Field("transcribe", description="'transcribe' or 'translate'.")
    output_format: Optional[str] = Field("text",
                   description="Output format: text Â· srt Â· vtt Â· json")


class EmbedRequest(BaseModel):
    """
    Unified text embedding request.

    Example:
        { "provider": "gemini", "texts": ["anime panel", "action scene"] }
    """
    provider: Optional[str]      = Field("gemini",
              description="Embedding provider: gemini Â· openai")
    texts:    List[str]          = Field(..., description="List of texts to embed.")
    model:    Optional[str]      = Field(None,
              description="Embedding model name. Uses provider default if omitted.")
    api_key:  Optional[str]      = Field(None)


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# INTERNAL HELPERS
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def _resolve_key(body_key: Optional[str], user_keys: dict, provider: str) -> Optional[str]:
    """Priority: per-request body key â†’ user header key â†’ server env key."""
    return clean_api_key(body_key) or user_keys.get(provider)


def _messages_from_request(body: ChatRequest) -> List[Dict[str, str]]:
    """Normalise prompt/messages into openai-style message list."""
    if body.messages:
        return [{"role": m.role, "content": m.content} for m in body.messages]
    if body.prompt:
        msgs: List[Dict[str, str]] = []
        if body.system:
            msgs.append({"role": "system", "content": body.system})
        msgs.append({"role": "user", "content": body.prompt})
        return msgs
    raise HTTPException(status_code=400, detail="Provide either 'prompt' or 'messages'.")


async def _cache_audio(audio_bytes: bytes, ext: str = "mp3") -> str:
    """Store bytes in stitched_cache and return a /api/v1/images/cached/ URL."""
    from app.core.cache import stitched_cache
    cache_id = f"gw_{uuid.uuid4().hex[:14]}.{ext}"
    stitched_cache.set(cache_id, {"data": audio_bytes, "content_type": f"audio/{ext}"})
    return f"/api/v1/images/cached/{cache_id}"


async def _cache_image(img_bytes: bytes, ext: str = "jpg") -> str:
    from app.core.cache import stitched_cache
    cache_id = f"gwi_{uuid.uuid4().hex[:14]}.{ext}"
    stitched_cache.set(cache_id, {"data": img_bytes, "content_type": f"image/jpeg"})
    return f"/api/v1/images/cached/{cache_id}"


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# 1.  UNIFIED CHAT / TEXT GENERATION
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@router.post(
    "/chat",
    summary="Unified LLM chat â€” routes to any provider by name",
    description=(
        "Single endpoint for all text/chat generation. "
        "Set `provider` to `gemini`, `openai`, `anthropic`, `deepseek`, or `groq`. "
        "Use `prompt` for single-turn or `messages` for multi-turn conversation."
    ),
)
async def unified_chat(body: ChatRequest, user_keys: dict = Depends(get_all_user_keys)):
    t0 = time.perf_counter()
    provider = (body.provider or "gemini").lower().strip()
    messages  = _messages_from_request(body)
    api_key   = _resolve_key(body.api_key, user_keys, provider)
    content: Optional[str] = None

    # â”€â”€ Gemini â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if provider == "gemini":
        from ai_engine.providers.gemini import GeminiClient, GEMINI_AVAILABLE
        from app.core.config import GEMINI_MODEL_PRIMARY
        if not GEMINI_AVAILABLE:
            raise HTTPException(503, "google-genai package is not installed.")
        if not api_key:
            raise HTTPException(400, "Gemini API key is required (header X-User-Gemini-Key or body api_key).")
        model = body.model or GEMINI_MODEL_PRIMARY
        # Convert messages â†’ single contents string (Gemini v2 style)
        user_parts = [m["content"] for m in messages if m["role"] in ("user", "system")]
        contents   = "\n".join(user_parts)
        cfg: Dict[str, Any] = {
            "temperature": body.temperature,
            "max_output_tokens": body.max_tokens,
        }
        if body.system:
            cfg["system_instruction"] = body.system
        client   = GeminiClient.get_client(api_key=api_key)
        response = await GeminiClient.generate_content_with_retry(client, model, contents, cfg)
        content  = getattr(response, "text", str(response)) if response else None

    # â”€â”€ OpenAI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    elif provider == "openai":
        from ai_engine.providers.openai import OpenAIClient, OPENAI_AVAILABLE
        if not OPENAI_AVAILABLE:
            raise HTTPException(503, "openai package is not installed.")
        if not api_key:
            raise HTTPException(400, "OpenAI API key is required.")
        content = await OpenAIClient.chat_completion(
            messages=messages,
            model=body.model or "gpt-4o",
            temperature=body.temperature or 0.7,
            max_tokens=body.max_tokens,
            api_key=api_key,
        )

    # â”€â”€ Anthropic â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    elif provider == "anthropic":
        from ai_engine.providers.anthropic import AnthropicClient, ANTHROPIC_AVAILABLE
        if not ANTHROPIC_AVAILABLE:
            raise HTTPException(503, "anthropic package is not installed.")
        if not api_key:
            raise HTTPException(400, "Anthropic API key is required.")
        # Separate system from messages
        system_txt = body.system or next(
            (m["content"] for m in messages if m["role"] == "system"), None
        )
        non_sys = [m for m in messages if m["role"] != "system"]
        content = await AnthropicClient.create_message(
            messages=non_sys,
            system=system_txt,
            model=body.model or "claude-3-5-sonnet-20241022",
            max_tokens=body.max_tokens or 2048,
            temperature=body.temperature,
            api_key=api_key,
        )

    # â”€â”€ DeepSeek â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    elif provider == "deepseek":
        from ai_engine.providers.deepseek import DeepSeekClient
        if not api_key:
            api_key = DeepSeekClient.get_api_key()
        if not api_key:
            raise HTTPException(400, "DeepSeek API key is required.")
        content = await DeepSeekClient.chat_completion(
            messages=messages,
            model=body.model or "deepseek-chat",
            temperature=body.temperature or 0.7,
            max_tokens=body.max_tokens,
            api_key=api_key,
        )

    # â”€â”€ Groq â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    elif provider == "groq":
        from ai_engine.providers.groq import GroqClient
        if not api_key:
            api_key = GroqClient.get_api_key()
        if not api_key:
            raise HTTPException(400, "Groq API key is required.")
        content = await GroqClient.chat_completion(
            messages=messages,
            model=body.model or "llama-3.3-70b-versatile",
            temperature=body.temperature or 0.6,
            max_tokens=body.max_tokens,
            api_key=api_key,
        )

    else:
        raise HTTPException(
            400,
            f"Unknown chat provider '{provider}'. Valid: gemini Â· openai Â· anthropic Â· deepseek Â· groq"
        )

    if content is None:
        raise HTTPException(502, f"[{provider}] returned empty response. Check your API key or quota.")

    elapsed_ms = round((time.perf_counter() - t0) * 1000, 1)
    return {
        "success":    True,
        "provider":   provider,
        "model":      body.model,
        "content":    content,
        "latency_ms": elapsed_ms,
    }


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# 2.  UNIFIED IMAGE GENERATION
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@router.post(
    "/generate-image",
    summary="Unified image generation â€” routes to any diffusion provider",
    description=(
        "Single endpoint for all text-to-image generation. "
        "Set `provider` to `pollinations` (free), `huggingface`, or `stable_diffusion` (local). "
        "Returns a cached image URL and base64 data URI."
    ),
)
async def unified_generate_image(body: ImageRequest, user_keys: dict = Depends(get_all_user_keys)):
    t0 = time.perf_counter()
    provider = (body.provider or "pollinations").lower().strip()
    api_key  = _resolve_key(body.api_key, user_keys, provider)
    img_bytes: Optional[bytes] = None
    used_model: Optional[str]  = None

    # â”€â”€ Pollinations (free, no key needed) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if provider == "pollinations":
        from ai_engine.providers.pollinations import PollinationsClient
        from ai_engine.core.registry import ModelRegistry
        pm_list = ModelRegistry.get_catalog_by_provider("pollinations")
        default_poll_model = pm_list[0]["id"] if pm_list else "flux-anime"
        img_bytes, used_model, err = await PollinationsClient.generate_image(
            prompt=body.prompt,
            model=body.model or default_poll_model,
            width=body.width or 768,
            height=body.height or 1024,
            seed=body.seed,
        )
        if not img_bytes:
            raise HTTPException(502, f"Pollinations failed: {err}")

    # â”€â”€ Hugging Face â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    elif provider == "huggingface":
        from ai_engine.providers.huggingface import HuggingFaceClient, HUGGINGFACE_AVAILABLE
        if not HUGGINGFACE_AVAILABLE:
            raise HTTPException(503, "huggingface_hub package is not installed.")
        if not api_key:
            raise HTTPException(400, "Hugging Face API key required (X-User-HuggingFace-Key or body api_key).")
        used_model = body.model or "black-forest-labs/FLUX.1-schnell"
        img_bytes  = await HuggingFaceClient.generate_image(
            prompt=body.prompt,
            model=used_model,
            width=body.width or 768,
            height=body.height or 1024,
            quality=body.quality or 90,
            api_key=api_key,
        )
        if not img_bytes:
            raise HTTPException(502, "Hugging Face returned empty image data.")

    # â”€â”€ Stable Diffusion (local) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    elif provider in ("stable_diffusion", "sd", "local"):
        from ai_engine.providers.stable_diffusion import get_stable_diffusion_engine, DIFFUSERS_AVAILABLE
        import tempfile
        if not DIFFUSERS_AVAILABLE:
            raise HTTPException(503, "diffusers / torch not installed. Run: pip install diffusers torch")
        engine = get_stable_diffusion_engine()
        used_model = body.model or "runwayml/stable-diffusion-v1-5"
        results = await engine.generate_images(
            prompt=body.prompt,
            negative_prompt=body.negative_prompt or "",
            num_images=1,
            width=body.width or 512,
            height=body.height or 512,
            seed=body.seed,
            output_dir=tempfile.gettempdir(),
        )
        if not results:
            raise HTTPException(502, "Stable Diffusion produced no output.")
        # Read first image back to bytes
        img_path = results[0].image_path
        with open(img_path, "rb") as f:
            img_bytes = f.read()
        used_model = used_model

    else:
        raise HTTPException(
            400,
            f"Unknown image provider '{provider}'. Valid: pollinations Â· huggingface Â· stable_diffusion"
        )

    image_url = await _cache_image(img_bytes)
    b64       = base64.b64encode(img_bytes).decode("ascii")
    elapsed_ms = round((time.perf_counter() - t0) * 1000, 1)

    return {
        "success":    True,
        "provider":   provider,
        "model":      used_model,
        "url":        image_url,
        "image_url":  image_url,
        "image_base64": f"data:image/jpeg;base64,{b64}",
        "bytes_length": len(img_bytes),
        "latency_ms": elapsed_ms,
    }


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# 3.  UNIFIED TEXT-TO-SPEECH
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@router.post(
    "/synthesize",
    summary="Unified TTS â€” routes to Edge-TTS or ElevenLabs",
    description=(
        "Single endpoint for all speech synthesis. "
        "Set `provider` to `edge_tts` (free, 300+ voices) or `elevenlabs` (studio quality). "
        "Returns cached audio URL and base64 data URI."
    ),
)
async def unified_synthesize(body: SynthesizeRequest, user_keys: dict = Depends(get_all_user_keys)):
    t0 = time.perf_counter()
    provider = (body.provider or "edge_tts").lower().strip()
    api_key  = _resolve_key(body.api_key, user_keys, provider)

    if not body.text or not body.text.strip():
        raise HTTPException(400, "The 'text' field cannot be empty.")

    audio_bytes: Optional[bytes] = None

    # â”€â”€ Edge TTS (free) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if provider in ("edge_tts", "edge", "microsoft"):
        from ai_engine.providers.edge_tts import EdgeTTSClient, EDGE_TTS_AVAILABLE
        if not EDGE_TTS_AVAILABLE:
            raise HTTPException(503, "edge-tts not installed. Run: pip install edge-tts")
        clean_text = EdgeTTSClient.sanitize_text(body.text)
        audio_bytes = await EdgeTTSClient.synthesize(
            text=clean_text,
            voice=body.voice or "en-US-GuyNeural",
            rate=body.rate or "+0%",
            pitch=body.pitch or "+0Hz",
        )

    # â”€â”€ ElevenLabs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    elif provider in ("elevenlabs", "eleven", "el"):
        from ai_engine.providers.elevenlabs import ElevenLabsClient, VoiceSettings
        if not api_key:
            api_key = ElevenLabsClient.get_api_key()
        if not api_key:
            raise HTTPException(400, "ElevenLabs API key required (X-User-Elevenlabs-Key or body api_key).")
        settings = VoiceSettings(stability=0.5, similarity_boost=0.75)
        audio_bytes = await ElevenLabsClient.synthesize_speech(
            text=body.text,
            voice_id=body.voice or "21m00Tcm4TlvDq8ikWAM",
            model_id=body.model_id or "eleven_multilingual_v2",
            settings=settings,
            api_key=api_key,
        )

    else:
        raise HTTPException(
            400,
            f"Unknown TTS provider '{provider}'. Valid: edge_tts Â· elevenlabs"
        )

    if not audio_bytes:
        raise HTTPException(502, f"[{provider}] synthesis returned empty audio.")

    audio_url  = await _cache_audio(audio_bytes, "mp3")
    b64        = base64.b64encode(audio_bytes).decode("ascii")
    elapsed_ms = round((time.perf_counter() - t0) * 1000, 1)

    return {
        "success":      True,
        "provider":     provider,
        "voice":        body.voice,
        "url":          audio_url,
        "audio_url":    audio_url,
        "audio_base64": f"data:audio/mpeg;base64,{b64}",
        "bytes_length": len(audio_bytes),
        "latency_ms":   elapsed_ms,
    }


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# 4.  UNIFIED SPEECH-TO-TEXT / TRANSCRIPTION
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@router.post(
    "/transcribe",
    summary="Unified speech-to-text via Whisper",
    description=(
        "Transcribe audio to text using OpenAI Whisper. "
        "Pass `audio_path` to an absolute local file path. "
        "Supports output_format: `text`, `srt`, `vtt`, `json`."
    ),
)
async def unified_transcribe(body: TranscribeRequest):
    t0 = time.perf_counter()

    from ai_engine.providers.whisper import WHISPER_AVAILABLE, get_whisper_engine
    from ai_engine.providers.whisper.helpers import segments_to_srt, segments_to_vtt

    if not WHISPER_AVAILABLE:
        raise HTTPException(503, "openai-whisper not installed. Run: pip install openai-whisper")

    if not os.path.exists(body.audio_path):
        raise HTTPException(404, f"Audio file not found: {body.audio_path}")

    engine = get_whisper_engine(model_name=body.model_name or "base")
    result = await engine.transcribe(
        audio_path=body.audio_path,
        language=body.language,
        task=body.task or "transcribe",
    )

    fmt = (body.output_format or "text").lower()
    elapsed_ms = round((time.perf_counter() - t0) * 1000, 1)

    if fmt == "srt":
        return {
            "success":    True,
            "provider":   "whisper",
            "format":     "srt",
            "subtitles":  segments_to_srt(result.segments),
            "latency_ms": elapsed_ms,
        }
    if fmt == "vtt":
        return {
            "success":    True,
            "provider":   "whisper",
            "format":     "vtt",
            "subtitles":  segments_to_vtt(result.segments),
            "latency_ms": elapsed_ms,
        }
    if fmt == "json":
        return {
            "success":    True,
            "provider":   "whisper",
            "format":     "json",
            "text":       result.text,
            "language":   result.language,
            "duration":   result.duration,
            "segments":   [s.to_dict() for s in result.segments],
            "latency_ms": elapsed_ms,
        }

    # default: plain text
    return {
        "success":    True,
        "provider":   "whisper",
        "format":     "text",
        "text":       result.text,
        "language":   result.language,
        "duration":   result.duration,
        "latency_ms": elapsed_ms,
    }


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# 5.  UNIFIED TEXT EMBEDDINGS
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@router.post(
    "/embed",
    summary="Unified text embeddings â€” Gemini or OpenAI",
    description=(
        "Generate vector embeddings for semantic search, RAG, or similarity ranking. "
        "Set `provider` to `gemini` (text-embedding-004) or `openai` (text-embedding-3-small)."
    ),
)
async def unified_embed(body: EmbedRequest, user_keys: dict = Depends(get_all_user_keys)):
    t0 = time.perf_counter()
    provider = (body.provider or "gemini").lower().strip()
    api_key  = _resolve_key(body.api_key, user_keys, provider)

    if not body.texts:
        raise HTTPException(400, "The 'texts' list cannot be empty.")

    embeddings: List[List[float]] = []

    # â”€â”€ Gemini â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if provider == "gemini":
        from ai_engine.providers.gemini import GeminiClient, GEMINI_AVAILABLE
        if not GEMINI_AVAILABLE:
            raise HTTPException(503, "google-genai not installed.")
        if not api_key:
            raise HTTPException(400, "Gemini API key required.")
        model = body.model or "models/text-embedding-004"
        client = GeminiClient.get_client(api_key=api_key)
        for text in body.texts:
            try:
                resp = await __import__("asyncio").to_thread(
                    client.models.embed_content,
                    model=model,
                    contents=text,
                )
                vec = resp.embeddings[0].values if resp.embeddings else []
                embeddings.append(list(vec))
            except Exception as exc:
                logger.warning(f"[Gateway Embed Gemini] {exc}")
                embeddings.append([])

    # â”€â”€ OpenAI â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    elif provider == "openai":
        from ai_engine.providers.openai import OpenAIClient, OPENAI_AVAILABLE
        if not OPENAI_AVAILABLE:
            raise HTTPException(503, "openai package not installed.")
        if not api_key:
            raise HTTPException(400, "OpenAI API key required.")
        model = body.model or "text-embedding-3-small"
        oa_client = OpenAIClient.get_client(api_key)
        if not oa_client:
            raise HTTPException(400, "Could not init OpenAI client.")
        try:
            resp = await oa_client.embeddings.create(input=body.texts, model=model)
            embeddings = [item.embedding for item in resp.data]
        except Exception as exc:
            raise HTTPException(502, f"OpenAI embeddings error: {exc}")

    else:
        raise HTTPException(400, f"Unknown embed provider '{provider}'. Valid: gemini Â· openai")

    elapsed_ms = round((time.perf_counter() - t0) * 1000, 1)
    return {
        "success":    True,
        "provider":   provider,
        "model":      body.model,
        "count":      len(embeddings),
        "dimensions": len(embeddings[0]) if embeddings else 0,
        "embeddings": embeddings,
        "latency_ms": elapsed_ms,
    }


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# 6.  LIVE HEALTH SUMMARY  (all providers at once)
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@router.get(
    "/health",
    summary="Live health check across all AI providers",
    description=(
        "Returns availability, configuration state, and package install status "
        "for every AI provider in the registry."
    ),
)
async def gateway_health(user_keys: dict = Depends(get_all_user_keys)):
    """One-shot overview of every AI backend â€” great for dashboards and system checks."""
    from ai_engine.providers import (
        GEMINI_AVAILABLE, OPENAI_AVAILABLE, ANTHROPIC_AVAILABLE,
        HUGGINGFACE_AVAILABLE, DIFFUSERS_AVAILABLE,
        EDGE_TTS_AVAILABLE, WHISPER_AVAILABLE, LIBROSA_AVAILABLE,
    )

    def _kc(provider: str) -> bool:
        return bool(user_keys.get(provider))

    def _pm(prov: str, fallback: str) -> str:
        try:
            from ai_engine.core.registry import ModelRegistry
            models = ModelRegistry.get_catalog_by_provider(prov)
            if models and len(models) > 0:
                return models[0]["id"]
        except Exception:
            pass
        return fallback

    providers = {
        # ── LLMs ──
        "gemini": {
            "category": "llm",
            "package_installed": GEMINI_AVAILABLE,
            "key_configured": _kc("gemini"),
            "ready": GEMINI_AVAILABLE and _kc("gemini"),
            "primary_model": _pm("gemini", "gemini-2.5-flash"),
        },
        "openai": {
            "category": "llm",
            "package_installed": OPENAI_AVAILABLE,
            "key_configured": _kc("openai"),
            "ready": OPENAI_AVAILABLE and _kc("openai"),
            "primary_model": _pm("openai", "gpt-4o"),
        },
        "anthropic": {
            "category": "llm",
            "package_installed": ANTHROPIC_AVAILABLE,
            "key_configured": _kc("anthropic"),
            "ready": ANTHROPIC_AVAILABLE and _kc("anthropic"),
            "primary_model": _pm("anthropic", "claude-3-5-sonnet-20241022"),
        },
        "deepseek": {
            "category": "llm",
            "package_installed": True,   # pure HTTP, no SDK needed
            "key_configured": _kc("deepseek"),
            "ready": _kc("deepseek"),
            "primary_model": _pm("deepseek", "deepseek-chat"),
        },
        "groq": {
            "category": "llm",
            "package_installed": True,
            "key_configured": _kc("groq"),
            "ready": _kc("groq"),
            "primary_model": _pm("groq", "llama-3.3-70b-versatile"),
        },
        # ── Image ──
        "pollinations": {
            "category": "image",
            "package_installed": True,
            "key_configured": True,      # free public API
            "ready": True,
            "primary_model": _pm("pollinations", "flux-anime"),
        },
        "huggingface": {
            "category": "image",
            "package_installed": HUGGINGFACE_AVAILABLE,
            "key_configured": _kc("huggingface"),
            "ready": HUGGINGFACE_AVAILABLE and _kc("huggingface"),
            "primary_model": _pm("huggingface", "black-forest-labs/FLUX.1-schnell"),
        },
        "stable_diffusion": {
            "category": "image",
            "package_installed": DIFFUSERS_AVAILABLE,
            "key_configured": True,      # local, no key
            "ready": DIFFUSERS_AVAILABLE,
            "primary_model": _pm("stable_diffusion", "runwayml/stable-diffusion-v1-5"),
        },
        # ── Audio ──
        "edge_tts": {
            "category": "tts",
            "package_installed": EDGE_TTS_AVAILABLE,
            "key_configured": True,
            "ready": EDGE_TTS_AVAILABLE,
            "primary_model": _pm("edge_tts", "en-US-GuyNeural"),
        },
        "elevenlabs": {
            "category": "tts",
            "package_installed": True,
            "key_configured": _kc("elevenlabs"),
            "ready": _kc("elevenlabs"),
            "primary_model": _pm("elevenlabs", "eleven_multilingual_v2"),
        },
        "whisper": {
            "category": "stt",
            "package_installed": WHISPER_AVAILABLE,
            "key_configured": True,
            "ready": WHISPER_AVAILABLE,
            "primary_model": _pm("whisper", "base"),
        },
        "librosa": {
            "category": "audio_analysis",
            "package_installed": LIBROSA_AVAILABLE,
            "key_configured": True,
            "ready": LIBROSA_AVAILABLE,
            "primary_model": _pm("librosa", "librosa-dsp"),
        },
    }

    ready_count = sum(1 for p in providers.values() if p["ready"])
    total_count = len(providers)

    return {
        "success":       True,
        "ready":         ready_count,
        "total":         total_count,
        "coverage_pct":  round(ready_count / total_count * 100, 1),
        "providers":     providers,
    }

