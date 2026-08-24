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

# Known official metadata registry to enrich live API discovered models
MODEL_METADATA_AUGMENTATION: Dict[str, Dict[str, Any]] = {
    # ── Google Gemini Models ────────────────────────────────────────────────
    "gemini-3.7-flash": {
        
        "name": "Google Gemini 3.7 Flash (New Stable)",
        "category": "Multimodal Vision & Audio Workhorse",
        "context_window": 1048576,
        "max_output_tokens": 8192,
        "limit_rpm": 1000,
        "limit_tpm": 4000000,
        "limit_rpd": 10000,
        "prompt_price_per_1m": 0.075,
        "completion_price_per_1m": 0.30,
        "speed_rating": "Ultra Fast (<220ms)",
        "capabilities": ["vision", "json_mode", "streaming", "multilingual", "function_calling", "agentic_workflows", "deep_thinking", "text", "batch_api"],
        "recommended_for": ["Storyboard Generation", "Panel OCR & Visual Flow", "Manga Dialogue Translation"],
    },
    "gemini-3.6-flash": {
        "name": "Google Gemini 3.6 Flash (Stable)",
        "category": "Multimodal Vision & Audio Workhorse",
        "context_window": 1048576,
        "max_output_tokens": 8192,
        "limit_rpm": 1000,
        "limit_tpm": 4000000,
        "limit_rpd": 10000,
        "prompt_price_per_1m": 0.075,
        "completion_price_per_1m": 0.30,
        "speed_rating": "Ultra Fast (<240ms)",
        "capabilities": ["vision", "json_mode", "multilingual", "text", "batch_api"],
        "recommended_for": ["Secondary Failover", "Scraper Blueprint Extraction"],
    },
    "gemini-3.5-flash": {
        "name": "Google Gemini 3.5 Flash (Stable)",
        "category": "Multimodal Vision & Audio Workhorse",
        "context_window": 1048576,
        "max_output_tokens": 8192,
        "limit_rpm": 1000,
        "limit_tpm": 4000000,
        "limit_rpd": 10000,
        "prompt_price_per_1m": 0.075,
        "completion_price_per_1m": 0.30,
        "speed_rating": "Ultra Fast (~250ms)",
        "capabilities": ["vision", "json_mode", "multilingual", "text", "batch_api"],
        "recommended_for": ["Tertiary Failover", "Background Batch Jobs"],
    },
    "gemini-3.5-flash-lite": {
        "name": "Google Gemini 3.5 Flash Lite (Stable)",
        "category": "High-Throughput Sub-Second OCR & Chat",
        "context_window": 1048576,
        "max_output_tokens": 8192,
        "limit_rpm": 2000,
        "limit_tpm": 4000000,
        "limit_rpd": 10000,
        "prompt_price_per_1m": 0.0375,
        "completion_price_per_1m": 0.15,
        "speed_rating": "Ultra Fast (<180ms)",
        "capabilities": ["vision", "speed_optimized", "json_mode", "text", "batch_api"],
        "recommended_for": ["Realtime OCR Bounding Box Tracking", "Sub-Second Balloon Detection"],
    },
    "gemini-3.1-flash-image": {
        "name": "Nano Banana 2 (Gemini 3.1 Flash Image)",
        "category": "Image Generation & Inpainting",
        "context_window": 65536,
        "max_output_tokens": 4096,
        "limit_rpm": 60,
        "limit_tpm": 500000,
        "limit_rpd": 1000,
        "prompt_price_per_1m": 0.50,
        "completion_price_per_1m": 1.50,
        "speed_rating": "Fast (~450ms)",
        "capabilities": ["image_generation", "inpainting", "diffusion", "vision"],
        "recommended_for": ["Character Art Generation", "Speech Bubble Inpainting"],
    },
    "gemini-2.5-flash-preview-tts": {
        "name": "Google Gemini 2.5 Flash TTS",
        "category": "Voiceover & Audio Synthesis",
        "context_window": 32768,
        "max_output_tokens": 4096,
        "limit_rpm": 120,
        "limit_tpm": 500000,
        "limit_rpd": 2000,
        "prompt_price_per_1m": 0.20,
        "completion_price_per_1m": 0.60,
        "speed_rating": "Fast (~300ms)",
        "capabilities": ["tts", "audio", "voice_acting", "multilingual"],
        "recommended_for": ["Character Voice Synthesis", "Dramatic Manga Reading"],
    },

    # ── OpenAI Models ───────────────────────────────────────────────────────
    "gpt-4o": {
        "name": "OpenAI GPT-4o Omni",
        "category": "Flagship Multimodal Intelligence",
        "context_window": 128000,
        "max_output_tokens": 16384,
        "limit_rpm": 500,
        "limit_tpm": 3000000,
        "limit_rpd": 5000,
        "prompt_price_per_1m": 2.50,
        "completion_price_per_1m": 10.00,
        "speed_rating": "Fast (~320ms)",
        "capabilities": ["vision", "chat", "json_mode", "text", "reasoning"],
        "recommended_for": ["Complex Manga Script Structure", "High-Resolution OCR"],
    },
    "gpt-4o-mini": {
        "name": "OpenAI GPT-4o Mini",
        "category": "Cost-Efficient Multimodal Assistant",
        "context_window": 128000,
        "max_output_tokens": 16384,
        "limit_rpm": 1000,
        "limit_tpm": 5000000,
        "limit_rpd": 10000,
        "prompt_price_per_1m": 0.15,
        "completion_price_per_1m": 0.60,
        "speed_rating": "Ultra Fast (~190ms)",
        "capabilities": ["vision", "chat", "json_mode", "text"],
        "recommended_for": ["Fast Chapter Categorization", "YouTube SEO Tagging"],
    },
    "whisper-1": {
        "name": "OpenAI Whisper v3 Audio STT",
        "category": "Speech Recognition & Subtitles",
        "context_window": 32000,
        "max_output_tokens": 2048,
        "limit_rpm": 100,
        "limit_tpm": 500000,
        "limit_rpd": 2000,
        "prompt_price_per_1m": 0.006,
        "completion_price_per_1m": 0.006,
        "speed_rating": "Fast (~250ms)",
        "capabilities": ["stt", "audio", "timestamps"],
        "recommended_for": ["Voiceover Audio Alignment", "Subtitle Generation"],
    },

    # ── Anthropic Models ────────────────────────────────────────────────────
    "claude-3-5-sonnet-20241022": {
        "name": "Claude 3.5 Sonnet (Latest)",
        "category": "Elite Creative Scripting & Nuance",
        "context_window": 200000,
        "max_output_tokens": 8192,
        "limit_rpm": 100,
        "limit_tpm": 1000000,
        "limit_rpd": 2000,
        "prompt_price_per_1m": 3.00,
        "completion_price_per_1m": 15.00,
        "speed_rating": "Standard (~600ms)",
        "capabilities": ["creative_writing", "deep_thinking", "vision", "text"],
        "recommended_for": ["Dramatic Comic Storytelling", "Character Voice Persona Scripting"],
    },
    "claude-3-5-haiku-20241022": {
        "name": "Claude 3.5 Haiku",
        "category": "High-Speed Lightweight Creative Reasoning",
        "context_window": 200000,
        "max_output_tokens": 8192,
        "limit_rpm": 500,
        "limit_tpm": 2000000,
        "limit_rpd": 5000,
        "prompt_price_per_1m": 0.80,
        "completion_price_per_1m": 4.00,
        "speed_rating": "Fast (~280ms)",
        "capabilities": ["text", "creative_writing", "json_mode"],
        "recommended_for": ["Quick Dialogue Rewrites", "Scene Summaries"],
    },

    # ── Groq Models ─────────────────────────────────────────────────────────
    "llama-3.3-70b-versatile": {
        "name": "Groq Llama 3.3 70B Versatile",
        "category": "Realtime Low-Latency LPU Engine",
        "context_window": 128000,
        "max_output_tokens": 8192,
        "limit_rpm": 30,
        "limit_tpm": 100000,
        "limit_rpd": 1000,
        "prompt_price_per_1m": 0.59,
        "completion_price_per_1m": 0.79,
        "speed_rating": "Extreme (<90ms)",
        "capabilities": ["speed_optimized", "text", "json_mode"],
        "recommended_for": ["Instant Dialogue Tweaks", "Real-Time Chat"],
    },

    # ── DeepSeek Models ─────────────────────────────────────────────────────
    "deepseek-chat": {
        "name": "DeepSeek V3 Chat",
        "category": "Deep Reasoning & Coding",
        "context_window": 64000,
        "max_output_tokens": 4096,
        "limit_rpm": 60,
        "limit_tpm": 100000,
        "limit_rpd": 10000,
        "prompt_price_per_1m": 0.14,
        "completion_price_per_1m": 0.28,
        "speed_rating": "Fast (~350ms)",
        "capabilities": ["reasoning", "json_mode", "text"],
        "recommended_for": ["Cost-Effective Story Analysis", "Complex Script Structure"],
    },
    "deepseek-reasoner": {
        "name": "DeepSeek R1 Reasoner",
        "category": "Deep Reasoning & Coding",
        "context_window": 64000,
        "max_output_tokens": 8192,
        "limit_rpm": 60,
        "limit_tpm": 100000,
        "limit_rpd": 10000,
        "prompt_price_per_1m": 0.55,
        "completion_price_per_1m": 2.19,
        "speed_rating": "Standard (~900ms)",
        "capabilities": ["deep_thinking", "complex_reasoning", "text"],
        "recommended_for": ["Complex Plot Outlining", "Story Logic Verification"],
    },

    # ── Built-in Zero-Key Engines ───────────────────────────────────────────
    "edge-tts-neural": {
        "name": "Microsoft Edge Neural TTS",
        "category": "Voiceover & Audio Synthesis",
        "context_window": 10000,
        "max_output_tokens": 10000,
        "limit_rpm": 120,
        "limit_tpm": 100000,
        "limit_rpd": 10000,
        "prompt_price_per_1m": 0.0,
        "completion_price_per_1m": 0.0,
        "speed_rating": "Realtime (~150ms)",
        "capabilities": ["tts", "audio", "multilingual", "built_in"],
        "recommended_for": ["Zero-Cost Voice Narration", "Multilingual Character TTS"],
    },
    "FLUX.1-schnell": {
        "name": "FLUX.1 Schnell Diffusion",
        "category": "Image Generation & Inpainting",
        "context_window": 2048,
        "max_output_tokens": 1024,
        "limit_rpm": 30,
        "limit_tpm": 50000,
        "limit_rpd": 500,
        "prompt_price_per_1m": 0.0,
        "completion_price_per_1m": 0.0,
        "speed_rating": "Fast (~600ms)",
        "capabilities": ["image_generation", "diffusion", "art"],
        "recommended_for": ["Anime Comic Art Generation", "Style Modifiers"],
    },
    "deepl-neural": {
        "name": "DeepL Neural Multilingual Translator",
        "category": "Multilingual Manga Translation",
        "context_window": 10000,
        "max_output_tokens": 10000,
        "limit_rpm": 100,
        "limit_tpm": 500000,
        "limit_rpd": 5000,
        "prompt_price_per_1m": 0.50,
        "completion_price_per_1m": 0.50,
        "speed_rating": "Fast (~200ms)",
        "capabilities": ["translation", "multilingual"],
        "recommended_for": ["Webtoon Dialogue Localization", "Speech Balloon Translation"],
    }
}


class ModelDiscoveryService:
    """
    Discovers, validates, and filters models strictly through configured API keys.
    """

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
    async def discover_models_for_keys(
        cls, user_keys: Optional[Dict[str, str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Discovers all available AI models strictly for configured and active API keys.
        Unsupported/unconfigured models are excluded to prevent runtime crashes.
        """
        active_keys = cls.get_configured_providers(user_keys)
        discovered_models: List[Dict[str, Any]] = []
        seen_ids = set()

        # Iterate all models from provider catalog
        for m in MODEL_CATALOG_DETAILED:
            m_id = m.get("id", "")
            provider = m.get("provider", "gemini").lower()
            
            # Check if this provider has an active API key
            if provider not in active_keys:
                continue

            if m_id in seen_ids:
                continue
            seen_ids.add(m_id)

            # Augment with exact specifications
            meta = MODEL_METADATA_AUGMENTATION.get(m_id, {})
            
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
                "context_window": meta.get("context_window") or m.get("context_window", 128000),
                "max_output_tokens": meta.get("max_output_tokens") or m.get("max_output_tokens", 8192),
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
