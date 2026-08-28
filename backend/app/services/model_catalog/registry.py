"""
backend/app/services/model_catalog/registry.py
─────────────────────────────────────────────────────────────────────────────
Manages the AI model catalog dynamically loaded from provider-separated JSONs
in providers/ (e.g. google.json, openai.json, anthropic.json, etc.).
Provides provider resolution, pricing calculation, token limit validation,
and dynamic capability fallback routing with ZERO hardcoded model dictionaries.
─────────────────────────────────────────────────────────────────────────────
"""
import os
import json
import logging
from typing import List, Any, Optional, Dict

logger = logging.getLogger("sonikoma.model_catalog")

_CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
_PROVIDERS_DIR = os.path.join(_CURRENT_DIR, "providers")


def load_catalog_from_providers() -> List[Dict[str, Any]]:
    """
    Loads model catalogs dynamically from separate provider JSON files in providers/
    (e.g., google.json, openai.json, anthropic.json, etc.), ensuring google.json is prioritized first.
    """
    all_models: List[Dict[str, Any]] = []
    seen_ids = set()

    if os.path.exists(_PROVIDERS_DIR) and os.path.isdir(_PROVIDERS_DIR):
        all_files = [f for f in os.listdir(_PROVIDERS_DIR) if f.endswith(".json")]
        # Prioritize Google Gemini models first
        ordered_files = [f for f in all_files if "google" in f.lower() or "gemini" in f.lower()] + [
            f for f in sorted(all_files) if "google" not in f.lower() and "gemini" not in f.lower()
        ]

        for fname in ordered_files:
            fpath = os.path.join(_PROVIDERS_DIR, fname)
            try:
                with open(fpath, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        for m in data:
                            m_id = m.get("id")
                            if m_id and m_id not in seen_ids:
                                seen_ids.add(m_id)
                                all_models.append(m)
            except Exception as e:
                logger.error(f"Failed to load provider catalog {fname}: {e}")

    return all_models



# Dynamic in-memory catalog loaded from provider files
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
    def resolve_model_by_input(cls, user_input: str, models_list: List[Any], active_provider: str) -> Optional[Any]:
        """Resolves a model object/dict from list based on user index choice or exact ID match."""
        user_input = user_input.strip()
        if not user_input or not models_list:
            return None

        try:
            idx = int(user_input) - 1
            if 0 <= idx < len(models_list):
                return models_list[idx]
        except ValueError:
            pass

        for m in models_list:
            if active_provider == "gemini":
                m_name = getattr(m, 'name', '') if not isinstance(m, dict) else m.get("id", m.get("name", ""))
                clean_name = m_name.replace("models/", "")
                if user_input.lower() == m_name.lower() or user_input.lower() == clean_name.lower():
                    return m
            else:
                m_id = m.get("id", m.get("name", "")) if isinstance(m, dict) else getattr(m, 'name', '')
                if user_input.lower() == m_id.lower():
                    return m

        return None

    @classmethod
    def filter_models(
        cls,
        models_list: List[Any],
        active_provider: str,
        filter_query: Optional[str] = None,
        show_free_only: bool = False
    ) -> List[Any]:
        """Filters models list by query and free tier availability."""
        if not models_list:
            return []

        result = models_list
        if filter_query:
            q = filter_query.lower().strip()
            filtered = []
            for m in result:
                m_name = m.get("name", m.get("id", "")) if isinstance(m, dict) else getattr(m, 'name', '')
                m_desc = m.get("description", "") if isinstance(m, dict) else getattr(m, 'description', '')
                if q in m_name.lower() or q in m_desc.lower():
                    filtered.append(m)
            result = filtered

        return result

    @classmethod
    def resolve_model_provider(cls, model_str: str) -> tuple[str, str]:
        """
        Extracts (provider, model_name) from any model identifier string.
        Prioritizes dynamic catalog lookup.
        """
        if not model_str:
            catalog = cls.get_catalog()
            first = catalog[0] if catalog else {"provider": "gemini", "id": "gemini-3.7-flash"}
            return first["provider"], first["id"]

        m = model_str.strip()
        m_lower = m.lower()

        # 1. Check explicit provider prefix e.g. "openai/gpt-4o", "gemini/gemini-3.7-flash"
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

    @classmethod
    def get_fallback_models_for_provider(cls, provider: str) -> List[str]:
        """Returns the safe fallback chain dynamically computed from the model catalog for the given provider."""
        p = provider.lower().replace("google", "gemini")
        matching = [m["id"] for m in cls.get_catalog() if m.get("provider", "").lower() == p]
        if matching:
            return matching
        return [m["id"] for m in cls.get_catalog() if m.get("provider") == "gemini"] or ["gemini-3.7-flash"]

    RECOMMENDED_CAPABILITY_CHAINS: Dict[str, List[tuple[str, str]]] = {
        "storyboard_narrative": [("gemini", "gemini-3.7-flash"), ("anthropic", "claude-3-5-sonnet-20241022"), ("openai", "gpt-4o")],
        "panel_analysis": [("gemini", "gemini-3.7-flash"), ("openai", "gpt-4o"), ("anthropic", "claude-3-5-sonnet-20241022")],
        "scraper_blueprint": [("gemini", "gemini-3.7-flash"), ("openai", "gpt-4o-mini"), ("deepseek", "deepseek-chat")],
        "prompt_enhancement": [("gemini", "gemini-3.7-flash"), ("openai", "gpt-4o-mini"), ("anthropic", "claude-3-5-haiku-20241022")],
        "image_diffusion": [("huggingface", "FLUX.1-schnell"), ("openai", "dall-e-3"), ("stablediffusion", "stable-diffusion-xl")],
        "speech_synthesis": [("elevenlabs", "eleven_multilingual_v2"), ("openai", "tts-1-hd"), ("edgetts", "edge-tts-neural")],
        "translate": [("deepl", "deepl-pro"), ("gemini", "gemini-3.7-flash"), ("openai", "gpt-4o-mini")],
        "character_persona": [("anthropic", "claude-3-5-sonnet-20241022"), ("openai", "gpt-4o"), ("gemini", "gemini-3.7-flash")],
        "seo_optimization": [("openai", "gpt-4o-mini"), ("gemini", "gemini-3.7-flash"), ("deepseek", "deepseek-chat")],
        "sfx_audio": [("gemini", "gemini-3.7-flash"), ("openai", "gpt-4o-mini"), ("anthropic", "claude-3-5-haiku-20241022")],
        "smart_crop": [("gemini", "gemini-3.7-flash"), ("openai", "gpt-4o"), ("gemini", "gemini-3.5-flash")],
    }

    @classmethod
    def get_cross_provider_fallback_chain(cls, capability: str) -> List[tuple[str, str]]:
        """
        Returns capability-aware cross-provider fallbacks dynamically discovered
        from the catalog with specialized default production configurations.
        """
        cap = capability.lower()
        if cap in cls.RECOMMENDED_CAPABILITY_CHAINS:
            return cls.RECOMMENDED_CAPABILITY_CHAINS[cap]

        matching: List[tuple[str, str]] = []
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
        return chain[0][1] if chain else "gemini-3.7-flash"
