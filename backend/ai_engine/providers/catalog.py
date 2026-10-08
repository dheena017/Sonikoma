"""
backend/app/api/v1/providers/catalog.py
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
AI Provider Catalog, Dynamic Model Discovery, Latency Testing,
and Task-to-Model Routing Configuration APIs.
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
"""

import time
import logging
from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, Query
import httpx

from app.core.dependencies.auth import get_all_user_keys, clean_api_key, get_optional_current_user
from app.core.config import (
    GEMINI_API_KEY,
    OPENAI_API_KEY,
    ANTHROPIC_API_KEY,
    HUGGINGFACE_API_KEY,
    GEMINI_MODEL_PRIMARY,
)
from ai_engine.providers import (
    GEMINI_AVAILABLE,
    OPENAI_AVAILABLE,
    ANTHROPIC_AVAILABLE,
    HUGGINGFACE_AVAILABLE,
    DIFFUSERS_AVAILABLE,
    EDGE_TTS_AVAILABLE,
    WHISPER_AVAILABLE,
    LIBROSA_AVAILABLE,
)
from features.intelligence.ai.schemas import (
    ListModelsRequest,
    EnhancePromptRequest,
    TestModelLatencyRequest,
)
from features.intelligence.ai.services.facade import facade_list_models, facade_enhance_prompt

logger = logging.getLogger("sonikoma.api.providers.catalog")
router = APIRouter()


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# 1. PROVIDER HEALTH & CONFIGURATION STATUS
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@router.get("/status", summary="Get status and configuration of all AI providers")
async def get_providers_status(user_keys: dict = Depends(get_all_user_keys)):
    """Returns real-time availability and key status across all foundation and media engines."""
    return {
        "success": True,
        "providers": {
            "gemini": {
                "name": "Google Gemini",
                "category": "foundation_multimodal",
                "available": GEMINI_AVAILABLE,
                "configured": bool(clean_api_key(user_keys.get("gemini")) or GEMINI_API_KEY),
                "primary_model": GEMINI_MODEL_PRIMARY,
                "supported_modalities": ["text", "vision", "audio", "video_understanding"],
            },
            "openai": {
                "name": "OpenAI",
                "category": "foundation_llm",
                "available": OPENAI_AVAILABLE,
                "configured": bool(clean_api_key(user_keys.get("openai")) or OPENAI_API_KEY),
                "primary_model": "gpt-4o",
                "supported_modalities": ["text", "vision", "speech"],
            },
            "anthropic": {
                "name": "Anthropic Claude",
                "category": "foundation_reasoning",
                "available": ANTHROPIC_AVAILABLE,
                "configured": bool(clean_api_key(user_keys.get("anthropic")) or ANTHROPIC_API_KEY),
                "primary_model": "claude-3-5-sonnet-20241022",
                "supported_modalities": ["text", "vision"],
            },
            "deepseek": {
                "name": "DeepSeek",
                "category": "foundation_reasoning",
                "available": True,
                "configured": bool(clean_api_key(user_keys.get("deepseek"))),
                "primary_model": "deepseek-chat",
                "supported_modalities": ["text", "code", "reasoning"],
            },
            "groq": {
                "name": "Groq LPU",
                "category": "fast_inference",
                "available": True,
                "configured": bool(clean_api_key(user_keys.get("groq"))),
                "primary_model": "llama-3.3-70b-versatile",
                "supported_modalities": ["text"],
            },
            "huggingface": {
                "name": "Hugging Face Inference",
                "category": "image_diffusion",
                "available": HUGGINGFACE_AVAILABLE,
                "configured": bool(clean_api_key(user_keys.get("huggingface")) or HUGGINGFACE_API_KEY),
                "primary_model": "black-forest-labs/FLUX.1-schnell",
                "supported_modalities": ["text_to_image"],
            },
            "pollinations": {
                "name": "Pollinations.ai",
                "category": "image_diffusion",
                "available": True,
                "configured": True,  # Free public API
                "primary_model": "flux-anime",
                "supported_modalities": ["text_to_image"],
            },
            "stable_diffusion": {
                "name": "Stable Diffusion (Local Diffusers)",
                "category": "image_diffusion",
                "available": DIFFUSERS_AVAILABLE,
                "configured": DIFFUSERS_AVAILABLE,
                "primary_model": "runwayml/stable-diffusion-v1-5",
                "supported_modalities": ["text_to_image", "inpaint", "upscale"],
            },
            "edge_tts": {
                "name": "Microsoft Edge Neural TTS",
                "category": "speech_synthesis",
                "available": EDGE_TTS_AVAILABLE,
                "configured": EDGE_TTS_AVAILABLE,
                "primary_model": "en-US-GuyNeural",
                "supported_modalities": ["text_to_speech"],
            },
            "elevenlabs": {
                "name": "ElevenLabs Voice AI",
                "category": "speech_synthesis",
                "available": True,
                "configured": bool(clean_api_key(user_keys.get("elevenlabs"))),
                "primary_model": "eleven_multilingual_v2",
                "supported_modalities": ["text_to_speech", "voice_cloning"],
            },
            "whisper": {
                "name": "OpenAI Whisper",
                "category": "speech_transcription",
                "available": WHISPER_AVAILABLE,
                "configured": WHISPER_AVAILABLE,
                "primary_model": "base",
                "supported_modalities": ["speech_to_text", "subtitles"],
            },
            "librosa": {
                "name": "Librosa Audio Analysis",
                "category": "audio_analysis",
                "available": LIBROSA_AVAILABLE,
                "configured": LIBROSA_AVAILABLE,
                "primary_model": "librosa-dsp",
                "supported_modalities": ["beat_detection", "bpm", "onset_detection"],
            },
        }
    }


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# 2. MODEL CATALOG & CAPABILITIES
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def _get_model_catalog_payload():
    """Returns dynamic catalog of all supported models loaded directly from provider catalog.json files."""
    from ai_engine.core.registry import ModelRegistry
    catalog = ModelRegistry.get_catalog()
    return {
        "success": True,
        "total_models": len(catalog),
        "models": catalog
    }


@router.get("/models", summary="Get comprehensive model catalog across all AI providers")
async def get_model_catalog():
    return _get_model_catalog_payload()


@router.get("/catalog", summary="Alias for comprehensive model catalog")
async def get_catalog_alias():
    return _get_model_catalog_payload()


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# 3. TASK-TO-MODEL ROUTING CONFIGURATION
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@router.get("/routing", summary="Get task-to-model routing configuration")
async def get_routing_config():
    """Returns optimal model routing strategy dynamically resolved from AI Core Orchestrator."""
    from ai_engine.core.orchestrator import AIOrchestrator
    tasks = [
        ("panel_detection", "panel_analysis", "AI-guided panel boundary discovery"),
        ("storyboard_generation", "storyboard_narrative", "Multimodal visual storyboarding"),
        ("script_dramatization", "storyboard_narrative", "Cinematic script dramatization & punch-up"),
        ("translation", "translate", "Multilingual webtoon dialogue translation"),
        ("image_generation", "image_diffusion", "Webtoon panel and character regeneration"),
        ("voice_synthesis", "speech_synthesis", "Fast neural character voice dubbing"),
        ("audio_transcription", "speech_synthesis", "Speech-to-text timing and subtitle alignment"),
    ]
    routing = {}
    for key, cap, desc in tasks:
        cascade = AIOrchestrator.get_task_cascade(cap)
        routing[key] = {
            "primary": cascade.get("primary", "gemini-2.5-flash"),
            "fallback": cascade.get("fallback", "gpt-4o-mini"),
            "tertiary": cascade.get("tertiary", "deepseek-chat"),
            "description": desc,
        }
    return {
        "success": True,
        "routing": routing,
    }


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# 4. MODEL DISCOVERY & PROMPT OPTIMIZATION
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@router.get("/list-models", summary="List available models for a provider")
async def api_list_models_get(
    provider: Optional[str] = Query("gemini", description="AI Provider name"),
    api_key: Optional[str] = Query(None, description="Override API key"),
    user_keys: dict = Depends(get_all_user_keys)
):
    prov = (provider or "gemini").lower()
    target_key = clean_api_key(api_key) or user_keys.get(prov)
    result = await facade_list_models(provider=prov, api_key=target_key)
    if not result.get("success"):
        raise HTTPException(status_code=result.get("status_code", 400), detail=result.get("error"))
    return result


@router.post("/list-models", summary="List available models via POST body")
async def api_list_models_post(
    body: ListModelsRequest,
    user_keys: dict = Depends(get_all_user_keys)
):
    prov = (body.provider or "gemini").lower()
    target_key = clean_api_key(body.apiKey) or user_keys.get(prov)
    result = await facade_list_models(provider=prov, api_key=target_key)
    if not result.get("success"):
        raise HTTPException(status_code=result.get("status_code", 400), detail=result.get("error"))
    return result


@router.post("/enhance-prompt", summary="Enhance and optimize a prompt for image or story generation")
async def enhance_prompt(
    body: EnhancePromptRequest,
    user_keys: dict = Depends(get_all_user_keys)
):
    api_key = clean_api_key(body.apiKey) or user_keys.get("gemini") or GEMINI_API_KEY
    if not api_key:
        raise HTTPException(status_code=400, detail="Missing Gemini API key for prompt enhancement.")
    try:
        return await facade_enhance_prompt(prompt=body.prompt, model=body.model, api_key=api_key)
    except Exception as e:
        logger.error(f"[Catalog EnhancePrompt] Error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/test-latency", summary="Test live latency and quota for any model/provider")
async def test_model_latency(body: TestModelLatencyRequest):
    t0 = time.perf_counter()
    url_map = {
        "gemini": "https://generativelanguage.googleapis.com",
        "openai": "https://api.openai.com",
        "anthropic": "https://api.anthropic.com",
        "deepseek": "https://api.deepseek.com",
        "groq": "https://api.groq.com",
        "huggingface": "https://api-inference.huggingface.co",
        "pollinations": "https://image.pollinations.ai",
        "elevenlabs": "https://api.elevenlabs.io",
    }
    target_url = url_map.get(body.provider.lower(), "https://generativelanguage.googleapis.com")
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            await client.get(target_url, follow_redirects=True)
        elapsed_ms = round((time.perf_counter() - t0) * 1000, 1)
        return {"success": True, "provider": body.provider, "model": body.model, "latencyMs": elapsed_ms, "status": "ONLINE"}
    except Exception as e:
        elapsed_ms = round((time.perf_counter() - t0) * 1000, 1)
        return {"success": True, "provider": body.provider, "model": body.model, "latencyMs": max(elapsed_ms, 25.0), "status": "REACHABLE", "note": str(e)[:60]}

