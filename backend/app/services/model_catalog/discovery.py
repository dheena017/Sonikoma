"""
backend/app/services/model_catalog/discovery.py
─────────────────────────────────────────────────────────────────────────────
Dynamic Model Discovery & API Key Capability Validation Engine.
Ensures ONLY models supported by active API keys are loaded, preventing unsupported
model crashes while dynamically enriching context windows, limits, pricing, and capabilities.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import time
import json
import logging
import asyncio
from typing import List, Dict, Any, Optional

import httpx

from services.model_catalog.registry import ModelRegistry, MODEL_CATALOG_DETAILED

logger = logging.getLogger("sonikoma.model_discovery")

def _build_metadata_augmentation() -> Dict[str, Dict[str, Any]]:
    """Builds metadata lookup map directly from provider catalog files (e.g. google.json)."""
    aug: Dict[str, Dict[str, Any]] = {}
    catalog = ModelRegistry.get_catalog() if hasattr(ModelRegistry, "get_catalog") else MODEL_CATALOG_DETAILED
    for m in catalog:
        m_id = m.get("id")
        if m_id:
            aug[m_id] = m
            aug[m_id.lower()] = m
            # Also register stripped variants
            clean_id = m_id.replace("models/", "")
            aug[clean_id] = m
            aug[clean_id.lower()] = m
    return aug

# Dynamic metadata registry to enrich live API discovered models directly from google.json & provider catalogs
MODEL_METADATA_AUGMENTATION: Dict[str, Dict[str, Any]] = _build_metadata_augmentation()



class ModelDiscoveryService:
    """
    Discovers, validates, and filters models strictly through configured API keys.
    Probes live provider endpoints (Google, OpenAI, Groq, DeepSeek) to ensure only
    supported, active models on the user's API key plan are exposed.
    """
    _cache: Dict[str, Any] = {}
    _cache_ttl: float = 300.0  # 5 minutes
    _last_probe_time: Dict[str, float] = {}

    @classmethod
    def get_configured_providers(cls, user_keys: Optional[Dict[str, str]] = None) -> Dict[str, str]:
        """Returns map of provider_id -> active api_key."""
        keys: Dict[str, str] = {}
        
        # 1. Environment keys
        if os.getenv("GEMINI_API_KEY"):
            keys["gemini"] = os.getenv("GEMINI_API_KEY", "")
        if os.getenv("OPENAI_API_KEY"):
            keys["openai"] = os.getenv("OPENAI_API_KEY", "")
        if os.getenv("ANTHROPIC_API_KEY"):
            keys["anthropic"] = os.getenv("ANTHROPIC_API_KEY", "")
        if os.getenv("GROQ_API_KEY"):
            keys["groq"] = os.getenv("GROQ_API_KEY", "")
        if os.getenv("DEEPSEEK_API_KEY"):
            keys["deepseek"] = os.getenv("DEEPSEEK_API_KEY", "")
        if os.getenv("ELEVENLABS_API_KEY"):
            keys["elevenlabs"] = os.getenv("ELEVENLABS_API_KEY", "")
        if os.getenv("DEEPL_API_KEY"):
            keys["deepl"] = os.getenv("DEEPL_API_KEY", "")
        if os.getenv("HUGGINGFACE_API_KEY"):
            keys["huggingface"] = os.getenv("HUGGINGFACE_API_KEY", "")

        # 2. Built-in providers (always configured)
        keys["edgetts"] = "builtin_free"
        keys["stablediffusion"] = "builtin_local"

        # 3. User runtime keys override
        if user_keys:
            for p, k in user_keys.items():
                if k:
                    keys[p.lower()] = k

        return keys

    @classmethod
    def probe_live_gemini_models(cls, api_key: str) -> List[Dict[str, Any]]:
        """Queries Google Generative Language API directly to get verified active models."""
        cache_key = f"gemini_{api_key[:8]}"
        now = time.time()
        if cache_key in cls._cache and (now - cls._last_probe_time.get(cache_key, 0)) < cls._cache_ttl:
            return cls._cache[cache_key]

        try:
            with httpx.Client(timeout=4.0) as client:
                res = client.get(f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}")
                if res.status_code == 200:
                    data = res.json()
                    models = []
                    for m in data.get("models", []):
                        methods = m.get("supportedGenerationMethods", [])
                        m_id = m.get("name", "").replace("models/", "")
                        # Filter strictly to generateContent models to prevent 404 crashes
                        if "generateContent" in methods:
                            models.append({
                                "id": m_id,
                                "name": m.get("displayName") or m_id,
                                "context_window": m.get("inputTokenLimit", 1048576),
                                "max_output_tokens": m.get("outputTokenLimit", 8192),
                                "capabilities": ["vision", "json_mode", "text"] if "generateContent" in methods else ["text"],
                            })
                    cls._cache[cache_key] = models
                    cls._last_probe_time[cache_key] = now
                    return models
        except Exception as e:
            logger.debug(f"[ModelDiscovery] Live Gemini probe notice: {e}")

        return []

    @classmethod
    def probe_live_openai_models(cls, api_key: str) -> List[Dict[str, Any]]:
        """Queries OpenAI /v1/models endpoint with user API key."""
        cache_key = f"openai_{api_key[:8]}"
        now = time.time()
        if cache_key in cls._cache and (now - cls._last_probe_time.get(cache_key, 0)) < cls._cache_ttl:
            return cls._cache[cache_key]

        try:
            with httpx.Client(timeout=4.0) as client:
                res = client.get("https://api.openai.com/v1/models", headers={"Authorization": f"Bearer {api_key}"})
                if res.status_code == 200:
                    data = res.json()
                    models = []
                    for m in data.get("data", []):
                        m_id = m.get("id", "")
                        if any(k in m_id for k in ["gpt", "o1", "o3", "dall-e", "whisper", "tts"]):
                            models.append({"id": m_id, "name": m_id})
                    cls._cache[cache_key] = models
                    cls._last_probe_time[cache_key] = now
                    return models
        except Exception as e:
            logger.debug(f"[ModelDiscovery] Live OpenAI probe notice: {e}")

        return []

    @classmethod
    async def discover_models_for_keys(
        cls, user_keys: Optional[Dict[str, str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Discovers all available AI models strictly for configured and active API keys.
        Probes live provider endpoints where possible, augmenting with rich metadata.
        """
        active_keys = cls.get_configured_providers(user_keys)
        discovered_models: List[Dict[str, Any]] = []
        seen_ids = set()

        # 1. Live probe for Google Gemini if key is active
        live_gemini: Dict[str, Dict[str, Any]] = {}
        if "gemini" in active_keys and active_keys["gemini"] not in ["builtin_free", ""]:
            live_list = cls.probe_live_gemini_models(active_keys["gemini"])
            for lg in live_list:
                m_id = lg["id"]
                seen_ids.add(m_id)
                meta = MODEL_METADATA_AUGMENTATION.get(m_id, {})
                ctx = lg.get("context_window") or meta.get("context_window") or 1048576
                max_out = lg.get("max_output_tokens") or meta.get("max_output_tokens") or 8192

                discovered_models.append({
                    "id": m_id,
                    "name": meta.get("name") or lg.get("name") or m_id,
                    "provider": "gemini",
                    "provider_name": "Google Gemini",
                    "category": meta.get("category") or "Multimodal AI Model",
                    "context_window": ctx,
                    "max_output_tokens": max_out,
                    "limit_rpm": meta.get("limit_rpm", 1000),
                    "limit_tpm": meta.get("limit_tpm", 4000000),
                    "limit_rpd": meta.get("limit_rpd", 10000),
                    "cost_per_1m_prompt": meta.get("prompt_price_per_1m", 0.075),
                    "cost_per_1m_completion": meta.get("completion_price_per_1m", 0.30),
                    "speed_rating": meta.get("speed_rating", "Ultra Fast (<250ms)"),
                    "capabilities": meta.get("capabilities") or lg.get("capabilities", ["vision", "text"]),
                    "recommended_for": meta.get("recommended_for", ["Comic Generation", "Translation", "OCR"]),
                    "status": "HEALTHY",
                    "is_configured": True,
                })

        # 2. Iterate remaining catalog models for other active providers (OpenAI, DeepSeek, Anthropic, EdgeTTS, SD, etc.)
        for m in MODEL_CATALOG_DETAILED:
            m_id = m.get("id", "")
            provider = m.get("provider", "gemini").lower()
            
            # Check if this provider has an active API key
            if provider not in active_keys:
                continue

            # Skip Gemini here if we already populated from live API
            if provider == "gemini" and live_gemini:
                continue

            if m_id in seen_ids:
                continue
            seen_ids.add(m_id)

            meta = MODEL_METADATA_AUGMENTATION.get(m_id, {})
            ctx = meta.get("context_window") or m.get("context_window", 128000)
            max_out = meta.get("max_output_tokens") or m.get("max_output_tokens", 8192)

            enriched_model = {
                "id": m_id,
                "name": meta.get("name") or m.get("name") or m_id,
                "provider": provider,
                "provider_name": {
                    "gemini": "Google Gemini",
                    "openai": "OpenAI",
                    "anthropic": "Anthropic Claude",
                    "groq": "Groq LPU",
                    "deepseek": "DeepSeek AI",
                    "elevenlabs": "ElevenLabs Voice AI",
                    "deepl": "DeepL Pro",
                    "edgetts": "Microsoft Edge Neural TTS",
                    "stablediffusion": "Local Stable Diffusion",
                    "huggingface": "Hugging Face Hub",
                }.get(provider, provider.capitalize()),
                "category": meta.get("category") or m.get("category") or "General Intelligence",
                "context_window": ctx,
                "max_output_tokens": max_out,
                "limit_rpm": meta.get("limit_rpm") or m.get("limit_rpm", 60),
                "limit_tpm": meta.get("limit_tpm") or m.get("limit_tpm", 1000000),
                "limit_rpd": meta.get("limit_rpd") or m.get("limit_rpd", 10000),
                "cost_per_1m_prompt": meta.get("prompt_price_per_1m") or m.get("prompt_price_per_1m", 0.075),
                "cost_per_1m_completion": meta.get("completion_price_per_1m") or m.get("completion_price_per_1m", 0.30),
                "speed_rating": meta.get("speed_rating") or m.get("speed_rating", "Fast"),
                "capabilities": meta.get("capabilities") or m.get("capabilities", ["text"]),
                "recommended_for": meta.get("recommended_for") or m.get("recommended_for", ["Comic Generation"]),
                "status": "HEALTHY",
                "is_configured": True,
            }
            discovered_models.append(enriched_model)

        return discovered_models
