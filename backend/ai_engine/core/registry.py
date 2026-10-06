"""
backend/providers/core/registry.py
─────────────────────────────────────────────────────────────────────────────
Universal, portable AI Model Registry and dynamic catalog engine.
Scans provider directories for `catalog.json` and manages model resolution,
pricing, capabilities, and cross-provider fallback chains.
─────────────────────────────────────────────────────────────────────────────
"""

import os
import json
import logging
from typing import List, Any, Optional, Dict, Tuple

logger = logging.getLogger("sonikoma.providers.registry")

_CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
# The providers directory is located at ai_engine/providers
_PROVIDERS_ROOT = os.path.abspath(os.path.join(_CURRENT_DIR, "..", "providers"))


def load_catalog_from_providers() -> List[Dict[str, Any]]:
    """
    Loads model catalogs dynamically from each provider's `catalog.json` in `providers/<provider>/catalog.json`,
    prioritizing Gemini models first.
    """
    all_models: List[Dict[str, Any]] = []
    seen_ids = set()

    if os.path.exists(_PROVIDERS_ROOT) and os.path.isdir(_PROVIDERS_ROOT):
        subdirs = [
            d for d in os.listdir(_PROVIDERS_ROOT)
            if os.path.isdir(os.path.join(_PROVIDERS_ROOT, d))
            and d not in ("__pycache__", "core", "skills", "api", "catalogs")
        ]
        # Prioritize Google Gemini models first
        ordered_dirs = [d for d in subdirs if "gemini" in d.lower()] + [
            d for d in sorted(subdirs) if "gemini" not in d.lower()
        ]

        for prov_name in ordered_dirs:
            prov_dir = os.path.join(_PROVIDERS_ROOT, prov_name)
            cat_file = os.path.join(prov_dir, "catalog.json")
            if not os.path.exists(cat_file):
                candidate_jsons = [f for f in os.listdir(prov_dir) if f.endswith(".json")]
                if candidate_jsons:
                    cat_file = os.path.join(prov_dir, candidate_jsons[0])
                else:
                    continue

            try:
                with open(cat_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        for m in data:
                            m_id = m.get("id")
                            if m_id and m_id not in seen_ids:
                                seen_ids.add(m_id)
                                all_models.append(m)
            except Exception as e:
                logger.error(f"Failed to load catalog for provider '{prov_name}': {e}")

    return all_models


# Dynamic in-memory catalog
MODEL_CATALOG_DETAILED: List[Dict[str, Any]] = load_catalog_from_providers()


class ModelRegistry:
    """Manages model metadata, pricing, resolution, and filtering dynamically."""

    @classmethod
    def get_catalog(cls) -> List[Dict[str, Any]]:
        """Returns the dynamic catalog of all models."""
        global MODEL_CATALOG_DETAILED
        if not MODEL_CATALOG_DETAILED:
            MODEL_CATALOG_DETAILED = load_catalog_from_providers()
        return MODEL_CATALOG_DETAILED

    @classmethod
    def get_catalog_by_provider(cls, provider: str) -> List[Dict[str, Any]]:
        """Returns models exclusively for the specified provider (e.g. 'gemini' / 'google')."""
        p = provider.lower().replace("google", "gemini")
        return [m for m in cls.get_catalog() if m.get("provider", "").lower() == p]

    @classmethod
    def reload_catalog(cls) -> List[Dict[str, Any]]:
        """Hot-reloads the catalog from disk across all provider JSON files."""
        global MODEL_CATALOG_DETAILED
        MODEL_CATALOG_DETAILED = load_catalog_from_providers()
        logger.info(f"Reloaded {len(MODEL_CATALOG_DETAILED)} models from provider catalogs into ModelRegistry.")
        return MODEL_CATALOG_DETAILED

    @classmethod
    def register_model(cls, model_meta: Dict[str, Any]) -> bool:
        """Dynamically registers or updates a model in the catalog."""
        global MODEL_CATALOG_DETAILED
        if not model_meta.get("id") or not model_meta.get("provider"):
            return False
        
        # Remove existing if present
        MODEL_CATALOG_DETAILED = [m for m in MODEL_CATALOG_DETAILED if m["id"] != model_meta["id"]]
        MODEL_CATALOG_DETAILED.append(model_meta)
        return True

    @classmethod
    def get_catalog_for_providers(cls, available_providers: List[str]) -> List[Dict[str, Any]]:
        """Returns models matching the given list of available providers."""
        catalog = cls.get_catalog()
        if not available_providers:
            return [m for m in catalog if m.get("provider") == "gemini"] or catalog
        
        normalized = [
            p.lower().replace("google", "gemini").replace("edge_tts", "edgetts").replace("stable_diffusion", "stablediffusion")
            for p in available_providers
        ]
        return [m for m in catalog if m.get("provider", "").lower() in normalized]

    @classmethod
    def calculate_cost(
        cls,
        model_name: str,
        in_tokens: int = 0,
        out_tokens: int = 0,
        chars: int = 0,
        audio_seconds: float = 0.0,
        images: int = 0,
    ) -> float:
        """Estimate cost in USD based on model pricing metadata across modalities."""
        name_lower = model_name.lower().strip()
        catalog = cls.get_catalog()
        
        for m in catalog:
            if m["id"].lower() == name_lower:
                in_rate = m.get("prompt_price_per_1m", 0.0) / 1_000_000
                out_rate = m.get("completion_price_per_1m", 0.0) / 1_000_000
                char_rate = m.get("price_per_1k_chars", 0.0) / 1_000
                image_rate = m.get("price_per_image", 0.0)
                audio_min_rate = m.get("price_per_audio_minute", 0.0)
                
                token_cost = (in_tokens * in_rate) + (out_tokens * out_rate)
                char_cost = chars * char_rate
                image_cost = images * image_rate
                audio_cost = (audio_seconds / 60.0) * audio_min_rate
                return token_cost + char_cost + image_cost + audio_cost

        return 0.0

    @classmethod
    def resolve_model_provider(cls, model_str: str) -> Tuple[str, str]:
        """
        Extracts (provider, model_name) from any model identifier string.
        Prioritizes dynamic catalog lookup.
        """
        if not model_str:
            catalog = cls.get_catalog()
            first = catalog[0] if catalog else {"provider": "gemini", "id": "gemini-2.5-flash"}
            return first["provider"], first["id"]

        m = model_str.strip()
        m_lower = m.lower()

        # 1. Check explicit provider prefix e.g. "openai/gpt-4o", "gemini/gemini-2.5-flash"
        if "/" in m:
            parts = m.split("/", 1)
            prefix = parts[0].lower()
            model_id = parts[1]
            if prefix in ("gemini", "google"):
                return "gemini", model_id
            elif prefix in ("openai", "chatgpt"):
                return "openai", model_id
            elif prefix in ("anthropic", "claude"):
                return "anthropic", model_id
            elif prefix in ("groq",):
                return "groq", model_id
            elif prefix in ("deepseek",):
                return "deepseek", model_id
            elif prefix in ("elevenlabs",):
                return "elevenlabs", model_id
            elif prefix in ("deepl",):
                return "deepl", model_id
            elif prefix in ("edgetts", "edge-tts"):
                return "edgetts", model_id
            elif prefix in ("stablediffusion", "sd"):
                return "stablediffusion", model_id
            elif prefix in ("whisper",):
                return "whisper", model_id
            elif prefix in ("huggingface", "hf"):
                return "huggingface", model_id

        # 2. Match exact ID against dynamic catalog
        for entry in cls.get_catalog():
            if entry["id"].lower() == m_lower:
                return entry["provider"], entry["id"]

        # 3. Standard heuristics
        if m_lower.startswith(("gpt-", "o1", "o3", "dall-e", "text-embedding", "whisper", "tts-")):
            return "openai", m
        if m_lower.startswith("claude-"):
            return "anthropic", m
        if m_lower.startswith(("llama-", "mixtral-", "gemma-")):
            return "groq", m
        if m_lower.startswith("deepseek-"):
            return "deepseek", m
        if m_lower.startswith("eleven_") or "eleven" in m_lower:
            return "elevenlabs", m
        if m_lower.startswith("deepl") or "deepl" in m_lower:
            return "deepl", m
        if m_lower.startswith("edge-tts") or "neural" in m_lower:
            return "edgetts", m
        if m_lower.startswith(("gemini-", "models/gemini-", "veo-", "lyria-", "deep-research", "antigravity-")):
            clean = m.replace("models/", "")
            return "gemini", clean
        if m_lower.startswith(("flux.", "sdxl", "stabilityai/", "qwen", "meta-llama/", "mistralai/")):
            return "huggingface", m
        if "/" in m:
            return "huggingface", m

        return "gemini", m

    RECOMMENDED_CAPABILITY_CHAINS: Dict[str, List[Tuple[str, str]]] = {
        "storyboard_narrative": [("gemini", "gemini-2.5-flash"), ("anthropic", "claude-3-5-sonnet-20241022"), ("openai", "gpt-4o")],
        "panel_analysis": [("gemini", "gemini-2.5-flash"), ("gemini", "gemini-3.5-flash-lite"), ("openai", "gpt-4o")],
        "batch_panel_analysis": [("gemini", "gemini-2.5-flash"), ("gemini", "gemini-3.5-flash-lite"), ("openai", "gpt-4o")],
        "scraper_blueprint": [("gemini", "gemini-2.5-flash"), ("openai", "gpt-4o-mini"), ("deepseek", "deepseek-chat")],
        "prompt_enhancement": [("gemini", "gemini-2.5-flash"), ("openai", "gpt-4o-mini"), ("anthropic", "claude-3-5-haiku-20241022")],
        "image_diffusion": [("pollinations", "flux"), ("huggingface", "FLUX.1-schnell"), ("openai", "dall-e-3"), ("stablediffusion", "stable-diffusion-xl")],
        "speech_synthesis": [("edgetts", "edge-tts-neural"), ("elevenlabs", "eleven_multilingual_v2"), ("openai", "tts-1-hd")],
        "translate": [("deepl", "deepl-pro"), ("gemini", "gemini-2.5-flash"), ("openai", "gpt-4o-mini")],
        "character_persona": [("anthropic", "claude-3-5-sonnet-20241022"), ("openai", "gpt-4o"), ("gemini", "gemini-2.5-flash")],
        "seo_optimization": [("openai", "gpt-4o-mini"), ("gemini", "gemini-2.5-flash"), ("deepseek", "deepseek-chat")],
        "sfx_audio": [("gemini", "gemini-2.5-flash"), ("openai", "gpt-4o-mini"), ("anthropic", "claude-3-5-haiku-20241022")],
        "smart_crop": [("gemini", "gemini-2.5-flash"), ("gemini", "gemini-3.5-flash-lite"), ("openai", "gpt-4o")],
    }

    @classmethod
    def get_cross_provider_fallback_chain(cls, capability: str) -> List[Tuple[str, str]]:
        """Returns capability-aware cross-provider fallbacks."""
        cap = capability.lower()
        if cap in cls.RECOMMENDED_CAPABILITY_CHAINS:
            return cls.RECOMMENDED_CAPABILITY_CHAINS[cap]

        matching: List[Tuple[str, str]] = []
        for m in cls.get_catalog():
            m_caps = [c.lower() for c in m.get("capabilities", [])]
            m_cat = m.get("category", "").lower()
            if cap in m_caps or cap in m_cat or (cap in ("text", "script", "dramatization", "seo", "sfx", "storyboard_narrative") and "text" in m_caps):
                matching.append((m["provider"], m["id"]))

        if matching:
            return matching
        return [(m["provider"], m["id"]) for m in cls.get_catalog()[:5]]

    @classmethod
    def get_primary_model_for_capability(cls, capability: str) -> str:
        """Dynamically finds the best primary model for any capability."""
        chain = cls.get_cross_provider_fallback_chain(capability)
        return chain[0][1] if chain else "gemini-2.5-flash"
